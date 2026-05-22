class StudentReportDto {
  final StudentReportStudentDto student;
  final StudentReportKpisDto kpis;
  final List<StudentAttendanceReportRowDto> attendance;
  final List<StudentFollowUpReportRowDto> followUps;
  final List<StudentExamReportRowDto> exams;

  const StudentReportDto({
    required this.student,
    required this.kpis,
    required this.attendance,
    required this.followUps,
    required this.exams,
  });

  factory StudentReportDto.fromJson(Map<String, dynamic> json) {
    return StudentReportDto(
      student: StudentReportStudentDto.fromJson(_asMap(json['student'])),
      kpis: StudentReportKpisDto.fromJson(_asMap(json['kpis'])),
      attendance: _asList(json['attendance'])
          .map(StudentAttendanceReportRowDto.fromJson)
          .toList(growable: false),
      followUps: _asList(json['followUps'])
          .map(StudentFollowUpReportRowDto.fromJson)
          .toList(growable: false),
      exams: _asList(json['exams'])
          .map(StudentExamReportRowDto.fromJson)
          .toList(growable: false),
    );
  }
}

class StudentReportStudentDto {
  final int id;
  final String fullName;
  final String email;
  final bool isActive;

  const StudentReportStudentDto({
    required this.id,
    required this.fullName,
    required this.email,
    required this.isActive,
  });

  factory StudentReportStudentDto.fromJson(Map<String, dynamic> json) {
    return StudentReportStudentDto(
      id: _asInt(json['id']),
      fullName: _asString(json['fullName'], fallback: 'الطالب'),
      email: _asString(json['email']),
      isActive: _asBool(json['isActive'], fallback: true),
    );
  }
}

class StudentReportKpisDto {
  final StudentAttendanceKpiDto attendance;
  final StudentFollowUpKpiDto followUp;
  final StudentExamsKpiDto exams;

  const StudentReportKpisDto({
    required this.attendance,
    required this.followUp,
    required this.exams,
  });

  factory StudentReportKpisDto.fromJson(Map<String, dynamic> json) {
    return StudentReportKpisDto(
      attendance: StudentAttendanceKpiDto.fromJson(_asMap(json['attendance'])),
      followUp: StudentFollowUpKpiDto.fromJson(_asMap(json['followUp'])),
      exams: StudentExamsKpiDto.fromJson(_asMap(json['exams'])),
    );
  }
}

class StudentAttendanceKpiDto {
  final int total;
  final int present;
  final int absent;
  final int late;
  final int excused;
  final double presentRate;

  const StudentAttendanceKpiDto({
    required this.total,
    required this.present,
    required this.absent,
    required this.late,
    required this.excused,
    required this.presentRate,
  });

  factory StudentAttendanceKpiDto.fromJson(Map<String, dynamic> json) {
    return StudentAttendanceKpiDto(
      total: _asInt(json['total']),
      present: _asInt(json['present']),
      absent: _asInt(json['absent']),
      late: _asInt(json['late']),
      excused: _asInt(json['excused']),
      presentRate: _asDouble(json['presentRate']),
    );
  }
}

class StudentFollowUpKpiDto {
  final int total;
  final int draft;
  final int finalized;
  final double averageRating;

  const StudentFollowUpKpiDto({
    required this.total,
    required this.draft,
    required this.finalized,
    required this.averageRating,
  });

  factory StudentFollowUpKpiDto.fromJson(Map<String, dynamic> json) {
    return StudentFollowUpKpiDto(
      total: _asInt(json['total']),
      draft: _asInt(json['draft']),
      finalized: _asInt(json['final']),
      averageRating: _asDouble(json['averageRating']),
    );
  }
}

class StudentExamsKpiDto {
  final int totalAttempts;
  final int reviewedAttempts;
  final int passedAttempts;
  final double passRate;
  final double averageScore;

  const StudentExamsKpiDto({
    required this.totalAttempts,
    required this.reviewedAttempts,
    required this.passedAttempts,
    required this.passRate,
    required this.averageScore,
  });

  factory StudentExamsKpiDto.fromJson(Map<String, dynamic> json) {
    return StudentExamsKpiDto(
      totalAttempts: _asInt(json['totalAttempts']),
      reviewedAttempts: _asInt(json['reviewedAttempts']),
      passedAttempts: _asInt(json['passedAttempts']),
      passRate: _asDouble(json['passRate']),
      averageScore: _asDouble(json['averageScore']),
    );
  }
}

class StudentAttendanceReportRowDto {
  final int id;
  final DateTime attendanceDate;
  final String status;
  final String note;
  final String circleName;
  final String centerName;

  const StudentAttendanceReportRowDto({
    required this.id,
    required this.attendanceDate,
    required this.status,
    required this.note,
    required this.circleName,
    required this.centerName,
  });

  factory StudentAttendanceReportRowDto.fromJson(Map<String, dynamic> json) {
    final circle = _asMap(json['circle']);
    final center = _asMap(circle['center']);

    return StudentAttendanceReportRowDto(
      id: _asInt(json['id']),
      attendanceDate: _asDateTime(json['attendanceDate']),
      status: _asString(json['status'], fallback: 'UNKNOWN'),
      note: _asString(json['note']),
      circleName: _asString(circle['name'], fallback: '-'),
      centerName: _asString(center['name'], fallback: '-'),
    );
  }
}

class StudentFollowUpReportRowDto {
  final int id;
  final DateTime recordDate;
  final String type;
  final String status;
  final String surah;
  final int fromAyah;
  final int toAyah;
  final double? pagesCount;
  final double? rating;
  final String notes;
  final String teacherName;
  final String circleName;
  final String centerName;

  const StudentFollowUpReportRowDto({
    required this.id,
    required this.recordDate,
    required this.type,
    required this.status,
    required this.surah,
    required this.fromAyah,
    required this.toAyah,
    required this.pagesCount,
    required this.rating,
    required this.notes,
    required this.teacherName,
    required this.circleName,
    required this.centerName,
  });

  factory StudentFollowUpReportRowDto.fromJson(Map<String, dynamic> json) {
    final teacher = _asMap(json['teacher']);
    final circle = _asMap(json['circle']);
    final center = _asMap(circle['center']);

    return StudentFollowUpReportRowDto(
      id: _asInt(json['id']),
      recordDate: _asDateTime(json['recordDate']),
      type: _asString(json['type'], fallback: 'UNKNOWN'),
      status: _asString(json['status'], fallback: 'UNKNOWN'),
      surah: _asString(json['surah']),
      fromAyah: _asInt(json['fromAyah']),
      toAyah: _asInt(json['toAyah']),
      pagesCount: _asNullableDouble(json['pagesCount']),
      rating: _asNullableDouble(json['rating']),
      notes: _asString(json['notes']),
      teacherName: _asString(teacher['fullName'], fallback: '-'),
      circleName: _asString(circle['name'], fallback: '-'),
      centerName: _asString(center['name'], fallback: '-'),
    );
  }
}

class StudentExamReportRowDto {
  final int id;
  final String status;
  final double? totalScore;
  final String gradeLabel;
  final DateTime? reviewedAt;
  final String examTitle;
  final double passScore;
  final double maxScore;
  final String centerName;
  final String circleName;

  const StudentExamReportRowDto({
    required this.id,
    required this.status,
    required this.totalScore,
    required this.gradeLabel,
    required this.reviewedAt,
    required this.examTitle,
    required this.passScore,
    required this.maxScore,
    required this.centerName,
    required this.circleName,
  });

  factory StudentExamReportRowDto.fromJson(Map<String, dynamic> json) {
    final exam = _asMap(json['exam']);
    final center = _asMap(exam['center']);
    final circle = _asMap(exam['circle']);

    return StudentExamReportRowDto(
      id: _asInt(json['id']),
      status: _asString(json['status'], fallback: 'UNKNOWN'),
      totalScore: _asNullableDouble(json['totalScore']),
      gradeLabel: _asString(json['gradeLabel']),
      reviewedAt: _asNullableDateTime(json['reviewedAt']),
      examTitle: _asString(exam['title'], fallback: 'اختبار'),
      passScore: _asDouble(exam['passScore']),
      maxScore: _asDouble(exam['maxScore']),
      centerName: _asString(center['name'], fallback: '-'),
      circleName: _asString(circle['name'], fallback: '-'),
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
    return value.whereType<Map<String, dynamic>>().toList(growable: false);
  }
  return const <Map<String, dynamic>>[];
}

String _asString(dynamic value, {String fallback = ''}) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

int _asInt(dynamic value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _asDouble(dynamic value) {
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

double? _asNullableDouble(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value.toString());
}

bool _asBool(dynamic value, {required bool fallback}) {
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  final text = value?.toString().toLowerCase().trim();
  if (text == 'true') {
    return true;
  }
  if (text == 'false') {
    return false;
  }
  return fallback;
}

DateTime _asDateTime(dynamic value) {
  return DateTime.tryParse(value?.toString() ?? '') ??
      DateTime.fromMillisecondsSinceEpoch(0);
}

DateTime? _asNullableDateTime(dynamic value) {
  final text = value?.toString().trim() ?? '';
  if (text.isEmpty) {
    return null;
  }
  return DateTime.tryParse(text);
}
