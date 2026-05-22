// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$DashboardMetricsDtoImpl _$$DashboardMetricsDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$DashboardMetricsDtoImpl(
      totalStudents: (json['totalStudents'] as num).toInt(),
      activeCircles: (json['activeCircles'] as num).toInt(),
      attendanceRate: (json['attendanceRate'] as num).toDouble(),
      pendingTasks: (json['pendingTasks'] as num?)?.toInt(),
      extraMetrics: json['extraMetrics'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$DashboardMetricsDtoImplToJson(
        _$DashboardMetricsDtoImpl instance) =>
    <String, dynamic>{
      'totalStudents': instance.totalStudents,
      'activeCircles': instance.activeCircles,
      'attendanceRate': instance.attendanceRate,
      'pendingTasks': instance.pendingTasks,
      'extraMetrics': instance.extraMetrics,
    };

_$ActivityFeedItemDtoImpl _$$ActivityFeedItemDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$ActivityFeedItemDtoImpl(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      timestamp: json['timestamp'] as String,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$ActivityFeedItemDtoImplToJson(
        _$ActivityFeedItemDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'title': instance.title,
      'description': instance.description,
      'timestamp': instance.timestamp,
      'metadata': instance.metadata,
    };
