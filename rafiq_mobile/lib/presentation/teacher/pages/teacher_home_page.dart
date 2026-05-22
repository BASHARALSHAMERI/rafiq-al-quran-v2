import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:hijri_calendar/hijri_calendar.dart';

import '../../../application/auth/auth_controller.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/router/route_names.dart';
import '../../../core/theme/app_colors.dart';
import '../../shared/states/app_empty_state.dart';
import '../../shared/widgets/dashboard_stat_card.dart';
import '../../shared/widgets/page_state_view.dart';
import '../../shared/widgets/skeleton_loader.dart';
import '../../shared/widgets/role_home_layout.dart';
import '../providers/teacher_circle_overview_provider.dart';

class TeacherHomePage extends ConsumerWidget {
  const TeacherHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user =
        ref.watch(authControllerProvider.select((state) => state.user));
    final overviewAsync = ref.watch(teacherCircleOverviewProvider);
    final now = DateTime.now();

    HijriCalendarConfig.language = 'ar';
    final hijriNow = HijriCalendarConfig.now();
    final dayName = DateFormat('EEEE', 'ar').format(now);
    final gregorianDate = DateFormat('d MMMM yyyy', 'ar').format(now);
    final dateLabel =
        '$dayName، ${hijriNow.hDay} ${hijriNow.getLongMonthName()} ${hijriNow.hYear} هـ | $gregorianDate';

    final attendanceRoute =
        '${RouteNames.teacherAttendance}?date=${DateFormat('yyyy-MM-dd').format(now)}';

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(teacherCircleOverviewProvider);
          await ref.read(teacherCircleOverviewProvider.future);
        },
        child: SafeArea(
          bottom: false,
          child: overviewAsync.when(
            loading: () => const _TeacherHomeSkeleton(),
            error: (error, _) => PageStateView.error(
              title: 'تعذر تحميل لوحة المعلم',
              message: error.toString(),
              actionLabel: 'إعادة المحاولة',
              onAction: () => ref.invalidate(teacherCircleOverviewProvider),
            ),
            data: (data) {
              if (data == null) {
                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.lg,
                  ),
                  children: const [
                    SizedBox(height: AppSpacing.lg),
                    AppEmptyState(
                      title: 'لا توجد حلقة مرتبطة بالحساب',
                      subtitle:
                          'عند اختيار المركز والحلقة ستظهر هنا لوحة المعلم والمهام اليومية.',
                      icon: Icons.groups_rounded,
                    ),
                  ],
                );
              }

              final updates = <HomeUpdateData>[];

              for (final item in data.needsAttention) {
                updates.add(
                  HomeUpdateData(
                    title: item.name,
                    subtitle: item.issue,
                    icon: switch (item.severity) {
                      TeacherAttentionSeverity.absent => Icons.cancel_outlined,
                      TeacherAttentionSeverity.late => Icons.schedule_rounded,
                      TeacherAttentionSeverity.pending =>
                        Icons.info_outline_rounded,
                    },
                    color: switch (item.severity) {
                      TeacherAttentionSeverity.absent => AppColors.errorLight,
                      TeacherAttentionSeverity.late => AppColors.warningLight,
                      TeacherAttentionSeverity.pending =>
                        AppColors.primaryLight,
                    },
                  ),
                );
              }

              for (final task in data.tasks) {
                updates.add(
                  HomeUpdateData(
                    title: task.text,
                    subtitle: task.done ? 'مكتملة' : 'في انتظار الإجراء',
                    icon: task.done
                        ? Icons.check_rounded
                        : Icons.schedule_rounded,
                    color: task.done
                        ? AppColors.successLight
                        : AppColors.warningLight,
                  ),
                );
              }

              return RoleHomeLayout(
                greeting: 'أهلاً، ${user?.name ?? 'المعلم'}',
                subtitle: '${data.centerName} - ${data.circleName}',
                dateLabel: dateLabel,
                metrics: [
                  MetricData(
                    title: 'الطلاب',
                    value: '${data.totalStudents}',
                    icon: Icons.groups_outlined,
                    color: StatColor.primary,
                  ),
                  MetricData(
                    title: 'الحاضرون',
                    value: '${data.presentCount}',
                    icon: Icons.assignment_turned_in_outlined,
                    color: StatColor.success,
                  ),
                  MetricData(
                    title: 'الغائبون',
                    value: '${data.absentCount}',
                    icon: Icons.report_problem_outlined,
                    color: StatColor.destructive,
                  ),
                ],
                actions: [
                  ActionData(
                    title: 'الحضور',
                    icon: Icons.assignment_turned_in_rounded,
                    highlighted: true,
                    onTap: () => context.go(attendanceRoute),
                  ),
                  ActionData(
                    title: 'متابعة الحلقة',
                    icon: Icons.menu_book_rounded,
                    onTap: () => context.go(RouteNames.teacherHalqa),
                  ),
                  ActionData(
                    title: 'الإنجاز الجماعي',
                    icon: Icons.verified_outlined,
                    onTap: () => context.go(RouteNames.teacherGroupAchievement),
                  ),
                  ActionData(
                    title: 'ملاحظات',
                    icon: Icons.chat_bubble_outline_rounded,
                    onTap: () => context.go(RouteNames.teacherRecords),
                  ),
                  ActionData(
                    title: 'التقارير',
                    icon: Icons.bar_chart_rounded,
                    onTap: () => context.go(RouteNames.teacherHalqaReport),
                  ),
                  ActionData(
                    title: 'الخطة الشهرية',
                    icon: Icons.calendar_month_rounded,
                    onTap: () => context.go(RouteNames.teacherMonthlyPlan),
                  ),
                  ActionData(
                    title: 'تحضيري',
                    icon: Icons.how_to_reg_rounded,
                    onTap: () => context.go(RouteNames.teacherPreparation),
                  ),
                  ActionData(
                    title: 'التسميع عن بعد',
                    icon: Icons.video_call_rounded,
                    onTap: () => context.go(RouteNames.teacherRemoteRecitation),
                  ),
                  ActionData(
                    title: 'المكتبة الرقمية',
                    icon: Icons.local_library_rounded,
                    onTap: () => context.go(RouteNames.homeLibrary),
                  ),
                ],
                updates: updates,
                unreadCount: 0,
                onNotificationTap: () => context.go(RouteNames.notifications),
                onRefresh: () async {
                  ref.invalidate(teacherCircleOverviewProvider);
                  await ref.read(teacherCircleOverviewProvider.future);
                },
                emptyTitle: 'لا توجد تحديثات',
                emptySubtitle: 'ستظهر مهامك وحالات المتابعة هنا.',
              );
            },
          ),
        ),
      ),
    );
  }
}

class _TeacherHomeSkeleton extends StatelessWidget {
  const _TeacherHomeSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: const [
        SkeletonLoader(width: double.infinity, height: 180),
        SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(child: SkeletonMetricCard()),
            SizedBox(width: AppSpacing.sm),
            Expanded(child: SkeletonMetricCard()),
          ],
        ),
        SizedBox(height: AppSpacing.md),
        SkeletonCardLoader(),
        SkeletonCardLoader(),
        SkeletonCardLoader(),
      ],
    );
  }
}
