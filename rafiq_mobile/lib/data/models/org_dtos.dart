class OrgCircleDto {
  final int id;
  final int centerId;
  final String name;
  final String? nameEn;
  final String? circleType;
  final bool isActive;
  final int? teacherId;
  final String? teacherName;
  final String? centerName;
  final String? locationText;
  final int studentsCount;
  final int weeklyScheduleCount;

  const OrgCircleDto({
    required this.id,
    required this.centerId,
    required this.name,
    this.nameEn,
    this.circleType,
    required this.isActive,
    this.teacherId,
    this.teacherName,
    this.centerName,
    this.locationText,
    required this.studentsCount,
    required this.weeklyScheduleCount,
  });

  factory OrgCircleDto.fromJson(Map<String, dynamic> json) {
    final teacher = json['teacher'];
    final center = json['center'];
    final count = json['_count'];
    final weeklySchedule = json['weeklyScheduleSlots'];

    return OrgCircleDto(
      id: _asInt(json['id']),
      centerId: _asInt(json['centerId'] ?? (center as Map?)?['id']),
      name: (json['name'] ?? '').toString(),
      nameEn: _asNullableString(json['nameEn']),
      circleType: _asNullableString(json['circleType']),
      isActive: json['isActive'] is bool ? json['isActive'] as bool : true,
      teacherId: _tryInt(json['teacherId'] ?? (teacher as Map?)?['id']),
      teacherName: _asNullableString((teacher as Map?)?['fullName']),
      centerName: _asNullableString((center as Map?)?['name']),
      locationText: _asNullableString(json['locationText']),
      studentsCount:
          _asInt((count as Map?)?['students'] ?? count?['enrollments']),
      weeklyScheduleCount: weeklySchedule is List ? weeklySchedule.length : 0,
    );
  }
}

int _asInt(dynamic value, [int fallback = 0]) {
  final parsed = int.tryParse('$value');
  return parsed ?? fallback;
}

int? _tryInt(dynamic value) {
  final parsed = int.tryParse('$value');
  return parsed;
}

String? _asNullableString(dynamic value) {
  final text = value?.toString().trim();
  if (text == null || text.isEmpty) {
    return null;
  }
  return text;
}
