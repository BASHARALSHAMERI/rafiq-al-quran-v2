import 'package:flutter_test/flutter_test.dart';
import 'package:rafiq_mobile/core/router/route_names.dart';
import 'package:rafiq_mobile/presentation/context/role_navigation.dart';

void main() {
  test('teacher navigation matches expected shell routes', () {
    final items = navigationItemsForRole('TEACHER');

    expect(items.map((item) => item.route), [
      RouteNames.teacherHalqa,
      RouteNames.homeExams,
      RouteNames.teacherHome,
      RouteNames.notifications,
      RouteNames.profile,
    ]);
    expect(
      navigationIndexForLocation(items, RouteNames.teacherStudentProfile(9)),
      0,
    );
    expect(
      navigationIndexForLocation(
          items, RouteNames.attendanceMarkWithDate('2026-03-08')),
      0,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.teacherHalqaReport),
      0,
    );
  });

  test('supervisor navigation matches expected shell routes', () {
    final items = navigationItemsForRole('SUPERVISOR');

    expect(items.map((item) => item.route), [
      RouteNames.supervisorHalaqat,
      RouteNames.homeExams,
      RouteNames.supervisorHome,
      RouteNames.notifications,
      RouteNames.profile,
    ]);
    expect(
      navigationIndexForLocation(items, RouteNames.approvals),
      0,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.supervisorHalqaReport(4)),
      0,
    );
  });

  test('parent navigation keeps children tab selected for detail routes', () {
    final items = navigationItemsForRole('PARENT');

    expect(
      navigationIndexForLocation(items, RouteNames.parentChildDetail('5')),
      0,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.parentChildAttendance('5')),
      0,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.parentChildResults('5')),
      0,
    );
  });
}
