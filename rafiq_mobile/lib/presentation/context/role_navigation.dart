import 'package:flutter/material.dart';

import '../../core/router/route_names.dart';

enum FeatureAvailability {
  available,
  webOnly,
  later,
}

class RoleNavigationItem {
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final String route;
  final List<String> matchPrefixes;
  final bool includeDescendants;

  const RoleNavigationItem({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.route,
    List<String>? matchPrefixes,
    this.includeDescendants = true,
  }) : matchPrefixes = matchPrefixes ?? const [];

  bool matches(String location) {
    if (location == route) {
      return true;
    }
    if (includeDescendants && location.startsWith('$route/')) {
      return true;
    }
    return matchPrefixes.any(
      (prefix) => location == prefix || location.startsWith('$prefix/'),
    );
  }
}

List<RoleNavigationItem> navigationItemsForRole(String role) {
  switch (role.toUpperCase()) {
    case 'SUPERVISOR':
      return const [
        RoleNavigationItem(
          label: 'الرئيسية',
          icon: Icons.home_outlined,
          selectedIcon: Icons.home,
          route: RouteNames.supervisorHome,
          includeDescendants: false,
        ),
        RoleNavigationItem(
          label: 'الحلقات',
          icon: Icons.groups_outlined,
          selectedIcon: Icons.groups,
          route: RouteNames.supervisorHalaqat,
          matchPrefixes: [
            RouteNames.halqaVisitBase,
            RouteNames.supervisorTodayVisits,
            RouteNames.supervisorTeacherEval,
            RouteNames.supervisorNotes,
            RouteNames.approvals,
          ],
        ),
        RoleNavigationItem(
          label: 'الاختبارات',
          icon: Icons.assignment_outlined,
          selectedIcon: Icons.assignment,
          route: RouteNames.homeExams,
        ),
        RoleNavigationItem(
          label: 'التقارير',
          icon: Icons.analytics_outlined,
          selectedIcon: Icons.analytics,
          route: RouteNames.supervisorReports,
          matchPrefixes: [
            RouteNames.supervisorHalqaReportBase,
          ],
        ),
        RoleNavigationItem(
          label: 'الإشعارات',
          icon: Icons.notifications_outlined,
          selectedIcon: Icons.notifications,
          route: RouteNames.notifications,
        ),
        RoleNavigationItem(
          label: 'حسابي',
          icon: Icons.person_outline,
          selectedIcon: Icons.person,
          route: RouteNames.profile,
        ),
      ];
    case 'CENTER_ADMIN':
    case 'SUPER_ADMIN':
    case 'ACCOUNTANT':
    case 'FINANCE_MANAGER':
    case 'TREASURER':
    case 'AUDITOR':
      return const [];
    case 'PARENT':
      return const [
        RoleNavigationItem(
          label: 'الرئيسية',
          icon: Icons.home_outlined,
          selectedIcon: Icons.home,
          route: RouteNames.parentHome,
          includeDescendants: false,
        ),
        RoleNavigationItem(
          label: 'الأبناء',
          icon: Icons.school_outlined,
          selectedIcon: Icons.school,
          route: RouteNames.parentChildren,
          matchPrefixes: [RouteNames.parentChildBase],
        ),
        RoleNavigationItem(
          label: 'الاختبارات',
          icon: Icons.assignment_outlined,
          selectedIcon: Icons.assignment,
          route: RouteNames.homeExams,
        ),
        RoleNavigationItem(
          label: 'الإشعارات',
          icon: Icons.notifications_outlined,
          selectedIcon: Icons.notifications,
          route: RouteNames.notifications,
        ),
        RoleNavigationItem(
          label: 'حسابي',
          icon: Icons.person_outline,
          selectedIcon: Icons.person,
          route: RouteNames.profile,
        ),
      ];
    case 'STUDENT':
      return const [
        RoleNavigationItem(
          label: 'الرئيسية',
          icon: Icons.home_outlined,
          selectedIcon: Icons.home,
          route: RouteNames.studentHome,
          includeDescendants: false,
        ),
        RoleNavigationItem(
          label: 'رحلتي',
          icon: Icons.auto_stories_outlined,
          selectedIcon: Icons.auto_stories,
          route: RouteNames.studentJourney,
          matchPrefixes: [
            RouteNames.studentMemorizationLog,
            RouteNames.studentProgress,
            RouteNames.studentRemoteRecitation,
          ],
        ),
        RoleNavigationItem(
          label: 'الاختبارات',
          icon: Icons.assignment_outlined,
          selectedIcon: Icons.assignment,
          route: RouteNames.homeExams,
        ),
        RoleNavigationItem(
          label: 'الإشعارات',
          icon: Icons.notifications_outlined,
          selectedIcon: Icons.notifications,
          route: RouteNames.notifications,
        ),
        RoleNavigationItem(
          label: 'حسابي',
          icon: Icons.person_outline,
          selectedIcon: Icons.person,
          route: RouteNames.profile,
        ),
      ];
    case 'TEACHER':
    default:
      return const [
        RoleNavigationItem(
          label: 'الرئيسية',
          icon: Icons.home_outlined,
          selectedIcon: Icons.home,
          route: RouteNames.teacherHome,
          includeDescendants: false,
        ),
        RoleNavigationItem(
          label: 'الحلقة',
          icon: Icons.groups_outlined,
          selectedIcon: Icons.groups,
          route: RouteNames.teacherHalqa,
          matchPrefixes: [
            RouteNames.teacherStudentBase,
            RouteNames.teacherAttendance,
            RouteNames.teacherPreparation,
            RouteNames.teacherGroupAchievement,
            RouteNames.teacherMonthlyPlan,
            RouteNames.teacherRemoteRecitation,
          ],
        ),
        RoleNavigationItem(
          label: 'الاختبارات',
          icon: Icons.assignment_outlined,
          selectedIcon: Icons.assignment,
          route: RouteNames.homeExams,
        ),
        RoleNavigationItem(
          label: 'السجلات',
          icon: Icons.analytics_outlined,
          selectedIcon: Icons.analytics,
          route: RouteNames.teacherRecords,
          matchPrefixes: [
            RouteNames.teacherHalqaReport,
            RouteNames.teacherStudentReportBase,
          ],
        ),
        RoleNavigationItem(
          label: 'الإشعارات',
          icon: Icons.notifications_outlined,
          selectedIcon: Icons.notifications,
          route: RouteNames.notifications,
        ),
        RoleNavigationItem(
          label: 'حسابي',
          icon: Icons.person_outline,
          selectedIcon: Icons.person,
          route: RouteNames.profile,
        ),
      ];
  }
}

int navigationIndexForLocation(
  List<RoleNavigationItem> items,
  String location,
) {
  final index = items.indexWhere((item) => item.matches(location));
  return index < 0 ? 0 : index;
}

class PremiumBottomBarItem {
  final String label;
  final IconData icon;
  final IconData selectedIcon;

  const PremiumBottomBarItem({
    required this.label,
    required this.icon,
    required this.selectedIcon,
  });
}
