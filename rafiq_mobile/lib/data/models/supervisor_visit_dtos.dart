class SupervisorVisitPlaceDto {
  final int id;
  final String name;

  const SupervisorVisitPlaceDto({
    required this.id,
    required this.name,
  });

  factory SupervisorVisitPlaceDto.fromJson(Map<String, dynamic> json) {
    return SupervisorVisitPlaceDto(
      id: _asInt(json['id']),
      name: _asString(json['name'], fallback: 'Target'),
    );
  }
}

class SupervisorVisitPlanItemDto {
  final int id;
  final int? planId;
  final int centerId;
  final int? circleId;
  final DateTime plannedDate;
  final String? plannedTimeWindow;
  final String priority;
  final String? notes;
  final String status;
  final SupervisorVisitPlaceDto? center;
  final SupervisorVisitPlaceDto? circle;

  const SupervisorVisitPlanItemDto({
    required this.id,
    required this.planId,
    required this.centerId,
    required this.circleId,
    required this.plannedDate,
    required this.plannedTimeWindow,
    required this.priority,
    required this.notes,
    required this.status,
    required this.center,
    required this.circle,
  });

  factory SupervisorVisitPlanItemDto.fromJson(Map<String, dynamic> json) {
    return SupervisorVisitPlanItemDto(
      id: _asInt(json['id']),
      planId: _asNullableInt(json['planId']),
      centerId: _asInt(json['centerId']),
      circleId: _asNullableInt(json['circleId']),
      plannedDate: _asDateTime(json['plannedDate']),
      plannedTimeWindow: _asNullableString(json['plannedTimeWindow']),
      priority: _normalizePriority(json['priority']),
      notes: _asNullableString(json['notes']),
      status: _normalizeItemStatus(json['status']),
      center: json['center'] is Map
          ? SupervisorVisitPlaceDto.fromJson(_asMap(json['center']))
          : null,
      circle: json['circle'] is Map
          ? SupervisorVisitPlaceDto.fromJson(_asMap(json['circle']))
          : null,
    );
  }
}

class SupervisorVisitLogDto {
  final int id;
  final int centerId;
  final int? circleId;
  final int? planItemId;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int? durationMinutes;
  final String startGeoState;
  final String? endGeoState;
  final List<Map<String, dynamic>> checklist;
  final int? rating;
  final String? observations;
  final SupervisorVisitPlaceDto? center;
  final SupervisorVisitPlaceDto? circle;

  const SupervisorVisitLogDto({
    required this.id,
    required this.centerId,
    required this.circleId,
    required this.planItemId,
    required this.startedAt,
    required this.endedAt,
    required this.durationMinutes,
    required this.startGeoState,
    required this.endGeoState,
    required this.checklist,
    required this.rating,
    required this.observations,
    required this.center,
    required this.circle,
  });

  factory SupervisorVisitLogDto.fromJson(Map<String, dynamic> json) {
    return SupervisorVisitLogDto(
      id: _asInt(json['id']),
      centerId: _asInt(json['centerId']),
      circleId: _asNullableInt(json['circleId']),
      planItemId: _asNullableInt(json['planItemId']),
      startedAt: _asDateTime(json['startedAt']),
      endedAt: _asNullableDateTime(json['endedAt']),
      durationMinutes: _asNullableInt(json['durationMinutes']),
      startGeoState: _asString(json['startGeoState'], fallback: 'NOT_SENT'),
      endGeoState: _asNullableString(json['endGeoState']),
      checklist: _asList(json['checklist']),
      rating: _asNullableInt(json['rating']),
      observations: _asNullableString(json['observations']),
      center: json['center'] is Map
          ? SupervisorVisitPlaceDto.fromJson(_asMap(json['center']))
          : null,
      circle: json['circle'] is Map
          ? SupervisorVisitPlaceDto.fromJson(_asMap(json['circle']))
          : null,
    );
  }

  bool get isOpen => endedAt == null;
}

class SupervisorTodayVisitsDto {
  final List<SupervisorVisitPlanItemDto> plannedItems;
  final List<SupervisorVisitLogDto> logs;

  const SupervisorTodayVisitsDto({
    required this.plannedItems,
    required this.logs,
  });

  factory SupervisorTodayVisitsDto.fromJson(Map<String, dynamic> json) {
    return SupervisorTodayVisitsDto(
      plannedItems: _asList(json['plannedItems'])
          .map(SupervisorVisitPlanItemDto.fromJson)
          .toList(growable: false),
      logs: _asList(json['logs'])
          .map(SupervisorVisitLogDto.fromJson)
          .toList(growable: false),
    );
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _asList(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
  }
  return const <Map<String, dynamic>>[];
}

String _asString(dynamic value, {String fallback = ''}) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

String? _asNullableString(dynamic value) {
  final text = value?.toString().trim();
  if (text == null || text.isEmpty) return null;
  return text;
}

int _asInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

int? _asNullableInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString());
}

DateTime _asDateTime(dynamic value) {
  return DateTime.tryParse(value?.toString() ?? '') ??
      DateTime.fromMillisecondsSinceEpoch(0);
}

DateTime? _asNullableDateTime(dynamic value) {
  final text = value?.toString().trim() ?? '';
  if (text.isEmpty) return null;
  return DateTime.tryParse(text);
}

String _normalizePriority(dynamic value) {
  final raw = _asString(value, fallback: 'NORMAL').toUpperCase();
  return raw.replaceFirst('VISIT_PRIORITY_', '');
}

String _normalizeItemStatus(dynamic value) {
  final raw = _asString(value, fallback: 'PENDING').toUpperCase();
  return raw.replaceFirst('VISIT_ITEM_', '');
}
