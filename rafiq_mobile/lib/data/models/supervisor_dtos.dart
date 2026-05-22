class SupervisorDashboardDto {
  final OverallStatsDto overallStats;
  final List<HalqaReportDto> halaqat;
  final List<StrugglingStudentDto> strugglingStudents;

  SupervisorDashboardDto({
    required this.overallStats,
    required this.halaqat,
    required this.strugglingStudents,
  });

  factory SupervisorDashboardDto.fromJson(Map<String, dynamic> json) {
    return SupervisorDashboardDto(
      overallStats: OverallStatsDto.fromJson(json['overallStats'] ?? {}),
      halaqat: (json['halaqat'] as List?)
              ?.map((e) => HalqaReportDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      strugglingStudents: (json['strugglingStudents'] as List?)
              ?.map((e) =>
                  StrugglingStudentDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class OverallStatsDto {
  final int totalStudents;
  final int avgAttendance;
  final int totalHifzPages;
  final int avgPlanCompletion;
  final int strugglingStudents;
  final double avgRating;

  OverallStatsDto({
    required this.totalStudents,
    required this.avgAttendance,
    required this.totalHifzPages,
    required this.avgPlanCompletion,
    required this.strugglingStudents,
    required this.avgRating,
  });

  factory OverallStatsDto.fromJson(Map<String, dynamic> json) {
    return OverallStatsDto(
      totalStudents: json['totalStudents'] as int? ?? 0,
      avgAttendance: json['avgAttendance'] as int? ?? 0,
      totalHifzPages: json['totalHifzPages'] as int? ?? 0,
      avgPlanCompletion: json['avgPlanCompletion'] as int? ?? 0,
      strugglingStudents: json['strugglingStudents'] as int? ?? 0,
      avgRating: (json['avgRating'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class HalqaReportDto {
  final String id;
  final String name;
  final String teacher;
  final int students;
  final String trend;
  final int avgAttendance;
  final int avgHifz;
  final int avgReview;
  final double avgRating;

  HalqaReportDto({
    required this.id,
    required this.name,
    required this.teacher,
    required this.students,
    required this.trend,
    required this.avgAttendance,
    required this.avgHifz,
    required this.avgReview,
    required this.avgRating,
  });

  factory HalqaReportDto.fromJson(Map<String, dynamic> json) {
    return HalqaReportDto(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? 'بدون اسم').toString(),
      teacher: (json['teacher'] ?? 'بدون معلم').toString(),
      students: (json['students'] as num?)?.toInt() ?? 0,
      trend: (json['trend'] ?? 'up').toString(),
      avgAttendance: (json['avgAttendance'] as num?)?.toInt() ?? 0,
      avgHifz: (json['avgHifz'] as num?)?.toInt() ?? 0,
      avgReview: (json['avgReview'] as num?)?.toInt() ?? 0,
      avgRating: (json['avgRating'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class StrugglingStudentDto {
  final String id;
  final String name;
  final String halqa;
  final int hifzPercent;
  final int attendance;
  final String reason;

  StrugglingStudentDto({
    required this.id,
    required this.name,
    required this.halqa,
    required this.hifzPercent,
    required this.attendance,
    required this.reason,
  });

  factory StrugglingStudentDto.fromJson(Map<String, dynamic> json) {
    return StrugglingStudentDto(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'طالب',
      halqa: json['halqa'] as String? ?? 'حلقة',
      hifzPercent: json['hifzPercent'] as int? ?? 0,
      attendance: json['attendance'] as int? ?? 0,
      reason: json['reason'] as String? ?? 'عذر غير محدد',
    );
  }
}
