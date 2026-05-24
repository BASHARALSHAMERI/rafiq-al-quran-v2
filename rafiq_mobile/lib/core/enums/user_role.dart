import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Central Role Enum for quran-companions-app-main alignment
///
/// Roles hierarchy (from highest permissions to lowest):
/// 1. superAdmin - System administrator
/// 2. centerAdmin - Center administrator
/// 3. supervisor - Halqa supervisor
/// 4. teacher - Teacher
/// 5. student - Student
/// 6. parent - Parent
enum UserRole {
  superAdmin,
  centerAdmin,
  accountant,
  financeManager,
  treasurer,
  auditor,
  supervisor,
  teacher,
  student,
  parent,
}

/// Extension for role utilities
extension UserRoleExtension on UserRole {
  /// String representation for API/storage
  String get value {
    switch (this) {
      case UserRole.superAdmin:
        return 'SUPER_ADMIN';
      case UserRole.centerAdmin:
        return 'CENTER_ADMIN';
      case UserRole.accountant:
        return 'ACCOUNTANT';
      case UserRole.financeManager:
        return 'FINANCE_MANAGER';
      case UserRole.treasurer:
        return 'TREASURER';
      case UserRole.auditor:
        return 'AUDITOR';
      case UserRole.supervisor:
        return 'SUPERVISOR';
      case UserRole.teacher:
        return 'TEACHER';
      case UserRole.student:
        return 'STUDENT';
      case UserRole.parent:
        return 'PARENT';
    }
  }

  /// Display name in Arabic
  String get displayName {
    if (isWebOnly) {
      return displayNameEn;
    }

    switch (this) {
      case UserRole.superAdmin:
        return 'مدير النظام';
      case UserRole.centerAdmin:
        return 'مدير المركز';
      case UserRole.accountant:
      case UserRole.financeManager:
      case UserRole.treasurer:
      case UserRole.auditor:
        return displayNameEn;
      case UserRole.supervisor:
        return 'مشرف';
      case UserRole.teacher:
        return 'معلم';
      case UserRole.student:
        return 'طالب';
      case UserRole.parent:
        return 'ولي أمر';
    }
  }

  /// English display name
  String get displayNameEn {
    switch (this) {
      case UserRole.superAdmin:
        return 'Super Admin';
      case UserRole.centerAdmin:
        return 'Center Admin';
      case UserRole.accountant:
        return 'Accountant';
      case UserRole.financeManager:
        return 'Finance Manager';
      case UserRole.treasurer:
        return 'Treasurer';
      case UserRole.auditor:
        return 'Auditor';
      case UserRole.supervisor:
        return 'Supervisor';
      case UserRole.teacher:
        return 'Teacher';
      case UserRole.student:
        return 'Student';
      case UserRole.parent:
        return 'Parent';
    }
  }

  /// Role color for UI theming
  Color get color {
    switch (this) {
      case UserRole.superAdmin:
        return AppColors.roleSupervisor;
      case UserRole.centerAdmin:
      case UserRole.accountant:
      case UserRole.financeManager:
      case UserRole.treasurer:
      case UserRole.auditor:
        return AppColors.roleSupervisor;
      case UserRole.supervisor:
        return AppColors.roleSupervisor;
      case UserRole.teacher:
        return AppColors.roleTeacher;
      case UserRole.student:
        return AppColors.roleStudent;
      case UserRole.parent:
        return AppColors.roleParent;
    }
  }

  /// Icon for the role
  IconData get icon {
    switch (this) {
      case UserRole.superAdmin:
        return Icons.admin_panel_settings;
      case UserRole.centerAdmin:
        return Icons.account_balance;
      case UserRole.accountant:
        return Icons.calculate;
      case UserRole.financeManager:
        return Icons.account_balance_wallet;
      case UserRole.treasurer:
        return Icons.savings;
      case UserRole.auditor:
        return Icons.fact_check;
      case UserRole.supervisor:
        return Icons.supervised_user_circle;
      case UserRole.teacher:
        return Icons.school;
      case UserRole.student:
        return Icons.person;
      case UserRole.parent:
        return Icons.family_restroom;
    }
  }

  /// Whether this role can access teacher features
  bool get canAccessTeacherFeatures {
    return this == UserRole.teacher || this == UserRole.supervisor;
  }

  /// Whether this role can access supervisor features
  bool get canAccessSupervisorFeatures {
    return this == UserRole.supervisor;
  }

  /// Whether this role can access admin features
  bool get canAccessAdminFeatures {
    return false;
  }

  /// Whether this backend role is supported by the Flutter mobile app.
  bool get isMobileSupported {
    return this == UserRole.supervisor ||
        this == UserRole.teacher ||
        this == UserRole.student ||
        this == UserRole.parent;
  }

  /// Whether this role is intentionally web-only.
  bool get isWebOnly {
    return !isMobileSupported;
  }

  /// Whether this role needs center/circle selection
  bool get requiresContext {
    return this == UserRole.supervisor || this == UserRole.teacher;
  }

  /// Whether this role needs a center selection only (not circle)
  bool get requiresCenterOnly {
    return this == UserRole.supervisor;
  }

  /// Whether this role can manage attendance
  bool get canManageAttendance {
    return this == UserRole.teacher;
  }

  /// Whether this role can view reports
  bool get canViewReports {
    return this == UserRole.teacher ||
        this == UserRole.supervisor ||
        this == UserRole.parent;
  }

  /// Whether this role can evaluate students
  bool get canEvaluateStudents {
    return this == UserRole.teacher || this == UserRole.supervisor;
  }

  /// Whether this role can view children's data
  bool get canViewChildren {
    return this == UserRole.parent;
  }

  /// Home route for this role
  String get homeRoute {
    switch (this) {
      case UserRole.superAdmin:
      case UserRole.centerAdmin:
      case UserRole.accountant:
      case UserRole.financeManager:
      case UserRole.treasurer:
      case UserRole.auditor:
        return '/forbidden';
      case UserRole.supervisor:
        return '/supervisor';
      case UserRole.teacher:
        return '/teacher';
      case UserRole.student:
        return '/student';
      case UserRole.parent:
        return '/parent';
    }
  }

  /// Navigation items for bottom nav (matching quran-companions)
  List<NavItem> get navItems {
    switch (this) {
      case UserRole.teacher:
        return const [
          NavItem(label: 'الرئيسية', icon: Icons.home, path: '/teacher'),
          NavItem(label: 'الحلقة', icon: Icons.people, path: '/teacher/halqa'),
          NavItem(
              label: 'السجل', icon: Icons.assignment, path: '/teacher/records'),
          NavItem(
              label: 'الإشعارات',
              icon: Icons.notifications,
              path: '/notifications'),
          NavItem(label: 'حسابي', icon: Icons.person, path: '/profile'),
        ];
      case UserRole.supervisor:
        return const [
          NavItem(label: 'الرئيسية', icon: Icons.home, path: '/supervisor'),
          NavItem(
              label: 'الحلقات',
              icon: Icons.people,
              path: '/supervisor/halaqat'),
          NavItem(
              label: 'التقارير',
              icon: Icons.bar_chart,
              path: '/supervisor/reports'),
          NavItem(
              label: 'الإشعارات',
              icon: Icons.notifications,
              path: '/notifications'),
          NavItem(label: 'حسابي', icon: Icons.person, path: '/profile'),
        ];
      case UserRole.centerAdmin:
      case UserRole.superAdmin:
      case UserRole.accountant:
      case UserRole.financeManager:
      case UserRole.treasurer:
      case UserRole.auditor:
        return const [];
      case UserRole.student:
        return const [
          NavItem(label: 'الرئيسية', icon: Icons.home, path: '/student'),
          NavItem(
              label: 'واجبي',
              icon: Icons.assignment,
              path: '/student/assignments'),
          NavItem(
              label: 'تقدمي',
              icon: Icons.trending_up,
              path: '/student/progress'),
          NavItem(
              label: 'الإشعارات',
              icon: Icons.notifications,
              path: '/notifications'),
          NavItem(label: 'حسابي', icon: Icons.person, path: '/profile'),
        ];
      case UserRole.parent:
        return const [
          NavItem(label: 'الرئيسية', icon: Icons.home, path: '/parent'),
          NavItem(
              label: 'الأبناء',
              icon: Icons.family_restroom,
              path: '/parent/children'),
          NavItem(
              label: 'الإشعارات',
              icon: Icons.notifications,
              path: '/notifications'),
          NavItem(label: 'حسابي', icon: Icons.person, path: '/profile'),
        ];
    }
  }
}

/// Navigation item model
class NavItem {
  final String label;
  final IconData icon;
  final String path;

  const NavItem({
    required this.label,
    required this.icon,
    required this.path,
  });
}

/// Role parsing from string
UserRole? parseUserRole(String? value) {
  if (value == null) return null;

  final normalized = value.toUpperCase().trim();

  switch (normalized) {
    case 'SUPER_ADMIN':
      return UserRole.superAdmin;
    case 'CENTER_ADMIN':
      return UserRole.centerAdmin;
    case 'ACCOUNTANT':
      return UserRole.accountant;
    case 'FINANCE_MANAGER':
      return UserRole.financeManager;
    case 'TREASURER':
      return UserRole.treasurer;
    case 'AUDITOR':
      return UserRole.auditor;
    case 'SUPERVISOR':
      return UserRole.supervisor;
    case 'TEACHER':
      return UserRole.teacher;
    case 'STUDENT':
      return UserRole.student;
    case 'PARENT':
      return UserRole.parent;
    default:
      return null;
  }
}

/// Role guards for navigation
class RoleGuards {
  static bool canAccess(String route, UserRole? role) {
    if (role == null) return false;

    // Public routes
    if (route == '/' ||
        route == '/splash' ||
        route == '/login' ||
        route == '/forgot-password' ||
        route == '/forbidden') {
      return true;
    }

    if (route == '/select-center' || route == '/select-circle') {
      return role.requiresContext;
    }

    if (!role.isMobileSupported) {
      return false;
    }

    // Teacher routes
    if (route.startsWith('/teacher')) {
      return role.canAccessTeacherFeatures;
    }

    // Supervisor routes
    if (route.startsWith('/supervisor')) {
      return role.canAccessSupervisorFeatures;
    }

    // Admin routes
    if (route.startsWith('/admin')) {
      return role.canAccessAdminFeatures;
    }

    // Student routes
    if (route.startsWith('/student')) {
      // /student/exams is the shared homeExams entry point for field roles.
      if (route == '/student/exams' || route.startsWith('/student/exams/')) {
        return role == UserRole.student ||
            role == UserRole.teacher ||
            role == UserRole.supervisor ||
            role == UserRole.parent;
      }
      return role == UserRole.student;
    }

    // Parent routes
    if (route.startsWith('/parent')) {
      return role == UserRole.parent;
    }

    // Shared routes
    if (route.startsWith('/notifications') ||
        route.startsWith('/profile') ||
        route == '/library') {
      return true;
    }

    return false;
  }

  /// Get redirect route based on role
  static String getRedirectRoute(UserRole? role) {
    if (role == null) return '/login';
    return role.homeRoute;
  }
}
