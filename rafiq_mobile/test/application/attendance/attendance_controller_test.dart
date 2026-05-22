import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rafiq_mobile/application/attendance/attendance_controller.dart';
import 'package:rafiq_mobile/application/attendance/attendance_providers.dart';
import 'package:rafiq_mobile/domain/entities/attendance.dart';
import 'package:rafiq_mobile/domain/repositories/attendance_repository.dart';

void main() {
  late ProviderContainer container;
  late _FakeAttendanceRepository repository;
  late AttendanceController controller;

  setUp(() {
    repository = _FakeAttendanceRepository();
    container = ProviderContainer(
      overrides: [
        attendanceRepositoryProvider.overrideWithValue(repository),
      ],
    );
    controller = container.read(attendanceControllerProvider.notifier);
  });

  tearDown(() {
    container.dispose();
  });

  test('collectValidationIssues reports excused absence without note',
      () async {
    await controller.loadForDate(
      circleId: '10',
      date: DateTime(2026, 3, 8),
    );

    controller.updateStatus('1', AttendanceStatus.excused);

    expect(
      controller.collectValidationIssues(),
      contains('يوجد طالب بعذر بدون سبب مكتوب.'),
    );
  });

  test('submit fails before hitting repository when excuse note is missing',
      () async {
    await controller.loadForDate(
      circleId: '10',
      date: DateTime(2026, 3, 8),
    );

    controller.updateStatus('1', AttendanceStatus.excused);

    final outcome = await controller.submit(circleId: '10');

    expect(outcome, AttendanceSubmitOutcome.failed);
    expect(repository.submitCalls, 0);
  });
}

class _FakeAttendanceRepository implements AttendanceRepository {
  int submitCalls = 0;

  @override
  Future<List<AttendanceRecord>> getAttendanceForDate(
    String circleId,
    String date,
  ) async {
    return const [];
  }

  @override
  Future<List<Student>> getCircleStudents(String circleId) async {
    return const [
      Student(
        id: '1',
        name: 'طالب 1',
        enrollmentId: 'ENR-1',
      ),
    ];
  }

  @override
  Future<AttendanceSubmitResult> submitBulkAttendance(
    BulkAttendanceSubmission submission,
  ) async {
    submitCalls += 1;
    return AttendanceSubmitResult.submitted;
  }
}
