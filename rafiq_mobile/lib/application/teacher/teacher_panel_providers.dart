import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../application/context/context_controller.dart';
import '../../data/datasources/teacher_panel_remote_datasource.dart';
import '../../data/models/teacher_panel_dtos.dart';

typedef YearMonth = ({int month, int year});
typedef TeacherStudentMonthlyReportQuery = ({
  int studentId,
  int month,
  int year,
});

final teacherPanelRemoteDataSourceProvider =
    Provider<TeacherPanelRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return TeacherPanelRemoteDataSourceImpl(dio: dio);
});

YearMonth currentYearMonth() {
  final now = DateTime.now();
  return (month: now.month, year: now.year);
}

final teacherMonthlyPlansProvider =
    FutureProvider.family<TeacherMonthlyPlansListDto, YearMonth>(
        (ref, period) async {
  final selectedCircleId = ref.watch(
    contextControllerProvider.select((state) => state.selectedCircleId),
  );
  final circleId = int.tryParse(selectedCircleId ?? '');
  if (circleId == null) {
    return TeacherMonthlyPlansListDto(
      month: period.month,
      year: period.year,
      summary: const TeacherMonthlyPlansSummaryDto(
        total: 0,
        approved: 0,
        pending: 0,
        modified: 0,
      ),
      plans: const [],
    );
  }

  return ref.read(teacherPanelRemoteDataSourceProvider).getMonthlyPlans(
        circleId: circleId,
        month: period.month,
        year: period.year,
      );
});

final teacherMonthlyPlanDetailsProvider =
    FutureProvider.family<TeacherMonthlyPlanDto, int>((ref, planId) {
  return ref.read(teacherPanelRemoteDataSourceProvider).getMonthlyPlan(planId);
});

final teacherPreparationProvider =
    FutureProvider.family<TeacherPreparationDto?, YearMonth>(
        (ref, period) async {
  final selectedCircleId = ref.watch(
    contextControllerProvider.select((state) => state.selectedCircleId),
  );
  final circleId = int.tryParse(selectedCircleId ?? '');
  if (circleId == null) {
    return null;
  }

  return ref.read(teacherPanelRemoteDataSourceProvider).getTeacherPreparation(
        circleId: circleId,
        month: period.month,
        year: period.year,
      );
});

final teacherHalqaMonthlyReportProvider =
    FutureProvider.family<TeacherHalqaReportDto?, YearMonth>(
        (ref, period) async {
  final selectedCircleId = ref.watch(
    contextControllerProvider.select((state) => state.selectedCircleId),
  );
  final circleId = int.tryParse(selectedCircleId ?? '');
  if (circleId == null) {
    return null;
  }

  return ref
      .read(teacherPanelRemoteDataSourceProvider)
      .getTeacherHalqaMonthlyReport(
        circleId: circleId,
        month: period.month,
        year: period.year,
      );
});

final teacherStudentMonthlyReportProvider = FutureProvider.family<
    Map<String, dynamic>, TeacherStudentMonthlyReportQuery>((ref, query) {
  return ref.read(teacherPanelRemoteDataSourceProvider).getStudentMonthlyReport(
        studentId: query.studentId,
        month: query.month,
        year: query.year,
      );
});
