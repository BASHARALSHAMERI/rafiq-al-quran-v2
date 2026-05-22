import 'package:freezed_annotation/freezed_annotation.dart';

part 'exam_dtos.freezed.dart';
part 'exam_dtos.g.dart';

@freezed
class ExamDto with _$ExamDto {
  const factory ExamDto({
    required int id,
    required String title,
    required String type,
    String? examBranch,
    required double maxScore,
    required double passScore,
    required String status,
    int? centerId,
    int? circleId,
    String? scheduledAt,
    int? createdById,
    String? createdAt,
    String? updatedAt,
    ExamCenterDto? center,
    ExamCircleDto? circle,
    ExamUserSummaryDto? createdBy,
    ExamCriteriaDto? criteria,
  }) = _ExamDto;

  factory ExamDto.fromJson(Map<String, dynamic> json) =>
      _$ExamDtoFromJson(json);
}

@freezed
class ExamRangeDto with _$ExamRangeDto {
  const factory ExamRangeDto({
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
  }) = _ExamRangeDto;

  factory ExamRangeDto.fromJson(Map<String, dynamic> json) =>
      _$ExamRangeDtoFromJson(json);
}

@freezed
class ExamCenterDto with _$ExamCenterDto {
  const factory ExamCenterDto({
    required int id,
    required String name,
    String? code,
  }) = _ExamCenterDto;

  factory ExamCenterDto.fromJson(Map<String, dynamic> json) =>
      _$ExamCenterDtoFromJson(json);
}

@freezed
class ExamCircleDto with _$ExamCircleDto {
  const factory ExamCircleDto({
    required int id,
    required String name,
    required int centerId,
    int? teacherId,
    ExamCenterDto? center,
  }) = _ExamCircleDto;

  factory ExamCircleDto.fromJson(Map<String, dynamic> json) =>
      _$ExamCircleDtoFromJson(json);
}

@freezed
class ExamUserSummaryDto with _$ExamUserSummaryDto {
  const factory ExamUserSummaryDto({
    required int id,
    required String fullName,
    String? email,
    String? role,
  }) = _ExamUserSummaryDto;

  factory ExamUserSummaryDto.fromJson(Map<String, dynamic> json) =>
      _$ExamUserSummaryDtoFromJson(json);
}

@freezed
class ExamCriteriaDto with _$ExamCriteriaDto {
  const factory ExamCriteriaDto({
    required int id,
    required double memorizationScore,
    required double tajweedScore,
    required double theoreticalTajweedScore,
    required double performanceScore,
    required double promptingPenalty,
    required double remindingPenalty,
    required double tajweedPenalty,
  }) = _ExamCriteriaDto;

  factory ExamCriteriaDto.fromJson(Map<String, dynamic> json) =>
      _$ExamCriteriaDtoFromJson(json);
}

@freezed
class ExamSummaryDto with _$ExamSummaryDto {
  const factory ExamSummaryDto({
    required int id,
    required String title,
    String? type,
    String? examBranch,
    int? centerId,
    int? circleId,
    required double maxScore,
    required double passScore,
    required String status,
    String? scheduledAt,
    ExamCenterDto? center,
    ExamCircleDto? circle,
    ExamCriteriaDto? criteria,
    ExamRangeDto? juzRange,
  }) = _ExamSummaryDto;

  factory ExamSummaryDto.fromJson(Map<String, dynamic> json) =>
      _$ExamSummaryDtoFromJson(json);
}

@freezed
class ExamAttemptBreakdownDto with _$ExamAttemptBreakdownDto {
  const factory ExamAttemptBreakdownDto({
    required int id,
    double? memorizationScore,
    double? tajweedScore,
    double? theoreticalTajweedScore,
    double? performanceScore,
    double? promptingDeductions,
    double? remindingDeductions,
    double? tajweedDeductions,
    String? strengthNotes,
    String? weaknessNotes,
  }) = _ExamAttemptBreakdownDto;

  factory ExamAttemptBreakdownDto.fromJson(Map<String, dynamic> json) =>
      _$ExamAttemptBreakdownDtoFromJson(json);
}

@freezed
class ExamAttemptCommitteeMemberDto with _$ExamAttemptCommitteeMemberDto {
  const factory ExamAttemptCommitteeMemberDto({
    required int id,
    required int userId,
    String? committeeRole,
    String? roleAtAssignment,
    int? assignedById,
    String? createdAt,
    ExamUserSummaryDto? user,
  }) = _ExamAttemptCommitteeMemberDto;

  factory ExamAttemptCommitteeMemberDto.fromJson(Map<String, dynamic> json) =>
      _$ExamAttemptCommitteeMemberDtoFromJson(json);
}

@freezed
class ExamAttemptQuestionDto with _$ExamAttemptQuestionDto {
  const factory ExamAttemptQuestionDto({
    required int id,
    required int orderIndex,
    required String source,
    required int fromSurah,
    required int fromAyah,
    required int toSurah,
    required int toAyah,
    @Default(0) double promptingDeductions,
    @Default(0) double remindingDeductions,
    @Default(0) double tajweedDeductions,
    @Default(false) bool isEvaluated,
    String? createdAt,
    String? updatedAt,
  }) = _ExamAttemptQuestionDto;

  factory ExamAttemptQuestionDto.fromJson(Map<String, dynamic> json) =>
      _$ExamAttemptQuestionDtoFromJson(json);
}

@freezed
class ExamAttemptDto with _$ExamAttemptDto {
  const factory ExamAttemptDto({
    required int id,
    required int examId,
    required int studentId,
    required int circleId,
    required String status,
    String? examDate,
    String? fullQuranCompletedAt,
    int? stabilizationDays,
    String? committeeNotes,
    double? totalScore,
    String? gradeLabel,
    String? startedAt,
    String? submittedAt,
    String? reviewedAt,
    int? evaluatedById,
    int? lockVersion,
    String? createdAt,
    String? updatedAt,
    ExamUserSummaryDto? student,
    ExamCircleDto? circle,
    List<ExamAttemptCommitteeMemberDto>? committeeMembers,
    List<ExamAttemptQuestionDto>? questions,
    ExamUserSummaryDto? evaluatedBy,
    ExamAttemptBreakdownDto? breakdown,
    ExamSummaryDto? exam,
    ExamRangeDto? examRange,
  }) = _ExamAttemptDto;

  factory ExamAttemptDto.fromJson(Map<String, dynamic> json) =>
      _$ExamAttemptDtoFromJson(json);
}

@freezed
class CreateExamRequestDto with _$CreateExamRequestDto {
  const factory CreateExamRequestDto({
    required String title,
    required String type,
    String? examBranch,
    required double maxScore,
    required double passScore,
    CreateExamCriteriaRequestDto? criteria,
  }) = _CreateExamRequestDto;

  factory CreateExamRequestDto.fromJson(Map<String, dynamic> json) =>
      _$CreateExamRequestDtoFromJson(json);
}

@freezed
class CreateExamCriteriaRequestDto with _$CreateExamCriteriaRequestDto {
  const factory CreateExamCriteriaRequestDto({
    required double memorizationScore,
    required double tajweedScore,
    required double theoreticalTajweedScore,
    required double performanceScore,
    required double promptingPenalty,
    required double remindingPenalty,
    required double tajweedPenalty,
  }) = _CreateExamCriteriaRequestDto;

  factory CreateExamCriteriaRequestDto.fromJson(Map<String, dynamic> json) =>
      _$CreateExamCriteriaRequestDtoFromJson(json);
}

@freezed
class CreateExamAttemptRequestDto with _$CreateExamAttemptRequestDto {
  const factory CreateExamAttemptRequestDto({
    required int studentId,
    required int circleId,
    required String examDate,
    String? fullQuranCompletedAt,
    required List<int> committeeMemberIds,
  }) = _CreateExamAttemptRequestDto;

  factory CreateExamAttemptRequestDto.fromJson(Map<String, dynamic> json) =>
      _$CreateExamAttemptRequestDtoFromJson(json);
}

@freezed
class UpdateAttemptCommitteeRequestDto with _$UpdateAttemptCommitteeRequestDto {
  const factory UpdateAttemptCommitteeRequestDto({
    String? examDate,
    String? fullQuranCompletedAt,
    List<int>? committeeMemberIds,
    int? lockVersion,
  }) = _UpdateAttemptCommitteeRequestDto;

  factory UpdateAttemptCommitteeRequestDto.fromJson(
          Map<String, dynamic> json) =>
      _$UpdateAttemptCommitteeRequestDtoFromJson(json);
}

@freezed
class GenerateAttemptQuestionsRequestDto
    with _$GenerateAttemptQuestionsRequestDto {
  const factory GenerateAttemptQuestionsRequestDto({
    int? count,
  }) = _GenerateAttemptQuestionsRequestDto;

  factory GenerateAttemptQuestionsRequestDto.fromJson(
          Map<String, dynamic> json) =>
      _$GenerateAttemptQuestionsRequestDtoFromJson(json);
}

@freezed
class ScoreAttemptQuestionRequestDto with _$ScoreAttemptQuestionRequestDto {
  const factory ScoreAttemptQuestionRequestDto({
    required int id,
    required double promptingDeductions,
    required double remindingDeductions,
    required double tajweedDeductions,
    required bool isEvaluated,
  }) = _ScoreAttemptQuestionRequestDto;

  factory ScoreAttemptQuestionRequestDto.fromJson(Map<String, dynamic> json) =>
      _$ScoreAttemptQuestionRequestDtoFromJson(json);
}

@freezed
class ScoreAttemptRequestDto with _$ScoreAttemptRequestDto {
  const factory ScoreAttemptRequestDto({
    required double memorizationScore,
    required double tajweedScore,
    required double theoreticalTajweedScore,
    required double performanceScore,
    required double promptingDeductions,
    required double remindingDeductions,
    required double tajweedDeductions,
    String? committeeNotes,
    String? strengthNotes,
    String? weaknessNotes,
    List<ScoreAttemptQuestionRequestDto>? questions,
  }) = _ScoreAttemptRequestDto;

  factory ScoreAttemptRequestDto.fromJson(Map<String, dynamic> json) =>
      _$ScoreAttemptRequestDtoFromJson(json);
}

@freezed
class ShareAttemptResultResponseDto with _$ShareAttemptResultResponseDto {
  const factory ShareAttemptResultResponseDto({
    required int createdCount,
  }) = _ShareAttemptResultResponseDto;

  factory ShareAttemptResultResponseDto.fromJson(Map<String, dynamic> json) =>
      _$ShareAttemptResultResponseDtoFromJson(json);
}

class ExamNominationDto {
  final int id;
  final int examId;
  final int studentId;
  final int centerId;
  final int circleId;
  final String status;
  final String? proposedExamDate;
  final String? teacherNotes;
  final int? readinessScore;
  final String? supervisorReviewNotes;
  final String? centerApprovalNotes;
  final String createdAt;
  final String updatedAt;
  final ExamSummaryDto? exam;
  final ExamCircleDto? circle;
  final ExamCenterDto? center;
  final ExamUserSummaryDto? student;

  const ExamNominationDto({
    required this.id,
    required this.examId,
    required this.studentId,
    required this.centerId,
    required this.circleId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.proposedExamDate,
    this.teacherNotes,
    this.readinessScore,
    this.supervisorReviewNotes,
    this.centerApprovalNotes,
    this.exam,
    this.circle,
    this.center,
    this.student,
  });

  factory ExamNominationDto.fromJson(Map<String, dynamic> json) {
    int toInt(dynamic value) => int.tryParse('$value') ?? 0;

    return ExamNominationDto(
      id: toInt(json['id']),
      examId: toInt(json['examId']),
      studentId: toInt(json['studentId']),
      centerId: toInt(json['centerId']),
      circleId: toInt(json['circleId']),
      status: (json['status'] ?? '').toString(),
      proposedExamDate: json['proposedExamDate']?.toString(),
      teacherNotes: json['teacherNotes']?.toString(),
      readinessScore: int.tryParse('${json['readinessScore'] ?? ''}'),
      supervisorReviewNotes: json['supervisorReviewNotes']?.toString(),
      centerApprovalNotes: json['centerApprovalNotes']?.toString(),
      createdAt: (json['createdAt'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? '').toString(),
      exam: json['exam'] is Map<String, dynamic>
          ? ExamSummaryDto.fromJson(json['exam'] as Map<String, dynamic>)
          : null,
      circle: json['circle'] is Map<String, dynamic>
          ? ExamCircleDto.fromJson(json['circle'] as Map<String, dynamic>)
          : null,
      center: json['center'] is Map<String, dynamic>
          ? ExamCenterDto.fromJson(json['center'] as Map<String, dynamic>)
          : null,
      student: json['student'] is Map<String, dynamic>
          ? ExamUserSummaryDto.fromJson(json['student'] as Map<String, dynamic>)
          : null,
    );
  }
}

class CreateNominationRequestDto {
  final int examId;
  final int studentId;
  final int circleId;
  final String? teacherNotes;
  final int? readinessScore;
  final String? proposedExamDate;

  const CreateNominationRequestDto({
    required this.examId,
    required this.studentId,
    required this.circleId,
    this.teacherNotes,
    this.readinessScore,
    this.proposedExamDate,
  });

  Map<String, dynamic> toJson() {
    return {
      'examId': examId,
      'studentId': studentId,
      'circleId': circleId,
      if (teacherNotes != null && teacherNotes!.trim().isNotEmpty)
        'teacherNotes': teacherNotes!.trim(),
      if (readinessScore != null) 'readinessScore': readinessScore,
      if (proposedExamDate != null && proposedExamDate!.trim().isNotEmpty)
        'proposedExamDate': proposedExamDate!.trim(),
    };
  }
}

class SupervisorReviewNominationRequestDto {
  final String decision;
  final String? notes;

  const SupervisorReviewNominationRequestDto({
    required this.decision,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'decision': decision,
      if (notes != null && notes!.trim().isNotEmpty) 'notes': notes!.trim(),
    };
  }
}

class EvaluateAttemptRequestDto {
  final int memorizationScore;
  final int tajweedScore;
  final int theoreticalTajweedScore;
  final int performanceScore;
  final String? committeeNotes;
  final String? strengthNotes;
  final String? weaknessNotes;
  final List<ScoreAttemptQuestionRequestDto> questions;

  const EvaluateAttemptRequestDto({
    required this.memorizationScore,
    required this.tajweedScore,
    required this.theoreticalTajweedScore,
    required this.performanceScore,
    required this.questions,
    this.committeeNotes,
    this.strengthNotes,
    this.weaknessNotes,
  });

  Map<String, dynamic> toJson() {
    return {
      'memorizationScore': memorizationScore,
      'tajweedScore': tajweedScore,
      'theoreticalTajweedScore': theoreticalTajweedScore,
      'performanceScore': performanceScore,
      if (committeeNotes != null && committeeNotes!.trim().isNotEmpty)
        'committeeNotes': committeeNotes!.trim(),
      if (strengthNotes != null && strengthNotes!.trim().isNotEmpty)
        'strengthNotes': strengthNotes!.trim(),
      if (weaknessNotes != null && weaknessNotes!.trim().isNotEmpty)
        'weaknessNotes': weaknessNotes!.trim(),
      'questions': questions
          .map((question) => question.toJson())
          .toList(growable: false),
    };
  }
}

// ─── New DTOs for question management, reopen, and Quran preview ───

class CreateAttemptQuestionRequestDto {
  final int fromSurah;
  final int fromAyah;
  final int toSurah;
  final int toAyah;

  const CreateAttemptQuestionRequestDto({
    required this.fromSurah,
    required this.fromAyah,
    required this.toSurah,
    required this.toAyah,
  });

  Map<String, dynamic> toJson() => {
        'fromSurah': fromSurah,
        'fromAyah': fromAyah,
        'toSurah': toSurah,
        'toAyah': toAyah,
      };
}

class ReopenAttemptRequestDto {
  final String reason;

  const ReopenAttemptRequestDto({required this.reason});

  Map<String, dynamic> toJson() => {'reason': reason};
}

class QuranPreviewAyahDto {
  final int surahNumber;
  final int ayahNumber;
  final String text;
  final int? pageNumber;

  const QuranPreviewAyahDto({
    required this.surahNumber,
    required this.ayahNumber,
    required this.text,
    this.pageNumber,
  });

  factory QuranPreviewAyahDto.fromJson(Map<String, dynamic> json) {
    return QuranPreviewAyahDto(
      surahNumber: (json['surahNumber'] ?? json['surah'] as num?)?.toInt() ?? 0,
      ayahNumber: (json['ayahNumber'] ?? json['ayah'] as num?)?.toInt() ?? 0,
      text: (json['text'] ?? '').toString(),
      pageNumber: (json['pageNumber'] ?? json['page'] as num?)?.toInt(),
    );
  }
}

class QuranSurahPreviewDto {
  final int surahNumber;
  final List<QuranPreviewAyahDto> ayahs;

  const QuranSurahPreviewDto({
    required this.surahNumber,
    required this.ayahs,
  });

  factory QuranSurahPreviewDto.fromJson(Map<String, dynamic> json) {
    final ayahList = json['ayahs'];
    final ayahs = (ayahList is List)
        ? ayahList
            .whereType<Map<String, dynamic>>()
            .map(QuranPreviewAyahDto.fromJson)
            .toList(growable: false)
        : const <QuranPreviewAyahDto>[];

    return QuranSurahPreviewDto(
      surahNumber: (json['surahNumber'] as num?)?.toInt() ?? 0,
      ayahs: ayahs,
    );
  }
}

class QuranRangePreviewDto {
  final int fromSurah;
  final int fromAyah;
  final int toSurah;
  final int toAyah;
  final int ayahCount;
  final int fromPage;
  final int toPage;
  final int pagesCount;
  final String source;
  final QuranPreviewAyahDto? startAyah;
  final QuranPreviewAyahDto? endAyah;
  final List<QuranSurahPreviewDto> surahs;

  const QuranRangePreviewDto({
    required this.fromSurah,
    required this.fromAyah,
    required this.toSurah,
    required this.toAyah,
    required this.ayahCount,
    required this.fromPage,
    required this.toPage,
    required this.pagesCount,
    required this.source,
    this.startAyah,
    this.endAyah,
    this.surahs = const [],
  });

  factory QuranRangePreviewDto.fromJson(Map<String, dynamic> json) {
    QuranPreviewAyahDto? parseAyah(dynamic raw) {
      if (raw is Map<String, dynamic>) return QuranPreviewAyahDto.fromJson(raw);
      return null;
    }

    final surahList = json['surahs'];
    final surahs = (surahList is List)
        ? surahList
            .whereType<Map<String, dynamic>>()
            .map(QuranSurahPreviewDto.fromJson)
            .toList(growable: false)
        : const <QuranSurahPreviewDto>[];

    return QuranRangePreviewDto(
      fromSurah: (json['fromSurah'] ?? json['from_surah'] as num?)?.toInt() ?? 0,
      fromAyah: (json['fromAyah'] ?? json['from_ayah'] as num?)?.toInt() ?? 0,
      toSurah: (json['toSurah'] ?? json['to_surah'] as num?)?.toInt() ?? 0,
      toAyah: (json['toAyah'] ?? json['to_ayah'] as num?)?.toInt() ?? 0,
      ayahCount: (json['ayahCount'] ?? json['count'] as num?)?.toInt() ?? 0,
      fromPage: (json['fromPage'] ?? json['from_page'] as num?)?.toInt() ?? 0,
      toPage: (json['toPage'] ?? json['to_page'] as num?)?.toInt() ?? 0,
      pagesCount: (json['pagesCount'] ?? json['pages_count'] as num?)?.toInt() ?? 0,
      source: (json['source'] ?? '').toString(),
      startAyah: parseAyah(json['startAyah'] ?? json['start_ayah']),
      endAyah: parseAyah(json['endAyah'] ?? json['end_ayah']),
      surahs: surahs,
    );
  }
}

