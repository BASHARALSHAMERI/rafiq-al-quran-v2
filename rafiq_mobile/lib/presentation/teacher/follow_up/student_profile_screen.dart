import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/enums/user_role.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/entities/student_profile.dart';
import '../../shared/providers/current_user_role_provider.dart';
import 'providers/follow_up_providers.dart';
import 'widgets/student_follow_up_tab.dart';
import 'widgets/student_profile_sections.dart';
import 'widgets/student_profile_tabs.dart';

class StudentProfileScreen extends ConsumerStatefulWidget {
  final int studentId;

  const StudentProfileScreen({super.key, required this.studentId});

  @override
  ConsumerState<StudentProfileScreen> createState() =>
      _StudentProfileScreenState();
}

class _StudentProfileScreenState extends ConsumerState<StudentProfileScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(studentProfileProvider(widget.studentId));

    return Scaffold(
      backgroundColor: AppColors.surfaceLight,
      body: profileAsync.when(
        data: _buildBody,
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primaryLight),
        ),
        error: (error, _) => StudentProfileErrorState(
          error: error,
          onRetry: () =>
              ref.invalidate(studentProfileProvider(widget.studentId)),
        ),
      ),
    );
  }

  Widget _buildBody(StudentProfile profile) {
    final currentRole = ref.watch(currentUserRoleProvider);
    final canManageAttendance = currentRole?.canManageAttendance ?? false;
    final canRecordFollowUp = currentRole?.canEvaluateStudents ?? false;
    final memorizedText = '${profile.memorizedJuzz} جزء';
    final attendanceText = '${profile.attendancePercentage}%';
    final latestEvaluationText =
        profile.recentRating == null ? 'لا يوجد' : '${profile.recentRating}/5';

    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        StudentProfileHeaderSliver(
          profile: profile,
          onBack: () => context.pop(),
          onRefresh: () =>
              ref.invalidate(studentProfileProvider(widget.studentId)),
          showAttendanceAction: canManageAttendance,
          onAttendanceTap: canManageAttendance
              ? () => context.push(
                    RouteNames.attendanceMarkWithDate(
                      DateTime.now().toIso8601String().split('T').first,
                    ),
                  )
              : null,
        ),
        StudentProfileStatsSliver(
          primaryMetricLabel: 'آخر تقييم',
          primaryMetricValue: latestEvaluationText,
          attendanceText: attendanceText,
          memorizedText: memorizedText,
        ),
        SliverPersistentHeader(
          pinned: true,
          delegate: StudentProfileTabBarDelegate(controller: _tabController),
        ),
      ],
      body: TabBarView(
        controller: _tabController,
        children: [
          StudentFollowUpTab(
            studentId: widget.studentId,
            readOnly: !canRecordFollowUp,
          ),
          StudentProfileSummaryTab(profile: profile),
          StudentProfileAttendanceTab(profile: profile),
          StudentProfileExamsTab(profile: profile),
        ],
      ),
    );
  }
}
