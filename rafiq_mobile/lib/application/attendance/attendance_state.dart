import '../../domain/entities/attendance.dart';

class AttendanceDraftItem {
  final AttendanceStatus status;
  final String note;

  const AttendanceDraftItem({
    required this.status,
    this.note = '',
  });

  AttendanceDraftItem copyWith({
    AttendanceStatus? status,
    String? note,
  }) {
    return AttendanceDraftItem(
      status: status ?? this.status,
      note: note ?? this.note,
    );
  }
}

class AttendanceState {
  final bool isLoading;
  final bool isSubmitting;
  final bool isOffline;
  final String? error;
  final DateTime selectedDate;
  final List<Student> students;
  final Map<String, AttendanceDraftItem> draftByStudentId;

  const AttendanceState({
    this.isLoading = false,
    this.isSubmitting = false,
    this.isOffline = false,
    this.error,
    required this.selectedDate,
    this.students = const [],
    this.draftByStudentId = const {},
  });

  AttendanceState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    bool? isOffline,
    String? error,
    DateTime? selectedDate,
    List<Student>? students,
    Map<String, AttendanceDraftItem>? draftByStudentId,
    bool clearError = false,
  }) {
    return AttendanceState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isOffline: isOffline ?? this.isOffline,
      error: clearError ? null : (error ?? this.error),
      selectedDate: selectedDate ?? this.selectedDate,
      students: students ?? this.students,
      draftByStudentId: draftByStudentId ?? this.draftByStudentId,
    );
  }
}
