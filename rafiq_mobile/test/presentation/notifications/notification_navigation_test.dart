import 'package:flutter_test/flutter_test.dart';
import 'package:rafiq_mobile/core/router/route_names.dart';
import 'package:rafiq_mobile/data/models/notification_dtos.dart';
import 'package:rafiq_mobile/presentation/notifications/notification_navigation.dart';

void main() {
  NotificationDto buildNotification({
    required Map<String, dynamic>? metadata,
    String type = 'SYSTEM',
  }) {
    final now = DateTime(2026, 3, 8);
    return NotificationDto(
      id: 1,
      type: type,
      title: 'تنبيه',
      message: 'وصف',
      isRead: false,
      userId: 12,
      metadata: metadata,
      createdAt: now,
      updatedAt: now,
    );
  }

  test('resolves student profile route from metadata', () {
    final notification = buildNotification(metadata: {'studentId': 42});

    final route = resolveNotificationPrimaryRoute(
      notification,
      currentUserRole: 'TEACHER',
    );

    expect(route, RouteNames.studentProfile(42));
  });

  test('resolves exams route when exam identifiers are present', () {
    final notification = buildNotification(metadata: {'attemptId': 14});

    final route = resolveNotificationPrimaryRoute(
      notification,
      currentUserRole: 'STUDENT',
    );

    expect(route, RouteNames.homeExams);
  });

  test('resolves circles route when circle identifier is present', () {
    final notification = buildNotification(metadata: {'circleId': 9});

    final route = resolveNotificationPrimaryRoute(
      notification,
      currentUserRole: 'SUPERVISOR',
    );

    expect(route, RouteNames.circles);
  });

  test('returns null when metadata is insufficient', () {
    final notification = buildNotification(metadata: {'foo': 'bar'});

    final route = resolveNotificationPrimaryRoute(
      notification,
      currentUserRole: 'TEACHER',
    );

    expect(route, isNull);
  });
}
