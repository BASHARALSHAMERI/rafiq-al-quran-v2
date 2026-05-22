import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../sync/sync_queue_service.dart';
import '../../domain/entities/attendance.dart';
import 'attendance_providers.dart';
import 'attendance_state.dart';

enum AttendanceSubmitOutcome {
  submitted,
  queuedOffline,
  failed,
}

class AttendanceController extends StateNotifier<AttendanceState> {
  final Ref _ref;

  AttendanceController(this._ref)
      : super(
          AttendanceState(
            selectedDate: _dateOnly(DateTime.now()),
          ),
        );

  void setSelectedDate(DateTime date) {
    state = state.copyWith(selectedDate: _dateOnly(date));
  }

  Future<void> loadForDate({
    required String circleId,
    DateTime? date,
  }) async {
    final selected = _dateOnly(date ?? state.selectedDate);
    state = state.copyWith(
      isLoading: true,
      isOffline: false,
      selectedDate: selected,
      clearError: true,
    );

    try {
      final repository = _ref.read(attendanceRepositoryProvider);
      final dateIso = _formatDate(selected);

      final result = await Future.wait([
        repository.getCircleStudents(circleId),
        repository.getAttendanceForDate(circleId, dateIso),
      ]);

      final students = result[0] as List<Student>;
      final existing = result[1] as List<AttendanceRecord>;

      final existingByStudent = <String, AttendanceRecord>{
        for (final item in existing) item.studentId: item,
      };

      final draft = <String, AttendanceDraftItem>{};
      for (final student in students) {
        final current = existingByStudent[student.id];
        draft[student.id] = AttendanceDraftItem(
          status: current?.status ?? AttendanceStatus.present,
          note: current?.note ?? '',
        );
      }

      state = state.copyWith(
        isLoading: false,
        isOffline: false,
        students: students,
        draftByStudentId: draft,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        isOffline: _isOfflineError(error),
        error: _mapLoadError(error),
      );
    }
  }

  void updateStatus(String studentId, AttendanceStatus status) {
    final current = state.draftByStudentId[studentId] ??
        const AttendanceDraftItem(status: AttendanceStatus.present);
    final updated =
        Map<String, AttendanceDraftItem>.from(state.draftByStudentId)
          ..[studentId] = current.copyWith(status: status);
    state = state.copyWith(draftByStudentId: updated);
  }

  void updateNote(String studentId, String note) {
    final current = state.draftByStudentId[studentId] ??
        const AttendanceDraftItem(status: AttendanceStatus.present);
    final updated =
        Map<String, AttendanceDraftItem>.from(state.draftByStudentId)
          ..[studentId] = current.copyWith(note: note);
    state = state.copyWith(draftByStudentId: updated);
  }

  void markAllPresent() {
    if (state.students.isEmpty) {
      return;
    }
    final updated = <String, AttendanceDraftItem>{};
    for (final student in state.students) {
      final current = state.draftByStudentId[student.id];
      updated[student.id] = AttendanceDraftItem(
        status: AttendanceStatus.present,
        note: current?.note ?? '',
      );
    }
    state = state.copyWith(draftByStudentId: updated);
  }

  List<String> collectValidationIssues() {
    final issues = <String>[];
    final missingExcusedNotes = state.draftByStudentId.values.where((item) {
      return item.status == AttendanceStatus.excused &&
          item.note.trim().isEmpty;
    }).length;

    if (missingExcusedNotes > 0) {
      issues.add(
        missingExcusedNotes == 1
            ? 'يوجد طالب بعذر بدون سبب مكتوب.'
            : 'يوجد $missingExcusedNotes طلاب بعذر بدون سبب مكتوب.',
      );
    }

    return issues;
  }

  Future<AttendanceSubmitOutcome> submit({required String circleId}) async {
    if (state.students.isEmpty) {
      state = state.copyWith(error: 'لا يوجد طلاب متاحون للتحضير.');
      return AttendanceSubmitOutcome.failed;
    }
    final validationIssues = collectValidationIssues();
    if (validationIssues.isNotEmpty) {
      state = state.copyWith(error: validationIssues.first);
      return AttendanceSubmitOutcome.failed;
    }

    state = state.copyWith(
      isSubmitting: true,
      isOffline: false,
      clearError: true,
    );
    try {
      final repository = _ref.read(attendanceRepositoryProvider);
      final dateIso = _formatDate(state.selectedDate);

      final records = state.students.map((student) {
        final item = state.draftByStudentId[student.id] ??
            const AttendanceDraftItem(status: AttendanceStatus.present);
        final note = item.note.trim();
        return AttendanceRecord(
          studentId: student.id,
          circleId: circleId,
          date: dateIso,
          status: item.status,
          note: note.isEmpty ? null : note,
        );
      }).toList(growable: false);

      final result = await repository.submitBulkAttendance(
        BulkAttendanceSubmission(
          circleId: circleId,
          date: dateIso,
          records: records,
        ),
      );

      if (result == AttendanceSubmitResult.queuedOffline) {
        state = state.copyWith(
          isSubmitting: false,
          isOffline: true,
          clearError: true,
        );
        return AttendanceSubmitOutcome.queuedOffline;
      }

      state = state.copyWith(
        isSubmitting: false,
        isOffline: false,
        clearError: true,
      );
      return AttendanceSubmitOutcome.submitted;
    } catch (error) {
      if (_isOfflineError(error)) {
         await _ref.read(syncQueueServiceProvider.notifier).addToQueue(
          path: '/attendance/bulk', // Simplified for students
          method: 'POST',
          data: {
             'circleId': circleId,
             'date': _formatDate(state.selectedDate),
             'records': state.students.map((s) => {
               'studentId': s.id,
               'status': (state.draftByStudentId[s.id]?.status ?? AttendanceStatus.present).name.toUpperCase(),
               'note': state.draftByStudentId[s.id]?.note,
             }).toList(),
          },
          description: 'تحضير طلاب حلقة #$circleId',
        );
        state = state.copyWith(
          isSubmitting: false,
          isOffline: true,
          clearError: true,
        );
        return AttendanceSubmitOutcome.queuedOffline;
      }
      state = state.copyWith(
        isSubmitting: false,
        isOffline: _isOfflineError(error),
        error: _mapSubmitError(error),
      );
      return AttendanceSubmitOutcome.failed;
    }
  }

  String _mapLoadError(Object error) {
    if (error is DioException) {
      final code = error.response?.statusCode;
      if (code == 404) {
        return 'واجهات الحضور غير متوفرة حاليًا في الخادم.';
      }
      if (_isOfflineError(error)) {
        return 'تعذر الاتصال بالخادم، ولم يتم العثور على نسخة محلية حديثة.';
      }
      return 'تعذر تحميل بيانات الحضور (${code ?? '-'})';
    }
    return 'تعذر تحميل بيانات الحضور.';
  }

  String _mapSubmitError(Object error) {
    if (error is DioException) {
      final code = error.response?.statusCode;
      if (code == 404) {
        return 'واجهة إرسال الحضور غير متوفرة في الخادم.';
      }
      if (code == 409) {
        return 'تم تسجيل حضور هذا اليوم مسبقًا.';
      }
      if (_isOfflineError(error)) {
        return 'لا يوجد اتصال. تم حفظ التغييرات محليًا وسيتم رفعها تلقائيًا عند عودة الاتصال.';
      }
      return 'تعذر حفظ الحضور (${code ?? '-'})';
    }
    return 'تعذر حفظ الحضور.';
  }

  bool _isOfflineError(Object error) {
    if (error is! DioException) {
      return false;
    }
    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout;
  }

  static DateTime _dateOnly(DateTime input) {
    return DateTime(input.year, input.month, input.day);
  }

  String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }
}

final attendanceControllerProvider =
    StateNotifierProvider<AttendanceController, AttendanceState>((ref) {
  return AttendanceController(ref);
});
