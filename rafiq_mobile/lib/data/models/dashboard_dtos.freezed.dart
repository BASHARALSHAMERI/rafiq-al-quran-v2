// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'dashboard_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

DashboardMetricsDto _$DashboardMetricsDtoFromJson(Map<String, dynamic> json) {
  return _DashboardMetricsDto.fromJson(json);
}

/// @nodoc
mixin _$DashboardMetricsDto {
  int get totalStudents => throw _privateConstructorUsedError;
  int get activeCircles => throw _privateConstructorUsedError;
  double get attendanceRate => throw _privateConstructorUsedError;
  int? get pendingTasks => throw _privateConstructorUsedError;
  Map<String, dynamic>? get extraMetrics => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $DashboardMetricsDtoCopyWith<DashboardMetricsDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DashboardMetricsDtoCopyWith<$Res> {
  factory $DashboardMetricsDtoCopyWith(
          DashboardMetricsDto value, $Res Function(DashboardMetricsDto) then) =
      _$DashboardMetricsDtoCopyWithImpl<$Res, DashboardMetricsDto>;
  @useResult
  $Res call(
      {int totalStudents,
      int activeCircles,
      double attendanceRate,
      int? pendingTasks,
      Map<String, dynamic>? extraMetrics});
}

/// @nodoc
class _$DashboardMetricsDtoCopyWithImpl<$Res, $Val extends DashboardMetricsDto>
    implements $DashboardMetricsDtoCopyWith<$Res> {
  _$DashboardMetricsDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalStudents = null,
    Object? activeCircles = null,
    Object? attendanceRate = null,
    Object? pendingTasks = freezed,
    Object? extraMetrics = freezed,
  }) {
    return _then(_value.copyWith(
      totalStudents: null == totalStudents
          ? _value.totalStudents
          : totalStudents // ignore: cast_nullable_to_non_nullable
              as int,
      activeCircles: null == activeCircles
          ? _value.activeCircles
          : activeCircles // ignore: cast_nullable_to_non_nullable
              as int,
      attendanceRate: null == attendanceRate
          ? _value.attendanceRate
          : attendanceRate // ignore: cast_nullable_to_non_nullable
              as double,
      pendingTasks: freezed == pendingTasks
          ? _value.pendingTasks
          : pendingTasks // ignore: cast_nullable_to_non_nullable
              as int?,
      extraMetrics: freezed == extraMetrics
          ? _value.extraMetrics
          : extraMetrics // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$DashboardMetricsDtoImplCopyWith<$Res>
    implements $DashboardMetricsDtoCopyWith<$Res> {
  factory _$$DashboardMetricsDtoImplCopyWith(_$DashboardMetricsDtoImpl value,
          $Res Function(_$DashboardMetricsDtoImpl) then) =
      __$$DashboardMetricsDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int totalStudents,
      int activeCircles,
      double attendanceRate,
      int? pendingTasks,
      Map<String, dynamic>? extraMetrics});
}

/// @nodoc
class __$$DashboardMetricsDtoImplCopyWithImpl<$Res>
    extends _$DashboardMetricsDtoCopyWithImpl<$Res, _$DashboardMetricsDtoImpl>
    implements _$$DashboardMetricsDtoImplCopyWith<$Res> {
  __$$DashboardMetricsDtoImplCopyWithImpl(_$DashboardMetricsDtoImpl _value,
      $Res Function(_$DashboardMetricsDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalStudents = null,
    Object? activeCircles = null,
    Object? attendanceRate = null,
    Object? pendingTasks = freezed,
    Object? extraMetrics = freezed,
  }) {
    return _then(_$DashboardMetricsDtoImpl(
      totalStudents: null == totalStudents
          ? _value.totalStudents
          : totalStudents // ignore: cast_nullable_to_non_nullable
              as int,
      activeCircles: null == activeCircles
          ? _value.activeCircles
          : activeCircles // ignore: cast_nullable_to_non_nullable
              as int,
      attendanceRate: null == attendanceRate
          ? _value.attendanceRate
          : attendanceRate // ignore: cast_nullable_to_non_nullable
              as double,
      pendingTasks: freezed == pendingTasks
          ? _value.pendingTasks
          : pendingTasks // ignore: cast_nullable_to_non_nullable
              as int?,
      extraMetrics: freezed == extraMetrics
          ? _value._extraMetrics
          : extraMetrics // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$DashboardMetricsDtoImpl implements _DashboardMetricsDto {
  const _$DashboardMetricsDtoImpl(
      {required this.totalStudents,
      required this.activeCircles,
      required this.attendanceRate,
      this.pendingTasks,
      final Map<String, dynamic>? extraMetrics})
      : _extraMetrics = extraMetrics;

  factory _$DashboardMetricsDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$DashboardMetricsDtoImplFromJson(json);

  @override
  final int totalStudents;
  @override
  final int activeCircles;
  @override
  final double attendanceRate;
  @override
  final int? pendingTasks;
  final Map<String, dynamic>? _extraMetrics;
  @override
  Map<String, dynamic>? get extraMetrics {
    final value = _extraMetrics;
    if (value == null) return null;
    if (_extraMetrics is EqualUnmodifiableMapView) return _extraMetrics;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'DashboardMetricsDto(totalStudents: $totalStudents, activeCircles: $activeCircles, attendanceRate: $attendanceRate, pendingTasks: $pendingTasks, extraMetrics: $extraMetrics)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DashboardMetricsDtoImpl &&
            (identical(other.totalStudents, totalStudents) ||
                other.totalStudents == totalStudents) &&
            (identical(other.activeCircles, activeCircles) ||
                other.activeCircles == activeCircles) &&
            (identical(other.attendanceRate, attendanceRate) ||
                other.attendanceRate == attendanceRate) &&
            (identical(other.pendingTasks, pendingTasks) ||
                other.pendingTasks == pendingTasks) &&
            const DeepCollectionEquality()
                .equals(other._extraMetrics, _extraMetrics));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      totalStudents,
      activeCircles,
      attendanceRate,
      pendingTasks,
      const DeepCollectionEquality().hash(_extraMetrics));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DashboardMetricsDtoImplCopyWith<_$DashboardMetricsDtoImpl> get copyWith =>
      __$$DashboardMetricsDtoImplCopyWithImpl<_$DashboardMetricsDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$DashboardMetricsDtoImplToJson(
      this,
    );
  }
}

abstract class _DashboardMetricsDto implements DashboardMetricsDto {
  const factory _DashboardMetricsDto(
      {required final int totalStudents,
      required final int activeCircles,
      required final double attendanceRate,
      final int? pendingTasks,
      final Map<String, dynamic>? extraMetrics}) = _$DashboardMetricsDtoImpl;

  factory _DashboardMetricsDto.fromJson(Map<String, dynamic> json) =
      _$DashboardMetricsDtoImpl.fromJson;

  @override
  int get totalStudents;
  @override
  int get activeCircles;
  @override
  double get attendanceRate;
  @override
  int? get pendingTasks;
  @override
  Map<String, dynamic>? get extraMetrics;
  @override
  @JsonKey(ignore: true)
  _$$DashboardMetricsDtoImplCopyWith<_$DashboardMetricsDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ActivityFeedItemDto _$ActivityFeedItemDtoFromJson(Map<String, dynamic> json) {
  return _ActivityFeedItemDto.fromJson(json);
}

/// @nodoc
mixin _$ActivityFeedItemDto {
  String get id => throw _privateConstructorUsedError;
  String get type =>
      throw _privateConstructorUsedError; // FOLLOW_UP, EXAM, ATTENDANCE, ACHIEVEMENT
  String get title => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  String get timestamp => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ActivityFeedItemDtoCopyWith<ActivityFeedItemDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ActivityFeedItemDtoCopyWith<$Res> {
  factory $ActivityFeedItemDtoCopyWith(
          ActivityFeedItemDto value, $Res Function(ActivityFeedItemDto) then) =
      _$ActivityFeedItemDtoCopyWithImpl<$Res, ActivityFeedItemDto>;
  @useResult
  $Res call(
      {String id,
      String type,
      String title,
      String description,
      String timestamp,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class _$ActivityFeedItemDtoCopyWithImpl<$Res, $Val extends ActivityFeedItemDto>
    implements $ActivityFeedItemDtoCopyWith<$Res> {
  _$ActivityFeedItemDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? title = null,
    Object? description = null,
    Object? timestamp = null,
    Object? metadata = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as String,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ActivityFeedItemDtoImplCopyWith<$Res>
    implements $ActivityFeedItemDtoCopyWith<$Res> {
  factory _$$ActivityFeedItemDtoImplCopyWith(_$ActivityFeedItemDtoImpl value,
          $Res Function(_$ActivityFeedItemDtoImpl) then) =
      __$$ActivityFeedItemDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String type,
      String title,
      String description,
      String timestamp,
      Map<String, dynamic>? metadata});
}

/// @nodoc
class __$$ActivityFeedItemDtoImplCopyWithImpl<$Res>
    extends _$ActivityFeedItemDtoCopyWithImpl<$Res, _$ActivityFeedItemDtoImpl>
    implements _$$ActivityFeedItemDtoImplCopyWith<$Res> {
  __$$ActivityFeedItemDtoImplCopyWithImpl(_$ActivityFeedItemDtoImpl _value,
      $Res Function(_$ActivityFeedItemDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? title = null,
    Object? description = null,
    Object? timestamp = null,
    Object? metadata = freezed,
  }) {
    return _then(_$ActivityFeedItemDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: null == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as String,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ActivityFeedItemDtoImpl implements _ActivityFeedItemDto {
  const _$ActivityFeedItemDtoImpl(
      {required this.id,
      required this.type,
      required this.title,
      required this.description,
      required this.timestamp,
      final Map<String, dynamic>? metadata})
      : _metadata = metadata;

  factory _$ActivityFeedItemDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ActivityFeedItemDtoImplFromJson(json);

  @override
  final String id;
  @override
  final String type;
// FOLLOW_UP, EXAM, ATTENDANCE, ACHIEVEMENT
  @override
  final String title;
  @override
  final String description;
  @override
  final String timestamp;
  final Map<String, dynamic>? _metadata;
  @override
  Map<String, dynamic>? get metadata {
    final value = _metadata;
    if (value == null) return null;
    if (_metadata is EqualUnmodifiableMapView) return _metadata;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'ActivityFeedItemDto(id: $id, type: $type, title: $title, description: $description, timestamp: $timestamp, metadata: $metadata)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ActivityFeedItemDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.timestamp, timestamp) ||
                other.timestamp == timestamp) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, type, title, description,
      timestamp, const DeepCollectionEquality().hash(_metadata));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ActivityFeedItemDtoImplCopyWith<_$ActivityFeedItemDtoImpl> get copyWith =>
      __$$ActivityFeedItemDtoImplCopyWithImpl<_$ActivityFeedItemDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ActivityFeedItemDtoImplToJson(
      this,
    );
  }
}

abstract class _ActivityFeedItemDto implements ActivityFeedItemDto {
  const factory _ActivityFeedItemDto(
      {required final String id,
      required final String type,
      required final String title,
      required final String description,
      required final String timestamp,
      final Map<String, dynamic>? metadata}) = _$ActivityFeedItemDtoImpl;

  factory _ActivityFeedItemDto.fromJson(Map<String, dynamic> json) =
      _$ActivityFeedItemDtoImpl.fromJson;

  @override
  String get id;
  @override
  String get type;
  @override // FOLLOW_UP, EXAM, ATTENDANCE, ACHIEVEMENT
  String get title;
  @override
  String get description;
  @override
  String get timestamp;
  @override
  Map<String, dynamic>? get metadata;
  @override
  @JsonKey(ignore: true)
  _$$ActivityFeedItemDtoImplCopyWith<_$ActivityFeedItemDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
