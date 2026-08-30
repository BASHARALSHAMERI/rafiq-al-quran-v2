import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:hijri_calendar/hijri_calendar.dart';

import '../../application/auth/auth_controller.dart';
import '../../application/context/context_controller.dart';
import '../../application/dashboard/dashboard_controller.dart';
import '../../application/notifications/notification_controller.dart';
import '../../application/parent/parent_dashboard_provider.dart';
import '../../application/student/student_dashboard_provider.dart';
import '../../application/sync/sync_service.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_snack_bar.dart';
import '../shared/widgets/dashboard_stat_card.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/role_home_layout.dart';
import '../../core/utils/data_parsing_helper.dart';

class SupervisorHomeView extends ConsumerStatefulWidget {
  const SupervisorHomeView({super.key});

  @override
  ConsumerState<SupervisorHomeView> createState() => _SupervisorHomeViewState();
}

class _SupervisorHomeViewState extends ConsumerState<SupervisorHomeView> {
  bool _isInit = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      return;
    }
    _isInit = true;
    Future.microtask(() async {
      await ref.read(dashboardControllerProvider.notifier).loadDashboard();
      await ref
          .read(notificationControllerProvider.notifier)
          .loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final contextState = ref.watch(contextControllerProvider);
    final dashboardState = ref.watch(dashboardControllerProvider);
    final metricsData = dashboardState.maybeWhen(
      loaded: (metrics, _) => metrics,
      orElse: () => null,
    );
    final feed = dashboardState.maybeWhen(
      loaded: (_, feedItems) => feedItems,
      orElse: () => const [],
    );
    final errorMessage = dashboardState.maybeWhen(
      error: (message) => message,
      orElse: () => null,
    );
    final isLoading = dashboardState.maybeWhen(
      loading: () => true,
      orElse: () => false,
    );

    if (errorMessage != null && metricsData == null) {
      return _ScrollableStatePage.error(
        title: 'تعذر تحميل لوحة المشرف',
        message: errorMessage,
        onAction: () =>
            ref.read(dashboardControllerProvider.notifier).loadDashboard(),
      );
    }

    final unreadCount = ref.watch(notificationControllerProvider).maybeWhen(
          loaded: (_, count) => count,
          orElse: () => 0,
        );

    final subtitle = _joinNonEmpty(
      [
        contextState.selectedCenterName,
        contextState.selectedCircleName,
      ],
      fallback: 'المركز',
    );

    return RoleHomeLayout(
      greeting: 'أهلاً، ${auth.user?.fullName ?? 'المشرف'}',
      subtitle: subtitle,
      dateLabel: _arabicDateLabel(),
      metrics: [
        MetricData(
          title: 'الحلقات المكلف بها',
          value: '${metricsData?.activeCircles ?? 0}',
          icon: Icons.groups_rounded,
          color: StatColor.primary,
        ),
        MetricData(
          title: 'الالتزام اليومي',
          value: metricsData == null
              ? '0%'
              : _formatPercentageValue(metricsData.attendanceRate),
          icon: Icons.fact_check_rounded,
          color: StatColor.success,
        ),
      ],
      actions: [
        ActionData(
          title: 'الحلقات',
          icon: Icons.groups_rounded,
          highlighted: true,
          onTap: () => context.push(RouteNames.circles),
        ),
        ActionData(
          title: 'زيارة الحلقة',
          icon: Icons.assignment_turned_in_rounded,
          onTap: () {
            final circleId = contextState.selectedCircleId;
            if (circleId != null && circleId > 0) {
              context.push(RouteNames.halqaVisit(circleId));
              return;
            }
            context.push(RouteNames.circles);
          },
        ),
        ActionData(
          title: 'تقييم المعلمين',
          icon: Icons.star_rounded,
          onTap: () => context.push(RouteNames.teacherEval),
        ),
        ActionData(
          title: 'ملاحظة إشرافية',
          icon: Icons.message_rounded,
          onTap: () => context.push(RouteNames.supervisorNotes),
        ),
        ActionData(
          title: 'التقارير',
          icon: Icons.analytics_rounded,
          onTap: () => context.push(RouteNames.supervisorReports),
        ),
        ActionData(
          title: 'لوحة العمليات',
          icon: Icons.dashboard_customize_rounded,
          onTap: () => context.push(RouteNames.supervisorOpsDashboard),
        ),
        ActionData(
          title: 'مراجعة الاختبارات',
          icon: Icons.grading_rounded,
          onTap: () => context.push(RouteNames.homeExams),
        ),
        ActionData(
          title: 'المكتبة الرقمية',
          icon: Icons.local_library_rounded,
          onTap: () => context.push(RouteNames.homeLibrary),
        ),
      ],
      updates: feed
          .take(5)
          .map(
            (item) => HomeUpdateData(
              title: item.title,
              subtitle: item.description,
              icon: _feedIcon(item.type),
              color: _feedColor(item.type),
              onTap: () {
                final metadata = item.metadata;
                switch (item.type.toUpperCase()) {
                  case 'EXAM':
                    context.push(RouteNames.homeExams);
                    break;
                  case 'ATTENDANCE':
                    final circleId = metadata != null
                        ? int.tryParse(metadata['circleId']?.toString() ?? '')
                        : null;
                    if (circleId != null && circleId > 0) {
                      context.push(RouteNames.supervisorHalqaVisit(circleId));
                    } else {
                      context.push(RouteNames.circles);
                    }
                    break;
                  case 'FOLLOW_UP':
                  case 'ACHIEVEMENT':
                  default:
                    context.push(RouteNames.circles);
                    break;
                }
              },
            ),
          )
          .toList(growable: false),
      unreadCount: unreadCount,
      onNotificationTap: () => context.push(RouteNames.homeNotifications),
      onRefresh: () =>
          ref.read(dashboardControllerProvider.notifier).loadDashboard(),
      onSyncTap: () async {
        final count = await ref.read(syncServiceProvider).syncPendingTasks();
        if (!context.mounted) {
          return;
        }
        if (count > 0) {
          AppSnackBar.success(
            context,
            'تمت مزامنة $count عملية بنجاح.',
          );
        } else {
          AppSnackBar.info(
            context,
            'لا توجد بيانات معلقة للمزامنة.',
          );
        }
      },
      emptyTitle: 'لا توجد تحديثات',
      emptySubtitle: 'ستظهر هنا أهم التنبيهات الخاصة بالحلقات المكلف بها.',
      isLoading: isLoading,
    );
  }
}

class ParentHomeView extends ConsumerStatefulWidget {
  const ParentHomeView({super.key});

  @override
  ConsumerState<ParentHomeView> createState() => _ParentHomeViewState();
}

class _ParentHomeViewState extends ConsumerState<ParentHomeView> {
  bool _isInit = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      return;
    }
    _isInit = true;
    Future.microtask(() async {
      await ref.read(parentDashboardProvider.notifier).loadChildren();
      await ref
          .read(notificationControllerProvider.notifier)
          .loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final parentState = ref.watch(parentDashboardProvider);
    final errorMessage =
        parentState.error != null && parentState.parentData == null
            ? parentState.error
            : null;

    if (errorMessage != null) {
      return _ScrollableStatePage.error(
        title: 'تعذر تحميل لوحة ولي الأمر',
        message: errorMessage,
        onAction: () =>
            ref.read(parentDashboardProvider.notifier).loadChildren(),
      );
    }

    final unreadCount = ref.watch(notificationControllerProvider).maybeWhen(
          loaded: (_, count) => count,
          orElse: () => 0,
        );
    final parentLinks = DataParsingHelper.asMapList(parentState.parentData?['parentLinks']);
    final childrenCount = parentLinks.length;
    final readyProfiles = parentState.childrenProfiles.length;
    final updates = _buildParentUpdates(context, parentState.childrenProfiles);

    return RoleHomeLayout(
      greeting: 'أهلاً، ${auth.user?.fullName ?? 'ولي الأمر'}',
      subtitle: 'متابعة الأبناء من منصة رفيق',
      dateLabel: _arabicDateLabel(),
      metrics: [
        MetricData(
          title: 'الأبناء المسجلون',
          value: '$childrenCount',
          icon: Icons.family_restroom_rounded,
          color: StatColor.primary,
        ),
        MetricData(
          title: 'ملفات الأبناء الجاهزة',
          value: '$readyProfiles',
          icon: Icons.verified_user_rounded,
          color: StatColor.success,
        ),
        MetricData(
          title: 'آخر المتابعات',
          value: '${updates.length}',
          icon: Icons.notifications_active_rounded,
          color: StatColor.info,
        ),
      ],
      actions: [
        ActionData(
          title: 'الأبناء',
          icon: Icons.school_rounded,
          highlighted: true,
          onTap: () => context.push(RouteNames.childrenList),
        ),
        ActionData(
          title: 'الإشعارات',
          icon: Icons.notifications_active_rounded,
          onTap: () => context.push(RouteNames.homeNotifications),
        ),
        ActionData(
          title: 'المكتبة الرقمية',
          icon: Icons.local_library_rounded,
          onTap: () => context.push(RouteNames.homeLibrary),
        ),
      ],
      updates: updates,
      unreadCount: unreadCount,
      onNotificationTap: () => context.push(RouteNames.homeNotifications),
      onRefresh: () =>
          ref.read(parentDashboardProvider.notifier).loadChildren(),
      emptyTitle: 'لا توجد تحديثات للأبناء',
      emptySubtitle: 'ستظهر هنا أحدث سجلات الحفظ والحضور للأبناء عند توفرها.',
      isLoading: parentState.isLoading,
    );
  }
}

class StudentHomeView extends ConsumerStatefulWidget {
  const StudentHomeView({super.key});

  @override
  ConsumerState<StudentHomeView> createState() => _StudentHomeViewState();
}

class _StudentHomeViewState extends ConsumerState<StudentHomeView> {
  bool _isInit = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      return;
    }
    _isInit = true;
    Future.microtask(() async {
      await ref.read(studentDashboardProvider.notifier).loadProfile();
      await ref
          .read(notificationControllerProvider.notifier)
          .loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final studentState = ref.watch(studentDashboardProvider);
    final errorMessage =
        studentState.error != null && studentState.profileData == null
            ? studentState.error
            : null;

    if (errorMessage != null) {
      return _ScrollableStatePage.error(
        title: 'تعذر تحميل لوحة الطالب',
        message: errorMessage,
        onAction: () =>
            ref.read(studentDashboardProvider.notifier).loadProfile(),
      );
    }

    final unreadCount = ref.watch(notificationControllerProvider).maybeWhen(
          loaded: (_, count) => count,
          orElse: () => 0,
        );
    final data = studentState.profileData;
    final metrics = DataParsingHelper.asMap(data?['metrics']);
    final profile = DataParsingHelper.asMap(data?['studentProfile']);
    final enrollments = DataParsingHelper.asMapList(data?['studentEnrollments']);
    final firstEnrollment =
        enrollments.isNotEmpty ? enrollments.first : const <String, dynamic>{};
    final circle = DataParsingHelper.asMap(firstEnrollment['circle']);
    final center = DataParsingHelper.asMap(circle['center']);
    final followUps = DataParsingHelper.asMapList(data?['followUpsAsStudent']);

    final subtitle = _joinNonEmpty(
      [
        DataParsingHelper.readString(center['name']),
        DataParsingHelper.readString(circle['name']),
      ],
      fallback: 'رحلتك القرآنية مستمرة',
    );
    final lastRating = followUps.isNotEmpty
        ? DataParsingHelper.ratingLabel(followUps.first['rating'])
        : 'لا يوجد';
    final currentJuzz = DataParsingHelper.readInt(profile['currentJuzz']) ??
        DataParsingHelper.readInt(metrics['memorizedJuzz']) ??
        0;
    final updates = _buildStudentUpdates(context, data);

    return RoleHomeLayout(
      greeting: 'أهلاً، ${auth.user?.fullName ?? 'الطالب'}',
      subtitle: subtitle,
      dateLabel: _arabicDateLabel(),
      metrics: [
        MetricData(
          title: 'نسبة الحضور',
          value: '${metrics['attendancePercentage'] ?? 0}%',
          icon: Icons.calendar_month_rounded,
          color: StatColor.primary,
        ),
        MetricData(
          title: 'الجزء الحالي',
          value: currentJuzz > 0 ? '$currentJuzz' : '-',
          icon: Icons.flag_rounded,
          color: StatColor.info,
        ),
        MetricData(
          title: 'آخر تقييم',
          value: lastRating,
          icon: Icons.workspace_premium_rounded,
          color: StatColor.success,
        ),
      ],
      actions: [
        ActionData(
          title: 'رحلتي القرآنية',
          icon: Icons.auto_stories_rounded,
          highlighted: true,
          onTap: () => context.push(RouteNames.studentJourney),
        ),
        ActionData(
          title: 'المكتبة الرقمية',
          icon: Icons.local_library_rounded,
          onTap: () => context.push(RouteNames.homeLibrary),
        ),
        ActionData(
          title: 'التسميع عن بعد',
          icon: Icons.video_call_rounded,
          onTap: () => context.push(RouteNames.studentRemoteRecitation),
        ),
        ActionData(
          title: 'الاختبارات',
          icon: Icons.grading_rounded,
          onTap: () => context.push(RouteNames.homeExams),
        ),
      ],
      updates: updates,
      unreadCount: unreadCount,
      onNotificationTap: () => context.push(RouteNames.homeNotifications),
      onRefresh: () =>
          ref.read(studentDashboardProvider.notifier).loadProfile(),
      emptyTitle: 'لا توجد تحديثات جديدة',
      emptySubtitle:
          'ستظهر هنا آخر السجلات المرتبطة بالحفظ والحضور والاختبارات.',
      isLoading: studentState.isLoading,
    );
  }
}

class _ScrollableStatePage extends StatelessWidget {
  final Widget child;

  const _ScrollableStatePage({required this.child});

  factory _ScrollableStatePage.error({
    required String title,
    required String message,
    required VoidCallback onAction,
  }) {
    return _ScrollableStatePage(
      child: PageStateView.error(
        title: title,
        message: message,
        actionLabel: 'إعادة المحاولة',
        onAction: onAction,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.7,
            child: child,
          ),
        ],
      ),
    );
  }
}

List<HomeUpdateData> _buildParentUpdates(
  BuildContext context,
  Map<int, Map<String, dynamic>> childrenProfiles,
) {
  final updates = <HomeUpdateData>[];

  for (final entry in childrenProfiles.entries) {
    final childId = entry.key;
    final profile = entry.value;
    final studentName = DataParsingHelper.readString(profile['fullName'], fallback: 'الابن');
    final followUps = DataParsingHelper.asMapList(profile['followUpsAsStudent']);
    if (followUps.isNotEmpty) {
      final followUp = followUps.first;
      updates.add(
        HomeUpdateData(
          title: 'آخر تسميع لـ $studentName',
          subtitle:
              '${DataParsingHelper.readString(followUp['surah'], fallback: 'غير محدد')} • ${DataParsingHelper.ratingLabel(followUp['rating'])}',
          icon: Icons.menu_book_rounded,
          color: DataParsingHelper.ratingColor(followUp['rating']),
          onTap: () => context.push(RouteNames.parentChildDetail(childId.toString())),
        ),
      );
    } else {
      final attendances = DataParsingHelper.asMapList(profile['attendancesAsStudent']);
      if (attendances.isNotEmpty) {
        final attendance = attendances.first;
        updates.add(
          HomeUpdateData(
            title: 'آخر حضور لـ $studentName',
            subtitle: DataParsingHelper.attendanceStatusLabel(attendance['status']),
            icon: Icons.calendar_month_rounded,
            color: DataParsingHelper.attendanceStatusColor(attendance['status']),
            onTap: () => context.push(RouteNames.parentChildDetail(childId.toString())),
          ),
        );
      }
    }

    if (updates.length == 4) {
      break;
    }
  }

  return updates;
}

List<HomeUpdateData> _buildStudentUpdates(BuildContext context, Map<String, dynamic>? data) {
  final updates = <HomeUpdateData>[];
  final followUps = DataParsingHelper.asMapList(data?['followUpsAsStudent']);
  for (final followUp in followUps.take(4)) {
    updates.add(
      HomeUpdateData(
        title: DataParsingHelper.readString(
          followUp['surah'],
          fallback: 'متابعة جديدة',
        ),
        subtitle:
            '${_followUpTypeLabel(followUp['type'])} • ${DataParsingHelper.ratingLabel(followUp['rating'])}',
        icon: Icons.auto_stories_rounded,
        color: DataParsingHelper.ratingColor(followUp['rating']),
        onTap: () => context.push(RouteNames.studentJourney),
      ),
    );
  }

  if (updates.isNotEmpty) {
    return updates;
  }

  final attendances = DataParsingHelper.asMapList(data?['attendancesAsStudent']);
  for (final attendance in attendances.take(4)) {
    updates.add(
      HomeUpdateData(
        title: 'تحديث حضور',
        subtitle: DataParsingHelper.attendanceStatusLabel(attendance['status']),
        icon: Icons.calendar_today_rounded,
        color: DataParsingHelper.attendanceStatusColor(attendance['status']),
        onTap: () => context.push(RouteNames.studentJourney),
      ),
    );
  }
  return updates;
}

String _arabicDateLabel() {
  final now = DateTime.now();
  HijriCalendarConfig.language = 'ar';
  final hijriNow = HijriCalendarConfig.now();
  final dayName = DateFormat('EEEE', 'ar').format(now);
  final gregorianDate = DateFormat('d MMMM yyyy', 'ar').format(now);
  
  return '$dayName، ${hijriNow.hDay} ${hijriNow.getLongMonthName()} ${hijriNow.hYear} هـ | $gregorianDate';
}

String _formatPercentageValue(double value) {
  final normalized = value <= 1 ? value * 100 : value;
  return '${normalized.round()}%';
}



String _joinNonEmpty(
  List<String?> items, {
  required String fallback,
}) {
  final parts = items
      .map((item) => item?.trim() ?? '')
      .where((item) => item.isNotEmpty)
      .toList(growable: false);
  if (parts.isEmpty) {
    return fallback;
  }
  return parts.join(' • ');
}



String _followUpTypeLabel(dynamic rawValue) {
  switch (DataParsingHelper.readString(rawValue).toUpperCase()) {
    case 'HIFZ':
      return 'حفظ';
    case 'MURAAJAAH':
    case 'REVIEW':
      return 'مراجعة';
    case 'MATN':
      return 'متن';
    default:
      return 'متابعة';
  }
}

IconData _feedIcon(String rawType) {
  switch (rawType.toUpperCase()) {
    case 'EXAM':
      return Icons.grading_rounded;
    case 'ATTENDANCE':
      return Icons.calendar_month_rounded;
    case 'ACHIEVEMENT':
      return Icons.emoji_events_rounded;
    case 'FOLLOW_UP':
    default:
      return Icons.track_changes_rounded;
  }
}

Color _feedColor(String rawType) {
  switch (rawType.toUpperCase()) {
    case 'EXAM':
      return AppColors.warningLight;
    case 'ATTENDANCE':
      return AppColors.successLight;
    case 'ACHIEVEMENT':
      return AppColors.accentLight;
    case 'FOLLOW_UP':
    default:
      return AppColors.primaryLight;
  }
}
