class TeacherPlanSegmentDto {
  final int? fromSurah;
  final int? fromAyah;
  final int? toSurah;
  final int? toAyah;
  final double? targetPages;
  final double? dailyRate;

  const TeacherPlanSegmentDto({
    required this.fromSurah,
    required this.fromAyah,
    required this.toSurah,
    required this.toAyah,
    required this.targetPages,
    required this.dailyRate,
  });

  factory TeacherPlanSegmentDto.fromJson(Map<String, dynamic> json) {
    return TeacherPlanSegmentDto(
      fromSurah: _asNullableInt(json['fromSurah']),
      fromAyah: _asNullableInt(json['fromAyah']),
      toSurah: _asNullableInt(json['toSurah']),
      toAyah: _asNullableInt(json['toAyah']),
      targetPages: _asNullableDouble(json['targetPages']),
      dailyRate: _asNullableDouble(json['dailyRate']),
    );
  }
}

class TeacherPlanStudentDto {
  final int id;
  final String fullName;
  final String? level;
  final int? currentJuzz;

  const TeacherPlanStudentDto({
    required this.id,
    required this.fullName,
    required this.level,
    required this.currentJuzz,
  });

  factory TeacherPlanStudentDto.fromJson(Map<String, dynamic> json) {
    return TeacherPlanStudentDto(
      id: _asInt(json['id']),
      fullName: _asString(json['fullName'], fallback: 'الطالب'),
      level: _asNullableString(json['level']),
      currentJuzz: _asNullableInt(json['currentJuzz']),
    );
  }
}

class TeacherPlanProgressAttendanceDto {
  final int presentDays;
  final int totalDays;

  const TeacherPlanProgressAttendanceDto({
    required this.presentDays,
    required this.totalDays,
  });

  factory TeacherPlanProgressAttendanceDto.fromJson(Map<String, dynamic> json) {
    return TeacherPlanProgressAttendanceDto(
      presentDays: _asInt(json['presentDays']),
      totalDays: _asInt(json['totalDays']),
    );
  }
}

class TeacherPlanLatestReachedDto {
  final int? surah;
  final int? toSurah;
  final int? toAyah;
  final int? toPage;

  const TeacherPlanLatestReachedDto({
    required this.surah,
    required this.toSurah,
    required this.toAyah,
    required this.toPage,
  });

  factory TeacherPlanLatestReachedDto.fromJson(Map<String, dynamic> json) {
    return TeacherPlanLatestReachedDto(
      surah: _asNullableInt(json['surah']),
      toSurah: _asNullableInt(json['toSurah']),
      toAyah: _asNullableInt(json['toAyah']),
      toPage: _asNullableInt(json['toPage']),
    );
  }
}

class TeacherPlanProgressDto {
  final double hifzExecutedPages;
  final double reviewExecutedPages;
  final double hifzCompletionRate;
  final double reviewCompletionRate;
  final int? memorizedPages;
  final TeacherPlanLatestReachedDto? latestReached;
  final TeacherPlanProgressAttendanceDto attendance;

  const TeacherPlanProgressDto({
    required this.hifzExecutedPages,
    required this.reviewExecutedPages,
    required this.hifzCompletionRate,
    required this.reviewCompletionRate,
    required this.memorizedPages,
    required this.latestReached,
    required this.attendance,
  });

  factory TeacherPlanProgressDto.fromJson(Map<String, dynamic> json) {
    return TeacherPlanProgressDto(
      hifzExecutedPages: _asDouble(json['hifzExecutedPages']),
      reviewExecutedPages: _asDouble(json['reviewExecutedPages']),
      hifzCompletionRate: _asDouble(json['hifzCompletionRate']),
      reviewCompletionRate: _asDouble(json['reviewCompletionRate']),
      memorizedPages: _asNullableInt(json['memorizedPages']),
      latestReached: json['latestReached'] is Map<String, dynamic>
          ? TeacherPlanLatestReachedDto.fromJson(
              json['latestReached'] as Map<String, dynamic>,
            )
          : null,
      attendance: TeacherPlanProgressAttendanceDto.fromJson(
        _asMap(json['attendance']),
      ),
    );
  }
}

class TeacherMonthlyPlanDto {
  final int id;
  final int studentId;
  final int circleId;
  final int month;
  final int year;
  final String status;
  final DateTime? approvedAt;
  final String? notes;
  final TeacherPlanStudentDto? student;
  final TeacherPlanSegmentDto hifz;
  final TeacherPlanSegmentDto review;
  final TeacherPlanProgressDto progress;

  const TeacherMonthlyPlanDto({
    required this.id,
    required this.studentId,
    required this.circleId,
    required this.month,
    required this.year,
    required this.status,
    required this.approvedAt,
    required this.notes,
    required this.student,
    required this.hifz,
    required this.review,
    required this.progress,
  });

  factory TeacherMonthlyPlanDto.fromJson(Map<String, dynamic> json) {
    return TeacherMonthlyPlanDto(
      id: _asInt(json['id']),
      studentId: _asInt(json['studentId']),
      circleId: _asInt(json['circleId']),
      month: _asInt(json['month']),
      year: _asInt(json['year']),
      status: _asString(json['status'], fallback: 'PENDING'),
      approvedAt: _asNullableDateTime(json['approvedAt']),
      notes: _asNullableString(json['notes']),
      student: json['student'] is Map<String, dynamic>
          ? TeacherPlanStudentDto.fromJson(
              json['student'] as Map<String, dynamic>)
          : null,
      hifz: TeacherPlanSegmentDto.fromJson(_asMap(json['hifz'])),
      review: TeacherPlanSegmentDto.fromJson(_asMap(json['review'])),
      progress: TeacherPlanProgressDto.fromJson(_asMap(json['progress'])),
    );
  }
}

class TeacherMonthlyPlansSummaryDto {
  final int total;
  final int approved;
  final int pending;
  final int modified;

  const TeacherMonthlyPlansSummaryDto({
    required this.total,
    required this.approved,
    required this.pending,
    required this.modified,
  });

  factory TeacherMonthlyPlansSummaryDto.fromJson(Map<String, dynamic> json) {
    return TeacherMonthlyPlansSummaryDto(
      total: _asInt(json['total']),
      approved: _asInt(json['approved']),
      pending: _asInt(json['pending']),
      modified: _asInt(json['modified']),
    );
  }
}

class TeacherMonthlyPlansListDto {
  final int month;
  final int year;
  final TeacherMonthlyPlansSummaryDto summary;
  final List<TeacherMonthlyPlanDto> plans;
  final int generated;
  final int preserved;

  const TeacherMonthlyPlansListDto({
    required this.month,
    required this.year,
    required this.summary,
    required this.plans,
    this.generated = 0,
    this.preserved = 0,
  });

  factory TeacherMonthlyPlansListDto.fromJson(Map<String, dynamic> json) {
    return TeacherMonthlyPlansListDto(
      month: _asInt(json['month']),
      year: _asInt(json['year']),
      summary: TeacherMonthlyPlansSummaryDto.fromJson(_asMap(json['summary'])),
      plans: _asList(json['plans'])
          .map(TeacherMonthlyPlanDto.fromJson)
          .toList(growable: false),
      generated: _asInt(json['generated']),
      preserved: _asInt(json['preserved']),
    );
  }
}

class TeacherPreparationCircleDto {
  final String type;
  final int id;
  final int centerId;
  final String name;
  final String? locationText;
  final double? latitude;
  final double? longitude;
  final int? allowedRadiusMeters;

  const TeacherPreparationCircleDto({
    required this.type,
    required this.id,
    required this.centerId,
    required this.name,
    required this.locationText,
    required this.latitude,
    required this.longitude,
    required this.allowedRadiusMeters,
  });

  factory TeacherPreparationCircleDto.fromJson(Map<String, dynamic> json) {
    return TeacherPreparationCircleDto(
      type: _asString(json['type'], fallback: 'CIRCLE'),
      id: _asInt(json['id']),
      centerId: _asInt(json['centerId']),
      name: _asString(json['name'], fallback: 'الحلقة'),
      locationText: _asNullableString(json['locationText']),
      latitude: _asNullableDouble(json['latitude']),
      longitude: _asNullableDouble(json['longitude']),
      allowedRadiusMeters: _asNullableInt(json['allowedRadiusMeters']),
    );
  }
}

class TeacherPreparationActiveCircleDto {
  final int circleId;
  final int? assignmentId;
  final String circleName;

  const TeacherPreparationActiveCircleDto({
    required this.circleId,
    required this.assignmentId,
    required this.circleName,
  });

  factory TeacherPreparationActiveCircleDto.fromJson(
    Map<String, dynamic> json,
  ) {
    return TeacherPreparationActiveCircleDto(
      circleId: _asInt(json['circleId']),
      assignmentId: _asNullableInt(json['assignmentId']),
      circleName: _asString(json['circleName'], fallback: 'Circle'),
    );
  }
}

class TeacherEffectiveShiftDto {
  final DateTime start;
  final DateTime end;

  const TeacherEffectiveShiftDto({
    required this.start,
    required this.end,
  });

  factory TeacherEffectiveShiftDto.fromJson(Map<String, dynamic> json) {
    return TeacherEffectiveShiftDto(
      start: _asDateTime(json['start']),
      end: _asDateTime(json['end']),
    );
  }
}

class TeacherPreparationGeoCheckDto {
  final String state;
  final String message;
  final bool? isWithinRange;
  final int? distanceMeters;
  final int? allowedRadiusMeters;
  final String? locationText;

  const TeacherPreparationGeoCheckDto({
    required this.state,
    required this.message,
    required this.isWithinRange,
    required this.distanceMeters,
    required this.allowedRadiusMeters,
    required this.locationText,
  });

  factory TeacherPreparationGeoCheckDto.fromJson(Map<String, dynamic> json) {
    return TeacherPreparationGeoCheckDto(
      state: _asString(json['state'], fallback: 'unavailable'),
      message: _asString(json['message']),
      isWithinRange: _asNullableBool(json['isWithinRange']),
      distanceMeters: _asNullableInt(json['distanceMeters']),
      allowedRadiusMeters: _asNullableInt(json['allowedRadiusMeters']),
      locationText: _asNullableString(json['locationText']),
    );
  }
}

class TeacherPreparationRecordDto {
  final int id;
  final DateTime attendanceDate;
  final String status;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final String? note;
  final DateTime? effectiveShiftStart;
  final DateTime? effectiveShiftEnd;
  final String? staffRole;

  const TeacherPreparationRecordDto({
    required this.id,
    required this.attendanceDate,
    required this.status,
    required this.checkInTime,
    required this.checkOutTime,
    required this.note,
    required this.effectiveShiftStart,
    required this.effectiveShiftEnd,
    required this.staffRole,
  });

  factory TeacherPreparationRecordDto.fromJson(Map<String, dynamic> json) {
    return TeacherPreparationRecordDto(
      id: _asInt(json['id']),
      attendanceDate: _asDateTime(json['attendanceDate']),
      status: _asString(json['status'], fallback: 'ABSENT'),
      checkInTime: _asNullableDateTime(json['checkInTime']),
      checkOutTime: _asNullableDateTime(json['checkOutTime']),
      note: _asNullableString(json['note']),
      effectiveShiftStart: _asNullableDateTime(json['effectiveShiftStart']),
      effectiveShiftEnd: _asNullableDateTime(json['effectiveShiftEnd']),
      staffRole: _asNullableString(json['staffRole']),
    );
  }
}

class TeacherPreparationTodayDto {
  final DateTime date;
  final String status;
  final TeacherPreparationRecordDto? attendance;
  final TeacherPreparationGeoCheckDto geoCheck;
  final Map<String, dynamic>? excuse;

  const TeacherPreparationTodayDto({
    required this.date,
    required this.status,
    required this.attendance,
    required this.geoCheck,
    required this.excuse,
  });

  factory TeacherPreparationTodayDto.fromJson(Map<String, dynamic> json) {
    return TeacherPreparationTodayDto(
      date: _asDateTime(json['date']),
      status: _asString(json['status'], fallback: 'not_checked_in'),
      attendance: json['attendance'] is Map<String, dynamic>
          ? TeacherPreparationRecordDto.fromJson(
              json['attendance'] as Map<String, dynamic>,
            )
          : null,
      geoCheck:
          TeacherPreparationGeoCheckDto.fromJson(_asMap(json['geoCheck'])),
      excuse: json['excuse'] is Map<String, dynamic>
          ? json['excuse'] as Map<String, dynamic>
          : null,
    );
  }
}

class TeacherPreparationStatsDto {
  final int totalDays;
  final int presentDays;
  final int absentDays;
  final int excusedDays;
  final int onLeaveDays;

  const TeacherPreparationStatsDto({
    required this.totalDays,
    required this.presentDays,
    required this.absentDays,
    required this.excusedDays,
    required this.onLeaveDays,
  });

  factory TeacherPreparationStatsDto.fromJson(Map<String, dynamic> json) {
    return TeacherPreparationStatsDto(
      totalDays: _asInt(json['totalDays']),
      presentDays: _asInt(json['presentDays']),
      absentDays: _asInt(json['absentDays']),
      excusedDays: _asInt(json['excusedDays']),
      onLeaveDays: _asInt(json['onLeaveDays']),
    );
  }
}

class TeacherPreparationEligibilityDto {
  final bool canCheckIn;
  final bool canCheckOut;
  final List<String> checkInBlockedReasons;
  final List<String> checkOutBlockedReasons;
  final DateTime? checkInOpenAt;
  final DateTime? checkInCloseAt;
  final DateTime? checkOutOpenAt;
  final DateTime? checkOutCloseAt;

  const TeacherPreparationEligibilityDto({
    required this.canCheckIn,
    required this.canCheckOut,
    required this.checkInBlockedReasons,
    required this.checkOutBlockedReasons,
    this.checkInOpenAt,
    this.checkInCloseAt,
    this.checkOutOpenAt,
    this.checkOutCloseAt,
  });

  factory TeacherPreparationEligibilityDto.fromJson(Map<String, dynamic> json) {
    return TeacherPreparationEligibilityDto(
      canCheckIn: _asNullableBool(json['canCheckIn']) ?? false,
      canCheckOut: _asNullableBool(json['canCheckOut']) ?? false,
      checkInBlockedReasons: (json['checkInBlockedReasons'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      checkOutBlockedReasons: (json['checkOutBlockedReasons'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      checkInOpenAt: _asNullableDateTime(json['checkInOpenAt']),
      checkInCloseAt: _asNullableDateTime(json['checkInCloseAt']),
      checkOutOpenAt: _asNullableDateTime(json['checkOutOpenAt']),
      checkOutCloseAt: _asNullableDateTime(json['checkOutCloseAt']),
    );
  }
}

class TeacherPreparationDto {
  final int month;
  final int year;
  final TeacherPreparationCircleDto circle;
  final List<TeacherPreparationActiveCircleDto> activeCircles;
  final TeacherEffectiveShiftDto? effectiveShift;
  final TeacherPreparationTodayDto today;
  final TeacherPreparationStatsDto stats;
  final List<TeacherPreparationRecordDto> history;
  final List<Map<String, dynamic>> excuses;
  final TeacherPreparationEligibilityDto? eligibility;

  const TeacherPreparationDto({
    required this.month,
    required this.year,
    required this.circle,
    required this.activeCircles,
    required this.effectiveShift,
    required this.today,
    required this.stats,
    required this.history,
    required this.excuses,
    required this.eligibility,
  });

  factory TeacherPreparationDto.fromJson(Map<String, dynamic> json) {
    final target = json['target'] is Map
        ? Map<String, dynamic>.from(json['target'] as Map)
        : _asMap(json['circle']);

    return TeacherPreparationDto(
      month: _asInt(json['month']),
      year: _asInt(json['year']),
      circle: TeacherPreparationCircleDto.fromJson(target),
      activeCircles: _asList(json['activeCircles'])
          .map(TeacherPreparationActiveCircleDto.fromJson)
          .toList(growable: false),
      effectiveShift: json['effectiveShift'] is Map
          ? TeacherEffectiveShiftDto.fromJson(
              Map<String, dynamic>.from(json['effectiveShift'] as Map),
            )
          : null,
      today: TeacherPreparationTodayDto.fromJson(_asMap(json['today'])),
      stats: TeacherPreparationStatsDto.fromJson(_asMap(json['stats'])),
      history: _asList(json['history'])
          .map(TeacherPreparationRecordDto.fromJson)
          .toList(growable: false),
      excuses: _asList(json['excuses']),
      eligibility: json['eligibility'] is Map
          ? TeacherPreparationEligibilityDto.fromJson(
              Map<String, dynamic>.from(json['eligibility'] as Map),
            )
          : null,
    );
  }
}

class TeacherHalqaReportDto {
  final Map<String, dynamic> circle;
  final Map<String, dynamic> period;
  final Map<String, dynamic> summary;
  final List<Map<String, dynamic>> students;
  final List<Map<String, dynamic>> activities;

  const TeacherHalqaReportDto({
    required this.circle,
    required this.period,
    required this.summary,
    required this.students,
    required this.activities,
  });

  factory TeacherHalqaReportDto.fromJson(Map<String, dynamic> json) {
    return TeacherHalqaReportDto(
      circle: _asMap(json['circle']),
      period: _asMap(json['period']),
      summary: _asMap(json['summary']),
      students: _asList(json['students']),
      activities: _asList(json['activities']),
    );
  }
}

class ReportExportDto {
  final int fileId;
  final String name;
  final String kind;
  final String downloadUrl;

  const ReportExportDto({
    required this.fileId,
    required this.name,
    required this.kind,
    required this.downloadUrl,
  });

  factory ReportExportDto.fromJson(Map<String, dynamic> json) {
    return ReportExportDto(
      fileId: _asInt(json['fileId']),
      name: _asString(json['name'], fallback: 'report'),
      kind: _asString(json['kind'], fallback: 'PDF'),
      downloadUrl: _asString(json['downloadUrl']),
    );
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
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

double? _asNullableDouble(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}

double _asDouble(dynamic value, [double fallback = 0]) {
  return _asNullableDouble(value) ?? fallback;
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

bool? _asNullableBool(dynamic value) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final text = value?.toString().toLowerCase().trim();
  if (text == 'true') return true;
  if (text == 'false') return false;
  return null;
}
