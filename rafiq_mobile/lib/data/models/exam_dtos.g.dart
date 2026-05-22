// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'exam_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ExamDtoImpl _$$ExamDtoImplFromJson(Map<String, dynamic> json) =>
    _$ExamDtoImpl(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String,
      type: json['type'] as String,
      examBranch: json['examBranch'] as String?,
      maxScore: (json['maxScore'] as num).toDouble(),
      passScore: (json['passScore'] as num).toDouble(),
      status: json['status'] as String,
      centerId: (json['centerId'] as num?)?.toInt(),
      circleId: (json['circleId'] as num?)?.toInt(),
      scheduledAt: json['scheduledAt'] as String?,
      createdById: (json['createdById'] as num?)?.toInt(),
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      center: json['center'] == null
          ? null
          : ExamCenterDto.fromJson(json['center'] as Map<String, dynamic>),
      circle: json['circle'] == null
          ? null
          : ExamCircleDto.fromJson(json['circle'] as Map<String, dynamic>),
      createdBy: json['createdBy'] == null
          ? null
          : ExamUserSummaryDto.fromJson(
              json['createdBy'] as Map<String, dynamic>),
      criteria: json['criteria'] == null
          ? null
          : ExamCriteriaDto.fromJson(json['criteria'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$ExamDtoImplToJson(_$ExamDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'type': instance.type,
      'examBranch': instance.examBranch,
      'maxScore': instance.maxScore,
      'passScore': instance.passScore,
      'status': instance.status,
      'centerId': instance.centerId,
      'circleId': instance.circleId,
      'scheduledAt': instance.scheduledAt,
      'createdById': instance.createdById,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
      'center': instance.center,
      'circle': instance.circle,
      'createdBy': instance.createdBy,
      'criteria': instance.criteria,
    };

_$ExamRangeDtoImpl _$$ExamRangeDtoImplFromJson(Map<String, dynamic> json) =>
    _$ExamRangeDtoImpl(
      fromSurah: (json['fromSurah'] as num).toInt(),
      fromAyah: (json['fromAyah'] as num).toInt(),
      toSurah: (json['toSurah'] as num).toInt(),
      toAyah: (json['toAyah'] as num).toInt(),
    );

Map<String, dynamic> _$$ExamRangeDtoImplToJson(_$ExamRangeDtoImpl instance) =>
    <String, dynamic>{
      'fromSurah': instance.fromSurah,
      'fromAyah': instance.fromAyah,
      'toSurah': instance.toSurah,
      'toAyah': instance.toAyah,
    };

_$ExamCenterDtoImpl _$$ExamCenterDtoImplFromJson(Map<String, dynamic> json) =>
    _$ExamCenterDtoImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      code: json['code'] as String?,
    );

Map<String, dynamic> _$$ExamCenterDtoImplToJson(_$ExamCenterDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'code': instance.code,
    };

_$ExamCircleDtoImpl _$$ExamCircleDtoImplFromJson(Map<String, dynamic> json) =>
    _$ExamCircleDtoImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      centerId: (json['centerId'] as num).toInt(),
      teacherId: (json['teacherId'] as num?)?.toInt(),
      center: json['center'] == null
          ? null
          : ExamCenterDto.fromJson(json['center'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$ExamCircleDtoImplToJson(_$ExamCircleDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'centerId': instance.centerId,
      'teacherId': instance.teacherId,
      'center': instance.center,
    };

_$ExamUserSummaryDtoImpl _$$ExamUserSummaryDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ExamUserSummaryDtoImpl(
      id: (json['id'] as num).toInt(),
      fullName: json['fullName'] as String,
      email: json['email'] as String?,
      role: json['role'] as String?,
    );

Map<String, dynamic> _$$ExamUserSummaryDtoImplToJson(
        _$ExamUserSummaryDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'fullName': instance.fullName,
      'email': instance.email,
      'role': instance.role,
    };

_$ExamCriteriaDtoImpl _$$ExamCriteriaDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ExamCriteriaDtoImpl(
      id: (json['id'] as num).toInt(),
      memorizationScore: (json['memorizationScore'] as num).toDouble(),
      tajweedScore: (json['tajweedScore'] as num).toDouble(),
      theoreticalTajweedScore:
          (json['theoreticalTajweedScore'] as num).toDouble(),
      performanceScore: (json['performanceScore'] as num).toDouble(),
      promptingPenalty: (json['promptingPenalty'] as num).toDouble(),
      remindingPenalty: (json['remindingPenalty'] as num).toDouble(),
      tajweedPenalty: (json['tajweedPenalty'] as num).toDouble(),
    );

Map<String, dynamic> _$$ExamCriteriaDtoImplToJson(
        _$ExamCriteriaDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'memorizationScore': instance.memorizationScore,
      'tajweedScore': instance.tajweedScore,
      'theoreticalTajweedScore': instance.theoreticalTajweedScore,
      'performanceScore': instance.performanceScore,
      'promptingPenalty': instance.promptingPenalty,
      'remindingPenalty': instance.remindingPenalty,
      'tajweedPenalty': instance.tajweedPenalty,
    };

_$ExamSummaryDtoImpl _$$ExamSummaryDtoImplFromJson(Map<String, dynamic> json) =>
    _$ExamSummaryDtoImpl(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String,
      type: json['type'] as String?,
      examBranch: json['examBranch'] as String?,
      centerId: (json['centerId'] as num?)?.toInt(),
      circleId: (json['circleId'] as num?)?.toInt(),
      maxScore: (json['maxScore'] as num).toDouble(),
      passScore: (json['passScore'] as num).toDouble(),
      status: json['status'] as String,
      scheduledAt: json['scheduledAt'] as String?,
      center: json['center'] == null
          ? null
          : ExamCenterDto.fromJson(json['center'] as Map<String, dynamic>),
      circle: json['circle'] == null
          ? null
          : ExamCircleDto.fromJson(json['circle'] as Map<String, dynamic>),
      criteria: json['criteria'] == null
          ? null
          : ExamCriteriaDto.fromJson(json['criteria'] as Map<String, dynamic>),
      juzRange: json['juzRange'] == null
          ? null
          : ExamRangeDto.fromJson(json['juzRange'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$ExamSummaryDtoImplToJson(
        _$ExamSummaryDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'type': instance.type,
      'examBranch': instance.examBranch,
      'centerId': instance.centerId,
      'circleId': instance.circleId,
      'maxScore': instance.maxScore,
      'passScore': instance.passScore,
      'status': instance.status,
      'scheduledAt': instance.scheduledAt,
      'center': instance.center,
      'circle': instance.circle,
      'criteria': instance.criteria,
      'juzRange': instance.juzRange,
    };

_$ExamAttemptBreakdownDtoImpl _$$ExamAttemptBreakdownDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ExamAttemptBreakdownDtoImpl(
      id: (json['id'] as num).toInt(),
      memorizationScore: (json['memorizationScore'] as num?)?.toDouble(),
      tajweedScore: (json['tajweedScore'] as num?)?.toDouble(),
      theoreticalTajweedScore:
          (json['theoreticalTajweedScore'] as num?)?.toDouble(),
      performanceScore: (json['performanceScore'] as num?)?.toDouble(),
      promptingDeductions: (json['promptingDeductions'] as num?)?.toDouble(),
      remindingDeductions: (json['remindingDeductions'] as num?)?.toDouble(),
      tajweedDeductions: (json['tajweedDeductions'] as num?)?.toDouble(),
      strengthNotes: json['strengthNotes'] as String?,
      weaknessNotes: json['weaknessNotes'] as String?,
    );

Map<String, dynamic> _$$ExamAttemptBreakdownDtoImplToJson(
        _$ExamAttemptBreakdownDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'memorizationScore': instance.memorizationScore,
      'tajweedScore': instance.tajweedScore,
      'theoreticalTajweedScore': instance.theoreticalTajweedScore,
      'performanceScore': instance.performanceScore,
      'promptingDeductions': instance.promptingDeductions,
      'remindingDeductions': instance.remindingDeductions,
      'tajweedDeductions': instance.tajweedDeductions,
      'strengthNotes': instance.strengthNotes,
      'weaknessNotes': instance.weaknessNotes,
    };

_$ExamAttemptCommitteeMemberDtoImpl
    _$$ExamAttemptCommitteeMemberDtoImplFromJson(Map<String, dynamic> json) =>
        _$ExamAttemptCommitteeMemberDtoImpl(
          id: (json['id'] as num).toInt(),
          userId: (json['userId'] as num).toInt(),
          committeeRole: json['committeeRole'] as String?,
          roleAtAssignment: json['roleAtAssignment'] as String?,
          assignedById: (json['assignedById'] as num?)?.toInt(),
          createdAt: json['createdAt'] as String?,
          user: json['user'] == null
              ? null
              : ExamUserSummaryDto.fromJson(
                  json['user'] as Map<String, dynamic>),
        );

Map<String, dynamic> _$$ExamAttemptCommitteeMemberDtoImplToJson(
        _$ExamAttemptCommitteeMemberDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'committeeRole': instance.committeeRole,
      'roleAtAssignment': instance.roleAtAssignment,
      'assignedById': instance.assignedById,
      'createdAt': instance.createdAt,
      'user': instance.user,
    };

_$ExamAttemptQuestionDtoImpl _$$ExamAttemptQuestionDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ExamAttemptQuestionDtoImpl(
      id: (json['id'] as num).toInt(),
      orderIndex: (json['orderIndex'] as num).toInt(),
      source: json['source'] as String,
      fromSurah: (json['fromSurah'] as num).toInt(),
      fromAyah: (json['fromAyah'] as num).toInt(),
      toSurah: (json['toSurah'] as num).toInt(),
      toAyah: (json['toAyah'] as num).toInt(),
      promptingDeductions:
          (json['promptingDeductions'] as num?)?.toDouble() ?? 0,
      remindingDeductions:
          (json['remindingDeductions'] as num?)?.toDouble() ?? 0,
      tajweedDeductions: (json['tajweedDeductions'] as num?)?.toDouble() ?? 0,
      isEvaluated: json['isEvaluated'] as bool? ?? false,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );

Map<String, dynamic> _$$ExamAttemptQuestionDtoImplToJson(
        _$ExamAttemptQuestionDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'orderIndex': instance.orderIndex,
      'source': instance.source,
      'fromSurah': instance.fromSurah,
      'fromAyah': instance.fromAyah,
      'toSurah': instance.toSurah,
      'toAyah': instance.toAyah,
      'promptingDeductions': instance.promptingDeductions,
      'remindingDeductions': instance.remindingDeductions,
      'tajweedDeductions': instance.tajweedDeductions,
      'isEvaluated': instance.isEvaluated,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };

_$ExamAttemptDtoImpl _$$ExamAttemptDtoImplFromJson(Map<String, dynamic> json) =>
    _$ExamAttemptDtoImpl(
      id: (json['id'] as num).toInt(),
      examId: (json['examId'] as num).toInt(),
      studentId: (json['studentId'] as num).toInt(),
      circleId: (json['circleId'] as num).toInt(),
      status: json['status'] as String,
      examDate: json['examDate'] as String?,
      fullQuranCompletedAt: json['fullQuranCompletedAt'] as String?,
      stabilizationDays: (json['stabilizationDays'] as num?)?.toInt(),
      committeeNotes: json['committeeNotes'] as String?,
      totalScore: (json['totalScore'] as num?)?.toDouble(),
      gradeLabel: json['gradeLabel'] as String?,
      startedAt: json['startedAt'] as String?,
      submittedAt: json['submittedAt'] as String?,
      reviewedAt: json['reviewedAt'] as String?,
      evaluatedById: (json['evaluatedById'] as num?)?.toInt(),
      lockVersion: (json['lockVersion'] as num?)?.toInt(),
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      student: json['student'] == null
          ? null
          : ExamUserSummaryDto.fromJson(
              json['student'] as Map<String, dynamic>),
      circle: json['circle'] == null
          ? null
          : ExamCircleDto.fromJson(json['circle'] as Map<String, dynamic>),
      committeeMembers: (json['committeeMembers'] as List<dynamic>?)
          ?.map((e) =>
              ExamAttemptCommitteeMemberDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      questions: (json['questions'] as List<dynamic>?)
          ?.map(
              (e) => ExamAttemptQuestionDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      evaluatedBy: json['evaluatedBy'] == null
          ? null
          : ExamUserSummaryDto.fromJson(
              json['evaluatedBy'] as Map<String, dynamic>),
      breakdown: json['breakdown'] == null
          ? null
          : ExamAttemptBreakdownDto.fromJson(
              json['breakdown'] as Map<String, dynamic>),
      exam: json['exam'] == null
          ? null
          : ExamSummaryDto.fromJson(json['exam'] as Map<String, dynamic>),
      examRange: json['examRange'] == null
          ? null
          : ExamRangeDto.fromJson(json['examRange'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$ExamAttemptDtoImplToJson(
        _$ExamAttemptDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'examId': instance.examId,
      'studentId': instance.studentId,
      'circleId': instance.circleId,
      'status': instance.status,
      'examDate': instance.examDate,
      'fullQuranCompletedAt': instance.fullQuranCompletedAt,
      'stabilizationDays': instance.stabilizationDays,
      'committeeNotes': instance.committeeNotes,
      'totalScore': instance.totalScore,
      'gradeLabel': instance.gradeLabel,
      'startedAt': instance.startedAt,
      'submittedAt': instance.submittedAt,
      'reviewedAt': instance.reviewedAt,
      'evaluatedById': instance.evaluatedById,
      'lockVersion': instance.lockVersion,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
      'student': instance.student,
      'circle': instance.circle,
      'committeeMembers': instance.committeeMembers,
      'questions': instance.questions,
      'evaluatedBy': instance.evaluatedBy,
      'breakdown': instance.breakdown,
      'exam': instance.exam,
      'examRange': instance.examRange,
    };

_$CreateExamRequestDtoImpl _$$CreateExamRequestDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateExamRequestDtoImpl(
      title: json['title'] as String,
      type: json['type'] as String,
      examBranch: json['examBranch'] as String?,
      maxScore: (json['maxScore'] as num).toDouble(),
      passScore: (json['passScore'] as num).toDouble(),
      criteria: json['criteria'] == null
          ? null
          : CreateExamCriteriaRequestDto.fromJson(
              json['criteria'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$CreateExamRequestDtoImplToJson(
        _$CreateExamRequestDtoImpl instance) =>
    <String, dynamic>{
      'title': instance.title,
      'type': instance.type,
      'examBranch': instance.examBranch,
      'maxScore': instance.maxScore,
      'passScore': instance.passScore,
      'criteria': instance.criteria,
    };

_$CreateExamCriteriaRequestDtoImpl _$$CreateExamCriteriaRequestDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateExamCriteriaRequestDtoImpl(
      memorizationScore: (json['memorizationScore'] as num).toDouble(),
      tajweedScore: (json['tajweedScore'] as num).toDouble(),
      theoreticalTajweedScore:
          (json['theoreticalTajweedScore'] as num).toDouble(),
      performanceScore: (json['performanceScore'] as num).toDouble(),
      promptingPenalty: (json['promptingPenalty'] as num).toDouble(),
      remindingPenalty: (json['remindingPenalty'] as num).toDouble(),
      tajweedPenalty: (json['tajweedPenalty'] as num).toDouble(),
    );

Map<String, dynamic> _$$CreateExamCriteriaRequestDtoImplToJson(
        _$CreateExamCriteriaRequestDtoImpl instance) =>
    <String, dynamic>{
      'memorizationScore': instance.memorizationScore,
      'tajweedScore': instance.tajweedScore,
      'theoreticalTajweedScore': instance.theoreticalTajweedScore,
      'performanceScore': instance.performanceScore,
      'promptingPenalty': instance.promptingPenalty,
      'remindingPenalty': instance.remindingPenalty,
      'tajweedPenalty': instance.tajweedPenalty,
    };

_$CreateExamAttemptRequestDtoImpl _$$CreateExamAttemptRequestDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateExamAttemptRequestDtoImpl(
      studentId: (json['studentId'] as num).toInt(),
      circleId: (json['circleId'] as num).toInt(),
      examDate: json['examDate'] as String,
      fullQuranCompletedAt: json['fullQuranCompletedAt'] as String?,
      committeeMemberIds: (json['committeeMemberIds'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
    );

Map<String, dynamic> _$$CreateExamAttemptRequestDtoImplToJson(
        _$CreateExamAttemptRequestDtoImpl instance) =>
    <String, dynamic>{
      'studentId': instance.studentId,
      'circleId': instance.circleId,
      'examDate': instance.examDate,
      'fullQuranCompletedAt': instance.fullQuranCompletedAt,
      'committeeMemberIds': instance.committeeMemberIds,
    };

_$UpdateAttemptCommitteeRequestDtoImpl
    _$$UpdateAttemptCommitteeRequestDtoImplFromJson(
            Map<String, dynamic> json) =>
        _$UpdateAttemptCommitteeRequestDtoImpl(
          examDate: json['examDate'] as String?,
          fullQuranCompletedAt: json['fullQuranCompletedAt'] as String?,
          committeeMemberIds: (json['committeeMemberIds'] as List<dynamic>?)
              ?.map((e) => (e as num).toInt())
              .toList(),
          lockVersion: (json['lockVersion'] as num?)?.toInt(),
        );

Map<String, dynamic> _$$UpdateAttemptCommitteeRequestDtoImplToJson(
        _$UpdateAttemptCommitteeRequestDtoImpl instance) =>
    <String, dynamic>{
      'examDate': instance.examDate,
      'fullQuranCompletedAt': instance.fullQuranCompletedAt,
      'committeeMemberIds': instance.committeeMemberIds,
      'lockVersion': instance.lockVersion,
    };

_$GenerateAttemptQuestionsRequestDtoImpl
    _$$GenerateAttemptQuestionsRequestDtoImplFromJson(
            Map<String, dynamic> json) =>
        _$GenerateAttemptQuestionsRequestDtoImpl(
          count: (json['count'] as num?)?.toInt(),
        );

Map<String, dynamic> _$$GenerateAttemptQuestionsRequestDtoImplToJson(
        _$GenerateAttemptQuestionsRequestDtoImpl instance) =>
    <String, dynamic>{
      'count': instance.count,
    };

_$ScoreAttemptQuestionRequestDtoImpl
    _$$ScoreAttemptQuestionRequestDtoImplFromJson(Map<String, dynamic> json) =>
        _$ScoreAttemptQuestionRequestDtoImpl(
          id: (json['id'] as num).toInt(),
          promptingDeductions: (json['promptingDeductions'] as num).toDouble(),
          remindingDeductions: (json['remindingDeductions'] as num).toDouble(),
          tajweedDeductions: (json['tajweedDeductions'] as num).toDouble(),
          isEvaluated: json['isEvaluated'] as bool,
        );

Map<String, dynamic> _$$ScoreAttemptQuestionRequestDtoImplToJson(
        _$ScoreAttemptQuestionRequestDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'promptingDeductions': instance.promptingDeductions,
      'remindingDeductions': instance.remindingDeductions,
      'tajweedDeductions': instance.tajweedDeductions,
      'isEvaluated': instance.isEvaluated,
    };

_$ScoreAttemptRequestDtoImpl _$$ScoreAttemptRequestDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ScoreAttemptRequestDtoImpl(
      memorizationScore: (json['memorizationScore'] as num).toDouble(),
      tajweedScore: (json['tajweedScore'] as num).toDouble(),
      theoreticalTajweedScore:
          (json['theoreticalTajweedScore'] as num).toDouble(),
      performanceScore: (json['performanceScore'] as num).toDouble(),
      promptingDeductions: (json['promptingDeductions'] as num).toDouble(),
      remindingDeductions: (json['remindingDeductions'] as num).toDouble(),
      tajweedDeductions: (json['tajweedDeductions'] as num).toDouble(),
      committeeNotes: json['committeeNotes'] as String?,
      strengthNotes: json['strengthNotes'] as String?,
      weaknessNotes: json['weaknessNotes'] as String?,
      questions: (json['questions'] as List<dynamic>?)
          ?.map((e) => ScoreAttemptQuestionRequestDto.fromJson(
              e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$ScoreAttemptRequestDtoImplToJson(
        _$ScoreAttemptRequestDtoImpl instance) =>
    <String, dynamic>{
      'memorizationScore': instance.memorizationScore,
      'tajweedScore': instance.tajweedScore,
      'theoreticalTajweedScore': instance.theoreticalTajweedScore,
      'performanceScore': instance.performanceScore,
      'promptingDeductions': instance.promptingDeductions,
      'remindingDeductions': instance.remindingDeductions,
      'tajweedDeductions': instance.tajweedDeductions,
      'committeeNotes': instance.committeeNotes,
      'strengthNotes': instance.strengthNotes,
      'weaknessNotes': instance.weaknessNotes,
      'questions': instance.questions,
    };

_$ShareAttemptResultResponseDtoImpl
    _$$ShareAttemptResultResponseDtoImplFromJson(Map<String, dynamic> json) =>
        _$ShareAttemptResultResponseDtoImpl(
          createdCount: (json['createdCount'] as num).toInt(),
        );

Map<String, dynamic> _$$ShareAttemptResultResponseDtoImplToJson(
        _$ShareAttemptResultResponseDtoImpl instance) =>
    <String, dynamic>{
      'createdCount': instance.createdCount,
    };
