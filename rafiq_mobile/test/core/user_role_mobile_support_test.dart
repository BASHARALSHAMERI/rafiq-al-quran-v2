import 'package:flutter_test/flutter_test.dart';
import 'package:rafiq_mobile/core/enums/user_role.dart';
import 'package:rafiq_mobile/core/router/route_names.dart';

void main() {
  test('accountant parses as a known web-only role', () {
    final role = parseUserRole('ACCOUNTANT');

    expect(role, UserRole.accountant);
    expect(role?.isMobileSupported, isFalse);
    expect(role?.isWebOnly, isTrue);
    expect(RoleGuards.getRedirectRoute(role), RouteNames.forbidden);
  });

  test('all finance and admin roles are web-only in mobile', () {
    const webOnlyRoles = [
      UserRole.superAdmin,
      UserRole.centerAdmin,
      UserRole.accountant,
      UserRole.financeManager,
      UserRole.treasurer,
      UserRole.auditor,
    ];

    for (final role in webOnlyRoles) {
      expect(role.isMobileSupported, isFalse, reason: role.value);
      expect(role.navItems, isEmpty, reason: role.value);
      expect(RoleGuards.canAccess(RouteNames.teacherHome, role), isFalse,
          reason: role.value);
      expect(RoleGuards.getRedirectRoute(role), RouteNames.forbidden,
          reason: role.value);
    }
  });

  test('supported mobile roles keep their normal home routes', () {
    expect(parseUserRole('SUPERVISOR')?.homeRoute, RouteNames.supervisorHome);
    expect(parseUserRole('TEACHER')?.homeRoute, RouteNames.teacherHome);
    expect(parseUserRole('STUDENT')?.homeRoute, RouteNames.studentHome);
    expect(parseUserRole('PARENT')?.homeRoute, RouteNames.parentHome);
  });
}
