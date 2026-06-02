class SupervisorOpsDashboardDto {
  final SupervisorOpsProfileDto profile;
  final SupervisorOpsPeriodDto period;
  final SupervisorOpsVisitsDto visits;
  final SupervisorOpsHoursDto hours;
  final SupervisorOpsAssignmentsDto assignments;
  final List<SupervisorOpsUnvisitedCircleDto> unvisitedCircles;
  final List<SupervisorOpsUnvisitedCenterDto> unvisitedCenters;
  final List<SupervisorOpsRecentVisitDto> recentVisits;
  final List<SupervisorOpsVisitPlanDto> visitPlans;

  const SupervisorOpsDashboardDto({
    required this.profile,
    required this.period,
    required this.visits,
    required this.hours,
    required this.assignments,
    required this.unvisitedCircles,
    required this.unvisitedCenters,
    required this.recentVisits,
    required this.visitPlans,
  });

  factory SupervisorOpsDashboardDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsDashboardDto(
      profile: SupervisorOpsProfileDto.fromJson(_asMap(json['profile'])),
      period: SupervisorOpsPeriodDto.fromJson(_asMap(json['period'])),
      visits: SupervisorOpsVisitsDto.fromJson(_asMap(json['visits'])),
      hours: SupervisorOpsHoursDto.fromJson(_asMap(json['hours'])),
      assignments: SupervisorOpsAssignmentsDto.fromJson(_asMap(json['assignments'])),
      unvisitedCircles: _asList(json['unvisitedCircles'])
          .map((e) => SupervisorOpsUnvisitedCircleDto.fromJson(e))
          .toList(growable: false),
      unvisitedCenters: _asList(json['unvisitedCenters'])
          .map((e) => SupervisorOpsUnvisitedCenterDto.fromJson(e))
          .toList(growable: false),
      recentVisits: _asList(json['recentVisits'])
          .map((e) => SupervisorOpsRecentVisitDto.fromJson(e))
          .toList(growable: false),
      visitPlans: _asList(json['visitPlans'])
          .map((e) => SupervisorOpsVisitPlanDto.fromJson(e))
          .toList(growable: false),
    );
  }
}

class SupervisorOpsProfileDto {
  final int userId;
  final String fullName;
  final String status;
  final int monthlyHoursTarget;
  final int monthlyVisitsTarget;

  const SupervisorOpsProfileDto({
    required this.userId,
    required this.fullName,
    required this.status,
    required this.monthlyHoursTarget,
    required this.monthlyVisitsTarget,
  });

  factory SupervisorOpsProfileDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsProfileDto(
      userId: _asInt(json['userId']),
      fullName: _asString(json['fullName']),
      status: _asString(json['status']),
      monthlyHoursTarget: _asInt(json['monthlyHoursTarget']),
      monthlyVisitsTarget: _asInt(json['monthlyVisitsTarget']),
    );
  }
}

class SupervisorOpsPeriodDto {
  final int month;
  final int year;

  const SupervisorOpsPeriodDto({required this.month, required this.year});

  factory SupervisorOpsPeriodDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsPeriodDto(
      month: _asInt(json['month']),
      year: _asInt(json['year']),
    );
  }
}

class SupervisorOpsVisitsDto {
  final int completed;
  final int inProgress;
  final int total;
  final int target;
  final int progressPct;
  final int planPending;
  final int planMissed;
  final int planCompleted;

  const SupervisorOpsVisitsDto({
    required this.completed,
    required this.inProgress,
    required this.total,
    required this.target,
    required this.progressPct,
    required this.planPending,
    required this.planMissed,
    required this.planCompleted,
  });

  factory SupervisorOpsVisitsDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsVisitsDto(
      completed: _asInt(json['completed']),
      inProgress: _asInt(json['inProgress']),
      total: _asInt(json['total']),
      target: _asInt(json['target']),
      progressPct: _asInt(json['progressPct']),
      planPending: _asInt(json['planPending']),
      planMissed: _asInt(json['planMissed']),
      planCompleted: _asInt(json['planCompleted']),
    );
  }
}

class SupervisorOpsHoursDto {
  final double worked;
  final int target;
  final int progressPct;

  const SupervisorOpsHoursDto({
    required this.worked,
    required this.target,
    required this.progressPct,
  });

  factory SupervisorOpsHoursDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsHoursDto(
      worked: _asDouble(json['worked']),
      target: _asInt(json['target']),
      progressPct: _asInt(json['progressPct']),
    );
  }
}

class SupervisorOpsAssignmentsDto {
  final int centersCount;
  final int circlesCount;
  final List<SupervisorOpsCenterDto> centerList;

  const SupervisorOpsAssignmentsDto({
    required this.centersCount,
    required this.circlesCount,
    required this.centerList,
  });

  factory SupervisorOpsAssignmentsDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsAssignmentsDto(
      centersCount: _asInt(json['centersCount']),
      circlesCount: _asInt(json['circlesCount']),
      centerList: _asList(json['centerList'])
          .map((e) => SupervisorOpsCenterDto.fromJson(e))
          .toList(growable: false),
    );
  }
}

class SupervisorOpsCenterDto {
  final int id;
  final String name;

  const SupervisorOpsCenterDto({required this.id, required this.name});

  factory SupervisorOpsCenterDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsCenterDto(
      id: _asInt(json['id']),
      name: _asString(json['name']),
    );
  }
}

class SupervisorOpsUnvisitedCircleDto {
  final int id;
  final String name;
  final String centerName;

  const SupervisorOpsUnvisitedCircleDto({
    required this.id,
    required this.name,
    required this.centerName,
  });

  factory SupervisorOpsUnvisitedCircleDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsUnvisitedCircleDto(
      id: _asInt(json['id']),
      name: _asString(json['name']),
      centerName: _asString(json['centerName']),
    );
  }
}

class SupervisorOpsUnvisitedCenterDto {
  final int id;
  final String name;

  const SupervisorOpsUnvisitedCenterDto({required this.id, required this.name});

  factory SupervisorOpsUnvisitedCenterDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsUnvisitedCenterDto(
      id: _asInt(json['id']),
      name: _asString(json['name']),
    );
  }
}

class SupervisorOpsRecentVisitDto {
  final int id;
  final String centerName;
  final String? circleName;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int? durationMinutes;
  final int? rating;
  final String? observations;

  const SupervisorOpsRecentVisitDto({
    required this.id,
    required this.centerName,
    required this.circleName,
    required this.startedAt,
    required this.endedAt,
    required this.durationMinutes,
    required this.rating,
    required this.observations,
  });

  factory SupervisorOpsRecentVisitDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsRecentVisitDto(
      id: _asInt(json['id']),
      centerName: _asString(json['centerName']),
      circleName: _asNullableString(json['circleName']),
      startedAt: _asDateTime(json['startedAt']),
      endedAt: _asNullableDateTime(json['endedAt']),
      durationMinutes: _asNullableInt(json['durationMinutes']),
      rating: _asNullableInt(json['rating']),
      observations: _asNullableString(json['observations']),
    );
  }
}

class SupervisorOpsVisitPlanDto {
  final int id;
  final int centerId;
  final String centerName;
  final String status;
  final int itemsCount;
  final int completedItems;

  const SupervisorOpsVisitPlanDto({
    required this.id,
    required this.centerId,
    required this.centerName,
    required this.status,
    required this.itemsCount,
    required this.completedItems,
  });

  factory SupervisorOpsVisitPlanDto.fromJson(Map<String, dynamic> json) {
    return SupervisorOpsVisitPlanDto(
      id: _asInt(json['id']),
      centerId: _asInt(json['centerId']),
      centerName: _asString(json['centerName']),
      status: _asString(json['status']),
      itemsCount: _asInt(json['itemsCount']),
      completedItems: _asInt(json['completedItems']),
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

double _asDouble(dynamic value, [double fallback = 0.0]) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? fallback;
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
