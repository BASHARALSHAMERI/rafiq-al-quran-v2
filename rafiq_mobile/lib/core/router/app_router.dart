import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../application/auth/auth_controller.dart';
import '../../application/context/context_controller.dart';
import '../../application/context/context_state.dart';
import '../../core/enums/user_role.dart';
import '../../data/models/supervisor_visit_dtos.dart';
import '../../presentation/attendance/attendance_mark_screen.dart';
import '../../presentation/auth/forgot_password_screen.dart';
import '../../presentation/auth/login_screen.dart';
import '../../presentation/context/center_selection_screen.dart';
import '../../presentation/context/circle_selection_screen.dart';
import '../../presentation/context/profile_screen.dart';
import '../../presentation/context/role_based_shell.dart';
import '../../presentation/context/role_home_views.dart';
import '../../presentation/exams/exams_list_screen.dart';
import '../../presentation/teacher/follow_up/group_achievement_screen.dart';
import '../../presentation/teacher/follow_up/monthly_plan_screen.dart';
import '../../presentation/teacher/follow_up/records_screen.dart';
import '../../presentation/teacher/follow_up/student_profile_screen.dart';
import '../../presentation/library/library_screen.dart';
import '../../presentation/notifications/notification_details_screen.dart';
import '../../presentation/notifications/notifications_screen.dart';
import '../../presentation/parent/child_attendance_screen.dart';
import '../../presentation/parent/child_detail_screen.dart';
import '../../presentation/parent/child_results_screen.dart';
import '../../presentation/parent/children_list_screen.dart';
import '../../presentation/remote_recitation/student_remote_recitation_screen.dart';
import '../../presentation/remote_recitation/teacher_remote_recitation_screen.dart';
import '../../presentation/shared/widgets/page_state_view.dart';
import '../../presentation/splash/splash_screen.dart';
import '../../presentation/student/memorization_log_screen.dart';
import '../../presentation/student/progress_screen.dart';
import '../../presentation/student/student_journey_screen.dart';
import '../../presentation/teacher/students/students_list_screen.dart';
import '../../presentation/supervisor/supervisor_circles_screen.dart';
import '../../presentation/supervisor/supervisor_notes_screen.dart';
import '../../presentation/supervisor/supervisor_reports_screen.dart';
import '../../presentation/supervisor/supervisor_today_visits_screen.dart';
import '../../presentation/supervisor/supervisor_visit_lifecycle_screen.dart';
import '../../presentation/supervisor/teacher_evaluation_screen.dart';
import '../../presentation/teacher/pages/teacher_home_page.dart';
import '../../presentation/teacher/teacher_monthly_plan_details_screen.dart';
import '../../presentation/teacher/teacher_preparation_screen.dart';
import '../../presentation/teacher/student_monthly_report_screen.dart';
import '../../presentation/teacher/teacher_halqa_report_screen.dart';
import 'route_names.dart';

class RouterRefreshNotifier extends ChangeNotifier {
  void refresh() => notifyListeners();
}

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _homeNavKey = GlobalKey<NavigatorState>(debugLabel: 'homeNav');
final _primaryNavKey = GlobalKey<NavigatorState>(debugLabel: 'primaryNav');
final _secondaryNavKey = GlobalKey<NavigatorState>(debugLabel: 'secondaryNav');
final _notificationsNavKey =
    GlobalKey<NavigatorState>(debugLabel: 'notificationsNav');
final _profileNavKey = GlobalKey<NavigatorState>(debugLabel: 'profileNav');

final routerRefreshNotifierProvider = Provider<RouterRefreshNotifier>((ref) {
  final notifier = RouterRefreshNotifier();
  ref.listen<int>(
    authControllerProvider.select(
      (state) => Object.hash(
        state.isInitialized,
        state.isAuthenticated,
        state.user?.role,
      ),
    ),
    (_, __) => notifier.refresh(),
  );
  ref.listen<int>(
    contextControllerProvider.select(
      (state) => Object.hash(
        state.isInitialized,
        state.selectedCenterId,
        state.selectedCircleId,
      ),
    ),
    (_, __) => notifier.refresh(),
  );
  ref.onDispose(notifier.dispose);
  return notifier;
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final refreshListenable = ref.watch(routerRefreshNotifierProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: RouteNames.splash,
    refreshListenable: refreshListenable,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final contextState = ref.read(contextControllerProvider);
      final location = state.uri.path;
      final isSplash = location == RouteNames.splash;

      if (!authState.isInitialized || !contextState.isInitialized) {
        return isSplash ? null : RouteNames.splash;
      }

      final role = parseUserRole(authState.user?.role);
      if (!authState.isAuthenticated) {
        return _isPublicRoute(location) ? null : RouteNames.login;
      }

      if (role == null || role.isWebOnly) {
        return location == RouteNames.forbidden ? null : RouteNames.forbidden;
      }

      if (_isPublicRoute(location)) {
        return _landingRouteFor(role, contextState);
      }

      if (_isContextSelectionRoute(location)) {
        return _redirectForContextSelection(location, role, contextState);
      }

      if (!RoleGuards.canAccess(location, role)) {
        return location == RouteNames.forbidden ? null : RouteNames.forbidden;
      }

      if (_requiresContextBeforeAccess(location, role)) {
        if (!contextState.hasSelectedCenter) {
          return RouteNames.selectCenter;
        }
        if (!role.requiresCenterOnly && !contextState.hasSelectedCircle) {
          return RouteNames.selectCircle;
        }
      }

      return null;
    },
    errorBuilder: (context, state) => const _RouteGuardScreen.notFound(),
    routes: [
      GoRoute(
        path: RouteNames.root,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SizedBox.shrink(),
      ),
      GoRoute(
        path: RouteNames.splash,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: RouteNames.login,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteNames.forgotPassword,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: RouteNames.selectCenter,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CenterSelectionScreen(),
      ),
      GoRoute(
        path: RouteNames.selectCircle,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CircleSelectionScreen(),
      ),
      GoRoute(
        path: RouteNames.forbidden,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final role =
              parseUserRole(ref.read(authControllerProvider).user?.role);
          if (role == null || role.isWebOnly) {
            return const _RouteGuardScreen.mobileUnsupported();
          }
          return const _RouteGuardScreen.forbidden();
        },
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return RoleBasedShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _homeNavKey,
            routes: [
              GoRoute(
                path: RouteNames.teacherHome,
                builder: (context, state) => const TeacherHomePage(),
              ),
              GoRoute(
                path: RouteNames.supervisorHome,
                builder: (context, state) => const SupervisorHomeView(),
              ),
              GoRoute(
                path: RouteNames.studentHome,
                builder: (context, state) => const StudentHomeView(),
              ),
              GoRoute(
                path: RouteNames.parentHome,
                builder: (context, state) => const ParentHomeView(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _primaryNavKey,
            routes: [
              GoRoute(
                path: RouteNames.teacherHalqa,
                builder: (context, state) => const StudentsListScreen(),
              ),
              GoRoute(
                path: RouteNames.teacherStudentPath,
                builder: (context, state) => _buildPositiveIntRoute(
                  state,
                  parameterName: 'id',
                  builder: (id) => StudentProfileScreen(studentId: id),
                ),
              ),
              GoRoute(
                path: RouteNames.teacherAttendance,
                builder: (context, state) {
                  final date = state.uri.queryParameters['date'];
                  final safeDate = date == null || date.trim().isEmpty
                      ? DateFormat('yyyy-MM-dd').format(DateTime.now())
                      : date;
                  return AttendanceMarkScreen(dateIso: safeDate);
                },
              ),
              GoRoute(
                path: RouteNames.teacherPreparation,
                builder: (context, state) => const TeacherPreparationScreen(),
              ),
              GoRoute(
                path: RouteNames.teacherRemoteRecitation,
                builder: (context, state) =>
                    const TeacherRemoteRecitationScreen(),
              ),
              GoRoute(
                path: RouteNames.teacherGroupAchievement,
                builder: (context, state) => const GroupAchievementScreen(),
              ),
              GoRoute(
                path: RouteNames.teacherMonthlyPlan,
                builder: (context, state) => const MonthlyPlanScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) => _buildPositiveIntRoute(
                      state,
                      parameterName: 'id',
                      builder: (id) =>
                          TeacherMonthlyPlanDetailsScreen(planId: id),
                    ),
                  ),
                ],
              ),
              GoRoute(
                path: RouteNames.supervisorHalaqat,
                builder: (context, state) => const SupervisorCirclesScreen(),
              ),
              GoRoute(
                path: RouteNames.supervisorTodayVisits,
                builder: (context, state) =>
                    const SupervisorTodayVisitsScreen(),
              ),
              GoRoute(
                path: RouteNames.supervisorHalqaVisitPath,
                builder: (context, state) => _buildPositiveIntRoute(
                  state,
                  parameterName: 'id',
                  builder: (id) {
                    final extra = state.extra;
                    final log = extra is Map<String, Object?> &&
                            extra['log'] is SupervisorVisitLogDto
                        ? extra['log'] as SupervisorVisitLogDto
                        : null;
                    final planItemId = extra is Map<String, Object?>
                        ? extra['planItemId'] as int?
                        : null;
                    return SupervisorVisitLifecycleScreen(
                      circleId: id,
                      initialLog: log,
                      initialPlanItemId: planItemId,
                    );
                  },
                ),
              ),
              GoRoute(
                path: RouteNames.supervisorTeacherEval,
                builder: (context, state) => const TeacherEvaluationScreen(),
              ),
              GoRoute(
                path: RouteNames.supervisorNotes,
                builder: (context, state) => const SupervisorNotesScreen(),
              ),
              // GoRoute(
              //   path: RouteNames.studentAssignments,
              //   builder: (context, state) => const AssignmentsScreen(),
              // ),
              GoRoute(
                path: RouteNames.studentRemoteRecitation,
                builder: (context, state) =>
                    const StudentRemoteRecitationScreen(),
              ),
              GoRoute(
                path: RouteNames.studentMemorizationLog,
                builder: (context, state) => const MemorizationLogScreen(),
              ),
              GoRoute(
                path: RouteNames.studentExams,
                builder: (context, state) => const ExamsListScreen(),
              ),
              GoRoute(
                path: RouteNames.studentJourney,
                builder: (context, state) => const StudentJourneyScreen(),
              ),
              GoRoute(
                path: RouteNames.parentChildren,
                builder: (context, state) => const ChildrenListScreen(),
              ),
              GoRoute(
                path: RouteNames.parentChildPath,
                builder: (context, state) => _buildRequiredTextRoute(
                  state,
                  parameterName: 'childId',
                  builder: (childId) => ChildDetailScreen(childId: childId),
                ),
              ),
              GoRoute(
                path: RouteNames.parentChildAttendancePath,
                builder: (context, state) => _buildRequiredTextRoute(
                  state,
                  parameterName: 'childId',
                  builder: (childId) => ChildAttendanceScreen(childId: childId),
                ),
              ),
              GoRoute(
                path: RouteNames.parentChildResultsPath,
                builder: (context, state) => _buildRequiredTextRoute(
                  state,
                  parameterName: 'childId',
                  builder: (childId) => ChildResultsScreen(childId: childId),
                ),
              ),
              GoRoute(
                path: RouteNames.homeLibrary,
                builder: (context, state) => const LibraryScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _secondaryNavKey,
            routes: [
              GoRoute(
                path: RouteNames.teacherRecords,
                builder: (context, state) => const RecordsScreen(),
              ),
              GoRoute(
                path: RouteNames.teacherHalqaReport,
                builder: (context, state) => const TeacherHalqaReportScreen(),
              ),
              GoRoute(
                path: RouteNames.teacherStudentReportPath,
                builder: (context, state) => _buildPositiveIntRoute(
                  state,
                  parameterName: 'id',
                  builder: (id) => StudentMonthlyReportScreen(studentId: id),
                ),
              ),
              GoRoute(
                path: RouteNames.supervisorReports,
                builder: (context, state) => const SupervisorReportsScreen(),
              ),
              GoRoute(
                path: RouteNames.supervisorHalqaReportPath,
                builder: (context, state) => _buildPositiveIntRoute(
                  state,
                  parameterName: 'id',
                  builder: (id) => TeacherHalqaReportScreen(halqaId: id),
                ),
              ),
              GoRoute(
                path: RouteNames.studentProgress,
                builder: (context, state) => const ProgressScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _notificationsNavKey,
            routes: [
              GoRoute(
                path: RouteNames.notifications,
                builder: (context, state) => const NotificationsScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) => _buildPositiveIntRoute(
                      state,
                      parameterName: 'id',
                      builder: (notificationId) => NotificationDetailsScreen(
                        notificationId: notificationId,
                        initialNotification: state.extra as dynamic,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _profileNavKey,
            routes: [
              GoRoute(
                path: RouteNames.profile,
                builder: (context, state) => const ProfileScreen(),
              ),
              GoRoute(
                path: RouteNames.studentProfilePage,
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

bool _isPublicRoute(String location) {
  return location == RouteNames.root ||
      location == RouteNames.splash ||
      location == RouteNames.login ||
      location == RouteNames.forgotPassword;
}

bool _isContextSelectionRoute(String location) {
  return location == RouteNames.selectCenter ||
      location == RouteNames.selectCircle;
}

bool _isSharedRoute(String location) {
  return location.startsWith(RouteNames.notifications) ||
      location.startsWith(RouteNames.profile) ||
      location == RouteNames.homeLibrary ||
      location == RouteNames.forbidden;
}

String _landingRouteFor(UserRole role, ContextState contextState) {
  if (role.requiresContext) {
    if (!contextState.hasSelectedCenter) {
      return RouteNames.selectCenter;
    }
    if (!role.requiresCenterOnly && !contextState.hasSelectedCircle) {
      return RouteNames.selectCircle;
    }
  }
  return role.homeRoute;
}

String? _redirectForContextSelection(
  String location,
  UserRole role,
  ContextState contextState,
) {
  if (!role.requiresContext) {
    return role.homeRoute;
  }

  final needsCenter = !contextState.hasSelectedCenter;
  final needsCircle = !role.requiresCenterOnly &&
      contextState.hasSelectedCenter &&
      !contextState.hasSelectedCircle;

  if (location == RouteNames.selectCenter) {
    if (needsCenter) {
      return null;
    }
    if (needsCircle) {
      return RouteNames.selectCircle;
    }
    return role.homeRoute;
  }

  if (role.requiresCenterOnly) {
    return needsCenter ? RouteNames.selectCenter : role.homeRoute;
  }

  if (needsCenter) {
    return RouteNames.selectCenter;
  }
  if (needsCircle) {
    return null;
  }

  return role.homeRoute;
}

bool _requiresContextBeforeAccess(String location, UserRole role) {
  if (!role.requiresContext) {
    return false;
  }
  if (_isSharedRoute(location)) {
    return false;
  }
  return location.startsWith('/teacher') || location.startsWith('/supervisor');
}

Widget _buildPositiveIntRoute(
  GoRouterState state, {
  required String parameterName,
  required Widget Function(int id) builder,
}) {
  final rawValue = state.pathParameters[parameterName];
  final parsed = int.tryParse(rawValue ?? '');
  if (parsed == null || parsed <= 0) {
    return const _RouteGuardScreen.notFound(
      message: 'The requested page is missing a valid identifier.',
    );
  }
  return builder(parsed);
}

Widget _buildRequiredTextRoute(
  GoRouterState state, {
  required String parameterName,
  required Widget Function(String value) builder,
}) {
  final value = state.pathParameters[parameterName]?.trim();
  if (value == null || value.isEmpty) {
    return const _RouteGuardScreen.notFound(
      message: 'The requested page is missing a valid identifier.',
    );
  }
  return builder(value);
}

class _RouteGuardScreen extends StatelessWidget {
  final String title;
  final String message;
  final String? actionLabel;
  final String? actionRoute;
  final IconData icon;

  const _RouteGuardScreen({
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.actionRoute,
    required this.icon,
  });

  const _RouteGuardScreen.forbidden()
      : this(
          title: 'Access denied',
          message: 'This route is not available for the current user role.',
          actionLabel: 'Go to home',
          actionRoute: RouteNames.root,
          icon: Icons.lock_outline_rounded,
        );

  const _RouteGuardScreen.mobileUnsupported()
      : this(
          title: 'Unsupported mobile account',
          message:
              'هذا الحساب مخصص للوحة الويب ولا يمكن استخدامه من تطبيق الجوال.',
          actionLabel: null,
          actionRoute: null,
          icon: Icons.phone_android_rounded,
        );

  const _RouteGuardScreen.notFound({
    this.message =
        'The page does not exist or the route parameters are invalid.',
  })  : title = 'Page not found',
        actionLabel = 'Go to home',
        actionRoute = RouteNames.root,
        icon = Icons.search_off_rounded;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: PageStateView(
        icon: icon,
        title: title,
        message: message,
        actionLabel: actionLabel,
        onAction: actionRoute == null ? null : () => context.go(actionRoute!),
      ),
    );
  }
}
