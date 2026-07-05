import 'package:flutter_test/flutter_test.dart';
import 'package:rafiq_mobile/core/router/route_names.dart';
import 'package:rafiq_mobile/presentation/context/role_navigation.dart';

void main() {
  test('teacher navigation matches expected shell routes', () {
    final items = navigationItemsForRole('TEACHER');

    expect(items.map((item) => item.route), [
      RouteNames.teacherHome,
      RouteNames.teacherHalqa,
      RouteNames.teacherPreparation,
      RouteNames.homeExams,
      RouteNames.profile,
    ]);
    expect(
      navigationIndexForLocation(items, RouteNames.teacherStudentProfile(9)),
      1,
    );
    expect(
      navigationIndexForLocation(
          items, RouteNames.attendanceMarkWithDate('2026-03-08')),
      1,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.teacherPreparation),
      2,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.homeExams),
      3,
    );
  });

  test('supervisor navigation matches expected shell routes', () {
    final items = navigationItemsForRole('SUPERVISOR');

    expect(items.map((item) => item.route), [
      RouteNames.supervisorHome,
      RouteNames.supervisorTodayVisits,
      RouteNames.supervisorReports,
      RouteNames.profile,
    ]);
    expect(
      navigationIndexForLocation(items, RouteNames.supervisorHalaqat),
      1,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.supervisorHalqaReport(4)),
      2,
    );
  });

  test('parent navigation keeps children tab selected for detail routes', () {
    final items = navigationItemsForRole('PARENT');

    expect(
      navigationIndexForLocation(items, RouteNames.parentChildDetail('5')),
      1,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.parentChildAttendance('5')),
      1,
    );
    expect(
      navigationIndexForLocation(items, RouteNames.parentChildResults('5')),
      1,
    );
  });
}
