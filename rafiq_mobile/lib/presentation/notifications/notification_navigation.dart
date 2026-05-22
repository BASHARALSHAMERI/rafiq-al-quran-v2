import '../../core/enums/user_role.dart';
import '../../core/router/route_names.dart';
import '../../data/models/notification_dtos.dart';

String? resolveNotificationPrimaryRoute(
  NotificationDto notification, {
  required String? currentUserRole,
}) {
  final role = parseUserRole(currentUserRole);
  if (role == null) {
    return null;
  }

  final metadata = notification.metadata ?? const <String, dynamic>{};
  final studentId = _readMetadataInt(metadata, const [
    'studentId',
    'targetStudentId',
    'primaryStudentId',
  ]);
  if (studentId != null) {
    const routePrefix = RouteNames.teacherStudentBase;
    final route = '$routePrefix/$studentId';
    return RoleGuards.canAccess(route, role) ? route : null;
  }

  if (notification.type == 'EXAM_RESULT' ||
      _readMetadataInt(metadata, const ['examId', 'attemptId']) != null) {
    const route = RouteNames.homeExams;
    return RoleGuards.canAccess(route, role) ? route : null;
  }

  if (_readMetadataInt(metadata, const ['circleId']) != null) {
    const route = RouteNames.circles;
    return RoleGuards.canAccess(route, role) ? route : null;
  }

  return null;
}

int? _readMetadataInt(Map<String, dynamic> metadata, List<String> keys) {
  for (final key in keys) {
    final value = metadata[key];
    final parsed = int.tryParse('$value');
    if (parsed != null && parsed > 0) {
      return parsed;
    }
  }

  final studentIds = metadata['studentIds'];
  if (studentIds is List && studentIds.isNotEmpty) {
    final parsed = int.tryParse('${studentIds.first}');
    if (parsed != null && parsed > 0) {
      return parsed;
    }
  }

  return null;
}
