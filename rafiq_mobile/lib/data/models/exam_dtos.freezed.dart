// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'exam_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ExamDto _$ExamDtoFromJson(Map<String, dynamic> json) {
  return _ExamDto.fromJson(json);
}

/// @nodoc
mixin _$ExamDto {
  int get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get examBranch => throw _privateConstructorUsedError;
  double get maxScore => throw _privateConstructorUsedError;
  double get passScore => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  int? get centerId => throw _privateConstructorUsedError;
  int? get circleId => throw _privateConstructorUsedError;
  String? get scheduledAt => throw _privateConstructorUsedError;
  int? get createdById => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  String? get updatedAt => throw _privateConstructorUsedError;
  ExamCenterDto? get center => throw _privateConstructorUsedError;
  ExamCircleDto? get circle => throw _privateConstructorUsedError;
  ExamUserSummaryDto? get createdBy => throw _privateConstructorUsedError;
  ExamCriteriaDto? get criteria => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamDtoCopyWith<ExamDto> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamDtoCopyWith<$Res> {
  factory $ExamDtoCopyWith(ExamDto value, $Res Function(ExamDto) then) =
      _$ExamDtoCopyWithImpl<$Res, ExamDto>;
  @useResult
  $Res call(
      {int id,
      String title,
      String type,
      String? examBranch,
      double maxScore,
      double passScore,
      String status,
      int? centerId,
      int? circleId,
      String? scheduledAt,
      int? createdById,
      String? createdAt,
      String? updatedAt,
      ExamCenterDto? center,
      ExamCircleDto? circle,
      ExamUserSummaryDto? createdBy,
      ExamCriteriaDto? criteria});

  $ExamCenterDtoCopyWith<$Res>? get center;
  $ExamCircleDtoCopyWith<$Res>? get circle;
  $ExamUserSummaryDtoCopyWith<$Res>? get createdBy;
  $ExamCriteriaDtoCopyWith<$Res>? get criteria;
}

/// @nodoc
class _$ExamDtoCopyWithImpl<$Res, $Val extends ExamDto>
    implements $ExamDtoCopyWith<$Res> {
  _$ExamDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? type = null,
    Object? examBranch = freezed,
    Object? maxScore = null,
    Object? passScore = null,
    Object? status = null,
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? scheduledAt = freezed,
    Object? createdById = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? center = freezed,
    Object? circle = freezed,
    Object? createdBy = freezed,
    Object? criteria = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      examBranch: freezed == examBranch
          ? _value.examBranch
          : examBranch // ignore: cast_nullable_to_non_nullable
              as String?,
      maxScore: null == maxScore
          ? _value.maxScore
          : maxScore // ignore: cast_nullable_to_non_nullable
              as double,
      passScore: null == passScore
          ? _value.passScore
          : passScore // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      scheduledAt: freezed == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as String?,
      createdById: freezed == createdById
          ? _value.createdById
          : createdById // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      center: freezed == center
          ? _value.center
          : center // ignore: cast_nullable_to_non_nullable
              as ExamCenterDto?,
      circle: freezed == circle
          ? _value.circle
          : circle // ignore: cast_nullable_to_non_nullable
              as ExamCircleDto?,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
      criteria: freezed == criteria
          ? _value.criteria
          : criteria // ignore: cast_nullable_to_non_nullable
              as ExamCriteriaDto?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCenterDtoCopyWith<$Res>? get center {
    if (_value.center == null) {
      return null;
    }

    return $ExamCenterDtoCopyWith<$Res>(_value.center!, (value) {
      return _then(_value.copyWith(center: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCircleDtoCopyWith<$Res>? get circle {
    if (_value.circle == null) {
      return null;
    }

    return $ExamCircleDtoCopyWith<$Res>(_value.circle!, (value) {
      return _then(_value.copyWith(circle: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamUserSummaryDtoCopyWith<$Res>? get createdBy {
    if (_value.createdBy == null) {
      return null;
    }

    return $ExamUserSummaryDtoCopyWith<$Res>(_value.createdBy!, (value) {
      return _then(_value.copyWith(createdBy: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCriteriaDtoCopyWith<$Res>? get criteria {
    if (_value.criteria == null) {
      return null;
    }

    return $ExamCriteriaDtoCopyWith<$Res>(_value.criteria!, (value) {
      return _then(_value.copyWith(criteria: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ExamDtoImplCopyWith<$Res> implements $ExamDtoCopyWith<$Res> {
  factory _$$ExamDtoImplCopyWith(
          _$ExamDtoImpl value, $Res Function(_$ExamDtoImpl) then) =
      __$$ExamDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String title,
      String type,
      String? examBranch,
      double maxScore,
      double passScore,
      String status,
      int? centerId,
      int? circleId,
      String? scheduledAt,
      int? createdById,
      String? createdAt,
      String? updatedAt,
      ExamCenterDto? center,
      ExamCircleDto? circle,
      ExamUserSummaryDto? createdBy,
      ExamCriteriaDto? criteria});

  @override
  $ExamCenterDtoCopyWith<$Res>? get center;
  @override
  $ExamCircleDtoCopyWith<$Res>? get circle;
  @override
  $ExamUserSummaryDtoCopyWith<$Res>? get createdBy;
  @override
  $ExamCriteriaDtoCopyWith<$Res>? get criteria;
}

/// @nodoc
class __$$ExamDtoImplCopyWithImpl<$Res>
    extends _$ExamDtoCopyWithImpl<$Res, _$ExamDtoImpl>
    implements _$$ExamDtoImplCopyWith<$Res> {
  __$$ExamDtoImplCopyWithImpl(
      _$ExamDtoImpl _value, $Res Function(_$ExamDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? type = null,
    Object? examBranch = freezed,
    Object? maxScore = null,
    Object? passScore = null,
    Object? status = null,
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? scheduledAt = freezed,
    Object? createdById = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? center = freezed,
    Object? circle = freezed,
    Object? createdBy = freezed,
    Object? criteria = freezed,
  }) {
    return _then(_$ExamDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      examBranch: freezed == examBranch
          ? _value.examBranch
          : examBranch // ignore: cast_nullable_to_non_nullable
              as String?,
      maxScore: null == maxScore
          ? _value.maxScore
          : maxScore // ignore: cast_nullable_to_non_nullable
              as double,
      passScore: null == passScore
          ? _value.passScore
          : passScore // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      scheduledAt: freezed == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as String?,
      createdById: freezed == createdById
          ? _value.createdById
          : createdById // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      center: freezed == center
          ? _value.center
          : center // ignore: cast_nullable_to_non_nullable
              as ExamCenterDto?,
      circle: freezed == circle
          ? _value.circle
          : circle // ignore: cast_nullable_to_non_nullable
              as ExamCircleDto?,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
      criteria: freezed == criteria
          ? _value.criteria
          : criteria // ignore: cast_nullable_to_non_nullable
              as ExamCriteriaDto?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamDtoImpl implements _ExamDto {
  const _$ExamDtoImpl(
      {required this.id,
      required this.title,
      required this.type,
      this.examBranch,
      required this.maxScore,
      required this.passScore,
      required this.status,
      this.centerId,
      this.circleId,
      this.scheduledAt,
      this.createdById,
      this.createdAt,
      this.updatedAt,
      this.center,
      this.circle,
      this.createdBy,
      this.criteria});

  factory _$ExamDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String title;
  @override
  final String type;
  @override
  final String? examBranch;
  @override
  final double maxScore;
  @override
  final double passScore;
  @override
  final String status;
  @override
  final int? centerId;
  @override
  final int? circleId;
  @override
  final String? scheduledAt;
  @override
  final int? createdById;
  @override
  final String? createdAt;
  @override
  final String? updatedAt;
  @override
  final ExamCenterDto? center;
  @override
  final ExamCircleDto? circle;
  @override
  final ExamUserSummaryDto? createdBy;
  @override
  final ExamCriteriaDto? criteria;

  @override
  String toString() {
    return 'ExamDto(id: $id, title: $title, type: $type, examBranch: $examBranch, maxScore: $maxScore, passScore: $passScore, status: $status, centerId: $centerId, circleId: $circleId, scheduledAt: $scheduledAt, createdById: $createdById, createdAt: $createdAt, updatedAt: $updatedAt, center: $center, circle: $circle, createdBy: $createdBy, criteria: $criteria)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.examBranch, examBranch) ||
                other.examBranch == examBranch) &&
            (identical(other.maxScore, maxScore) ||
                other.maxScore == maxScore) &&
            (identical(other.passScore, passScore) ||
                other.passScore == passScore) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.scheduledAt, scheduledAt) ||
                other.scheduledAt == scheduledAt) &&
            (identical(other.createdById, createdById) ||
                other.createdById == createdById) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.center, center) || other.center == center) &&
            (identical(other.circle, circle) || other.circle == circle) &&
            (identical(other.createdBy, createdBy) ||
                other.createdBy == createdBy) &&
            (identical(other.criteria, criteria) ||
                other.criteria == criteria));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      type,
      examBranch,
      maxScore,
      passScore,
      status,
      centerId,
      circleId,
      scheduledAt,
      createdById,
      createdAt,
      updatedAt,
      center,
      circle,
      createdBy,
      criteria);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamDtoImplCopyWith<_$ExamDtoImpl> get copyWith =>
      __$$ExamDtoImplCopyWithImpl<_$ExamDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamDto implements ExamDto {
  const factory _ExamDto(
      {required final int id,
      required final String title,
      required final String type,
      final String? examBranch,
      required final double maxScore,
      required final double passScore,
      required final String status,
      final int? centerId,
      final int? circleId,
      final String? scheduledAt,
      final int? createdById,
      final String? createdAt,
      final String? updatedAt,
      final ExamCenterDto? center,
      final ExamCircleDto? circle,
      final ExamUserSummaryDto? createdBy,
      final ExamCriteriaDto? criteria}) = _$ExamDtoImpl;

  factory _ExamDto.fromJson(Map<String, dynamic> json) = _$ExamDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get title;
  @override
  String get type;
  @override
  String? get examBranch;
  @override
  double get maxScore;
  @override
  double get passScore;
  @override
  String get status;
  @override
  int? get centerId;
  @override
  int? get circleId;
  @override
  String? get scheduledAt;
  @override
  int? get createdById;
  @override
  String? get createdAt;
  @override
  String? get updatedAt;
  @override
  ExamCenterDto? get center;
  @override
  ExamCircleDto? get circle;
  @override
  ExamUserSummaryDto? get createdBy;
  @override
  ExamCriteriaDto? get criteria;
  @override
  @JsonKey(ignore: true)
  _$$ExamDtoImplCopyWith<_$ExamDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ExamRangeDto _$ExamRangeDtoFromJson(Map<String, dynamic> json) {
  return _ExamRangeDto.fromJson(json);
}

/// @nodoc
mixin _$ExamRangeDto {
  int get fromSurah => throw _privateConstructorUsedError;
  int get fromAyah => throw _privateConstructorUsedError;
  int get toSurah => throw _privateConstructorUsedError;
  int get toAyah => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamRangeDtoCopyWith<ExamRangeDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamRangeDtoCopyWith<$Res> {
  factory $ExamRangeDtoCopyWith(
          ExamRangeDto value, $Res Function(ExamRangeDto) then) =
      _$ExamRangeDtoCopyWithImpl<$Res, ExamRangeDto>;
  @useResult
  $Res call({int fromSurah, int fromAyah, int toSurah, int toAyah});
}

/// @nodoc
class _$ExamRangeDtoCopyWithImpl<$Res, $Val extends ExamRangeDto>
    implements $ExamRangeDtoCopyWith<$Res> {
  _$ExamRangeDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? fromSurah = null,
    Object? fromAyah = null,
    Object? toSurah = null,
    Object? toAyah = null,
  }) {
    return _then(_value.copyWith(
      fromSurah: null == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int,
      fromAyah: null == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int,
      toSurah: null == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int,
      toAyah: null == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ExamRangeDtoImplCopyWith<$Res>
    implements $ExamRangeDtoCopyWith<$Res> {
  factory _$$ExamRangeDtoImplCopyWith(
          _$ExamRangeDtoImpl value, $Res Function(_$ExamRangeDtoImpl) then) =
      __$$ExamRangeDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int fromSurah, int fromAyah, int toSurah, int toAyah});
}

/// @nodoc
class __$$ExamRangeDtoImplCopyWithImpl<$Res>
    extends _$ExamRangeDtoCopyWithImpl<$Res, _$ExamRangeDtoImpl>
    implements _$$ExamRangeDtoImplCopyWith<$Res> {
  __$$ExamRangeDtoImplCopyWithImpl(
      _$ExamRangeDtoImpl _value, $Res Function(_$ExamRangeDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? fromSurah = null,
    Object? fromAyah = null,
    Object? toSurah = null,
    Object? toAyah = null,
  }) {
    return _then(_$ExamRangeDtoImpl(
      fromSurah: null == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int,
      fromAyah: null == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int,
      toSurah: null == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int,
      toAyah: null == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamRangeDtoImpl implements _ExamRangeDto {
  const _$ExamRangeDtoImpl(
      {required this.fromSurah,
      required this.fromAyah,
      required this.toSurah,
      required this.toAyah});

  factory _$ExamRangeDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamRangeDtoImplFromJson(json);

  @override
  final int fromSurah;
  @override
  final int fromAyah;
  @override
  final int toSurah;
  @override
  final int toAyah;

  @override
  String toString() {
    return 'ExamRangeDto(fromSurah: $fromSurah, fromAyah: $fromAyah, toSurah: $toSurah, toAyah: $toAyah)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamRangeDtoImpl &&
            (identical(other.fromSurah, fromSurah) ||
                other.fromSurah == fromSurah) &&
            (identical(other.fromAyah, fromAyah) ||
                other.fromAyah == fromAyah) &&
            (identical(other.toSurah, toSurah) || other.toSurah == toSurah) &&
            (identical(other.toAyah, toAyah) || other.toAyah == toAyah));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, fromSurah, fromAyah, toSurah, toAyah);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamRangeDtoImplCopyWith<_$ExamRangeDtoImpl> get copyWith =>
      __$$ExamRangeDtoImplCopyWithImpl<_$ExamRangeDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamRangeDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamRangeDto implements ExamRangeDto {
  const factory _ExamRangeDto(
      {required final int fromSurah,
      required final int fromAyah,
      required final int toSurah,
      required final int toAyah}) = _$ExamRangeDtoImpl;

  factory _ExamRangeDto.fromJson(Map<String, dynamic> json) =
      _$ExamRangeDtoImpl.fromJson;

  @override
  int get fromSurah;
  @override
  int get fromAyah;
  @override
  int get toSurah;
  @override
  int get toAyah;
  @override
  @JsonKey(ignore: true)
  _$$ExamRangeDtoImplCopyWith<_$ExamRangeDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ExamCenterDto _$ExamCenterDtoFromJson(Map<String, dynamic> json) {
  return _ExamCenterDto.fromJson(json);
}

/// @nodoc
mixin _$ExamCenterDto {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get code => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamCenterDtoCopyWith<ExamCenterDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamCenterDtoCopyWith<$Res> {
  factory $ExamCenterDtoCopyWith(
          ExamCenterDto value, $Res Function(ExamCenterDto) then) =
      _$ExamCenterDtoCopyWithImpl<$Res, ExamCenterDto>;
  @useResult
  $Res call({int id, String name, String? code});
}

/// @nodoc
class _$ExamCenterDtoCopyWithImpl<$Res, $Val extends ExamCenterDto>
    implements $ExamCenterDtoCopyWith<$Res> {
  _$ExamCenterDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? code = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ExamCenterDtoImplCopyWith<$Res>
    implements $ExamCenterDtoCopyWith<$Res> {
  factory _$$ExamCenterDtoImplCopyWith(
          _$ExamCenterDtoImpl value, $Res Function(_$ExamCenterDtoImpl) then) =
      __$$ExamCenterDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int id, String name, String? code});
}

/// @nodoc
class __$$ExamCenterDtoImplCopyWithImpl<$Res>
    extends _$ExamCenterDtoCopyWithImpl<$Res, _$ExamCenterDtoImpl>
    implements _$$ExamCenterDtoImplCopyWith<$Res> {
  __$$ExamCenterDtoImplCopyWithImpl(
      _$ExamCenterDtoImpl _value, $Res Function(_$ExamCenterDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? code = freezed,
  }) {
    return _then(_$ExamCenterDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      code: freezed == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamCenterDtoImpl implements _ExamCenterDto {
  const _$ExamCenterDtoImpl({required this.id, required this.name, this.code});

  factory _$ExamCenterDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamCenterDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  final String? code;

  @override
  String toString() {
    return 'ExamCenterDto(id: $id, name: $name, code: $code)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamCenterDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.code, code) || other.code == code));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, code);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamCenterDtoImplCopyWith<_$ExamCenterDtoImpl> get copyWith =>
      __$$ExamCenterDtoImplCopyWithImpl<_$ExamCenterDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamCenterDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamCenterDto implements ExamCenterDto {
  const factory _ExamCenterDto(
      {required final int id,
      required final String name,
      final String? code}) = _$ExamCenterDtoImpl;

  factory _ExamCenterDto.fromJson(Map<String, dynamic> json) =
      _$ExamCenterDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  String? get code;
  @override
  @JsonKey(ignore: true)
  _$$ExamCenterDtoImplCopyWith<_$ExamCenterDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ExamCircleDto _$ExamCircleDtoFromJson(Map<String, dynamic> json) {
  return _ExamCircleDto.fromJson(json);
}

/// @nodoc
mixin _$ExamCircleDto {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  int get centerId => throw _privateConstructorUsedError;
  int? get teacherId => throw _privateConstructorUsedError;
  ExamCenterDto? get center => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamCircleDtoCopyWith<ExamCircleDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamCircleDtoCopyWith<$Res> {
  factory $ExamCircleDtoCopyWith(
          ExamCircleDto value, $Res Function(ExamCircleDto) then) =
      _$ExamCircleDtoCopyWithImpl<$Res, ExamCircleDto>;
  @useResult
  $Res call(
      {int id,
      String name,
      int centerId,
      int? teacherId,
      ExamCenterDto? center});

  $ExamCenterDtoCopyWith<$Res>? get center;
}

/// @nodoc
class _$ExamCircleDtoCopyWithImpl<$Res, $Val extends ExamCircleDto>
    implements $ExamCircleDtoCopyWith<$Res> {
  _$ExamCircleDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? centerId = null,
    Object? teacherId = freezed,
    Object? center = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      centerId: null == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int,
      teacherId: freezed == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int?,
      center: freezed == center
          ? _value.center
          : center // ignore: cast_nullable_to_non_nullable
              as ExamCenterDto?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCenterDtoCopyWith<$Res>? get center {
    if (_value.center == null) {
      return null;
    }

    return $ExamCenterDtoCopyWith<$Res>(_value.center!, (value) {
      return _then(_value.copyWith(center: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ExamCircleDtoImplCopyWith<$Res>
    implements $ExamCircleDtoCopyWith<$Res> {
  factory _$$ExamCircleDtoImplCopyWith(
          _$ExamCircleDtoImpl value, $Res Function(_$ExamCircleDtoImpl) then) =
      __$$ExamCircleDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String name,
      int centerId,
      int? teacherId,
      ExamCenterDto? center});

  @override
  $ExamCenterDtoCopyWith<$Res>? get center;
}

/// @nodoc
class __$$ExamCircleDtoImplCopyWithImpl<$Res>
    extends _$ExamCircleDtoCopyWithImpl<$Res, _$ExamCircleDtoImpl>
    implements _$$ExamCircleDtoImplCopyWith<$Res> {
  __$$ExamCircleDtoImplCopyWithImpl(
      _$ExamCircleDtoImpl _value, $Res Function(_$ExamCircleDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? centerId = null,
    Object? teacherId = freezed,
    Object? center = freezed,
  }) {
    return _then(_$ExamCircleDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      centerId: null == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int,
      teacherId: freezed == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int?,
      center: freezed == center
          ? _value.center
          : center // ignore: cast_nullable_to_non_nullable
              as ExamCenterDto?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamCircleDtoImpl implements _ExamCircleDto {
  const _$ExamCircleDtoImpl(
      {required this.id,
      required this.name,
      required this.centerId,
      this.teacherId,
      this.center});

  factory _$ExamCircleDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamCircleDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  final int centerId;
  @override
  final int? teacherId;
  @override
  final ExamCenterDto? center;

  @override
  String toString() {
    return 'ExamCircleDto(id: $id, name: $name, centerId: $centerId, teacherId: $teacherId, center: $center)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamCircleDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId) &&
            (identical(other.teacherId, teacherId) ||
                other.teacherId == teacherId) &&
            (identical(other.center, center) || other.center == center));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, name, centerId, teacherId, center);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamCircleDtoImplCopyWith<_$ExamCircleDtoImpl> get copyWith =>
      __$$ExamCircleDtoImplCopyWithImpl<_$ExamCircleDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamCircleDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamCircleDto implements ExamCircleDto {
  const factory _ExamCircleDto(
      {required final int id,
      required final String name,
      required final int centerId,
      final int? teacherId,
      final ExamCenterDto? center}) = _$ExamCircleDtoImpl;

  factory _ExamCircleDto.fromJson(Map<String, dynamic> json) =
      _$ExamCircleDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  int get centerId;
  @override
  int? get teacherId;
  @override
  ExamCenterDto? get center;
  @override
  @JsonKey(ignore: true)
  _$$ExamCircleDtoImplCopyWith<_$ExamCircleDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ExamUserSummaryDto _$ExamUserSummaryDtoFromJson(Map<String, dynamic> json) {
  return _ExamUserSummaryDto.fromJson(json);
}

/// @nodoc
mixin _$ExamUserSummaryDto {
  int get id => throw _privateConstructorUsedError;
  String get fullName => throw _privateConstructorUsedError;
  String? get email => throw _privateConstructorUsedError;
  String? get role => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamUserSummaryDtoCopyWith<ExamUserSummaryDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamUserSummaryDtoCopyWith<$Res> {
  factory $ExamUserSummaryDtoCopyWith(
          ExamUserSummaryDto value, $Res Function(ExamUserSummaryDto) then) =
      _$ExamUserSummaryDtoCopyWithImpl<$Res, ExamUserSummaryDto>;
  @useResult
  $Res call({int id, String fullName, String? email, String? role});
}

/// @nodoc
class _$ExamUserSummaryDtoCopyWithImpl<$Res, $Val extends ExamUserSummaryDto>
    implements $ExamUserSummaryDtoCopyWith<$Res> {
  _$ExamUserSummaryDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? fullName = null,
    Object? email = freezed,
    Object? role = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ExamUserSummaryDtoImplCopyWith<$Res>
    implements $ExamUserSummaryDtoCopyWith<$Res> {
  factory _$$ExamUserSummaryDtoImplCopyWith(_$ExamUserSummaryDtoImpl value,
          $Res Function(_$ExamUserSummaryDtoImpl) then) =
      __$$ExamUserSummaryDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int id, String fullName, String? email, String? role});
}

/// @nodoc
class __$$ExamUserSummaryDtoImplCopyWithImpl<$Res>
    extends _$ExamUserSummaryDtoCopyWithImpl<$Res, _$ExamUserSummaryDtoImpl>
    implements _$$ExamUserSummaryDtoImplCopyWith<$Res> {
  __$$ExamUserSummaryDtoImplCopyWithImpl(_$ExamUserSummaryDtoImpl _value,
      $Res Function(_$ExamUserSummaryDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? fullName = null,
    Object? email = freezed,
    Object? role = freezed,
  }) {
    return _then(_$ExamUserSummaryDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamUserSummaryDtoImpl implements _ExamUserSummaryDto {
  const _$ExamUserSummaryDtoImpl(
      {required this.id, required this.fullName, this.email, this.role});

  factory _$ExamUserSummaryDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamUserSummaryDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String fullName;
  @override
  final String? email;
  @override
  final String? role;

  @override
  String toString() {
    return 'ExamUserSummaryDto(id: $id, fullName: $fullName, email: $email, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamUserSummaryDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, fullName, email, role);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamUserSummaryDtoImplCopyWith<_$ExamUserSummaryDtoImpl> get copyWith =>
      __$$ExamUserSummaryDtoImplCopyWithImpl<_$ExamUserSummaryDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamUserSummaryDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamUserSummaryDto implements ExamUserSummaryDto {
  const factory _ExamUserSummaryDto(
      {required final int id,
      required final String fullName,
      final String? email,
      final String? role}) = _$ExamUserSummaryDtoImpl;

  factory _ExamUserSummaryDto.fromJson(Map<String, dynamic> json) =
      _$ExamUserSummaryDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get fullName;
  @override
  String? get email;
  @override
  String? get role;
  @override
  @JsonKey(ignore: true)
  _$$ExamUserSummaryDtoImplCopyWith<_$ExamUserSummaryDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ExamCriteriaDto _$ExamCriteriaDtoFromJson(Map<String, dynamic> json) {
  return _ExamCriteriaDto.fromJson(json);
}

/// @nodoc
mixin _$ExamCriteriaDto {
  int get id => throw _privateConstructorUsedError;
  double get memorizationScore => throw _privateConstructorUsedError;
  double get tajweedScore => throw _privateConstructorUsedError;
  double get theoreticalTajweedScore => throw _privateConstructorUsedError;
  double get performanceScore => throw _privateConstructorUsedError;
  double get promptingPenalty => throw _privateConstructorUsedError;
  double get remindingPenalty => throw _privateConstructorUsedError;
  double get tajweedPenalty => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamCriteriaDtoCopyWith<ExamCriteriaDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamCriteriaDtoCopyWith<$Res> {
  factory $ExamCriteriaDtoCopyWith(
          ExamCriteriaDto value, $Res Function(ExamCriteriaDto) then) =
      _$ExamCriteriaDtoCopyWithImpl<$Res, ExamCriteriaDto>;
  @useResult
  $Res call(
      {int id,
      double memorizationScore,
      double tajweedScore,
      double theoreticalTajweedScore,
      double performanceScore,
      double promptingPenalty,
      double remindingPenalty,
      double tajweedPenalty});
}

/// @nodoc
class _$ExamCriteriaDtoCopyWithImpl<$Res, $Val extends ExamCriteriaDto>
    implements $ExamCriteriaDtoCopyWith<$Res> {
  _$ExamCriteriaDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? memorizationScore = null,
    Object? tajweedScore = null,
    Object? theoreticalTajweedScore = null,
    Object? performanceScore = null,
    Object? promptingPenalty = null,
    Object? remindingPenalty = null,
    Object? tajweedPenalty = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      memorizationScore: null == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedScore: null == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      theoreticalTajweedScore: null == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      performanceScore: null == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double,
      promptingPenalty: null == promptingPenalty
          ? _value.promptingPenalty
          : promptingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      remindingPenalty: null == remindingPenalty
          ? _value.remindingPenalty
          : remindingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedPenalty: null == tajweedPenalty
          ? _value.tajweedPenalty
          : tajweedPenalty // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ExamCriteriaDtoImplCopyWith<$Res>
    implements $ExamCriteriaDtoCopyWith<$Res> {
  factory _$$ExamCriteriaDtoImplCopyWith(_$ExamCriteriaDtoImpl value,
          $Res Function(_$ExamCriteriaDtoImpl) then) =
      __$$ExamCriteriaDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      double memorizationScore,
      double tajweedScore,
      double theoreticalTajweedScore,
      double performanceScore,
      double promptingPenalty,
      double remindingPenalty,
      double tajweedPenalty});
}

/// @nodoc
class __$$ExamCriteriaDtoImplCopyWithImpl<$Res>
    extends _$ExamCriteriaDtoCopyWithImpl<$Res, _$ExamCriteriaDtoImpl>
    implements _$$ExamCriteriaDtoImplCopyWith<$Res> {
  __$$ExamCriteriaDtoImplCopyWithImpl(
      _$ExamCriteriaDtoImpl _value, $Res Function(_$ExamCriteriaDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? memorizationScore = null,
    Object? tajweedScore = null,
    Object? theoreticalTajweedScore = null,
    Object? performanceScore = null,
    Object? promptingPenalty = null,
    Object? remindingPenalty = null,
    Object? tajweedPenalty = null,
  }) {
    return _then(_$ExamCriteriaDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      memorizationScore: null == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedScore: null == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      theoreticalTajweedScore: null == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      performanceScore: null == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double,
      promptingPenalty: null == promptingPenalty
          ? _value.promptingPenalty
          : promptingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      remindingPenalty: null == remindingPenalty
          ? _value.remindingPenalty
          : remindingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedPenalty: null == tajweedPenalty
          ? _value.tajweedPenalty
          : tajweedPenalty // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamCriteriaDtoImpl implements _ExamCriteriaDto {
  const _$ExamCriteriaDtoImpl(
      {required this.id,
      required this.memorizationScore,
      required this.tajweedScore,
      required this.theoreticalTajweedScore,
      required this.performanceScore,
      required this.promptingPenalty,
      required this.remindingPenalty,
      required this.tajweedPenalty});

  factory _$ExamCriteriaDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamCriteriaDtoImplFromJson(json);

  @override
  final int id;
  @override
  final double memorizationScore;
  @override
  final double tajweedScore;
  @override
  final double theoreticalTajweedScore;
  @override
  final double performanceScore;
  @override
  final double promptingPenalty;
  @override
  final double remindingPenalty;
  @override
  final double tajweedPenalty;

  @override
  String toString() {
    return 'ExamCriteriaDto(id: $id, memorizationScore: $memorizationScore, tajweedScore: $tajweedScore, theoreticalTajweedScore: $theoreticalTajweedScore, performanceScore: $performanceScore, promptingPenalty: $promptingPenalty, remindingPenalty: $remindingPenalty, tajweedPenalty: $tajweedPenalty)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamCriteriaDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.memorizationScore, memorizationScore) ||
                other.memorizationScore == memorizationScore) &&
            (identical(other.tajweedScore, tajweedScore) ||
                other.tajweedScore == tajweedScore) &&
            (identical(
                    other.theoreticalTajweedScore, theoreticalTajweedScore) ||
                other.theoreticalTajweedScore == theoreticalTajweedScore) &&
            (identical(other.performanceScore, performanceScore) ||
                other.performanceScore == performanceScore) &&
            (identical(other.promptingPenalty, promptingPenalty) ||
                other.promptingPenalty == promptingPenalty) &&
            (identical(other.remindingPenalty, remindingPenalty) ||
                other.remindingPenalty == remindingPenalty) &&
            (identical(other.tajweedPenalty, tajweedPenalty) ||
                other.tajweedPenalty == tajweedPenalty));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      memorizationScore,
      tajweedScore,
      theoreticalTajweedScore,
      performanceScore,
      promptingPenalty,
      remindingPenalty,
      tajweedPenalty);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamCriteriaDtoImplCopyWith<_$ExamCriteriaDtoImpl> get copyWith =>
      __$$ExamCriteriaDtoImplCopyWithImpl<_$ExamCriteriaDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamCriteriaDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamCriteriaDto implements ExamCriteriaDto {
  const factory _ExamCriteriaDto(
      {required final int id,
      required final double memorizationScore,
      required final double tajweedScore,
      required final double theoreticalTajweedScore,
      required final double performanceScore,
      required final double promptingPenalty,
      required final double remindingPenalty,
      required final double tajweedPenalty}) = _$ExamCriteriaDtoImpl;

  factory _ExamCriteriaDto.fromJson(Map<String, dynamic> json) =
      _$ExamCriteriaDtoImpl.fromJson;

  @override
  int get id;
  @override
  double get memorizationScore;
  @override
  double get tajweedScore;
  @override
  double get theoreticalTajweedScore;
  @override
  double get performanceScore;
  @override
  double get promptingPenalty;
  @override
  double get remindingPenalty;
  @override
  double get tajweedPenalty;
  @override
  @JsonKey(ignore: true)
  _$$ExamCriteriaDtoImplCopyWith<_$ExamCriteriaDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ExamSummaryDto _$ExamSummaryDtoFromJson(Map<String, dynamic> json) {
  return _ExamSummaryDto.fromJson(json);
}

/// @nodoc
mixin _$ExamSummaryDto {
  int get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get type => throw _privateConstructorUsedError;
  String? get examBranch => throw _privateConstructorUsedError;
  int? get centerId => throw _privateConstructorUsedError;
  int? get circleId => throw _privateConstructorUsedError;
  double get maxScore => throw _privateConstructorUsedError;
  double get passScore => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get scheduledAt => throw _privateConstructorUsedError;
  ExamCenterDto? get center => throw _privateConstructorUsedError;
  ExamCircleDto? get circle => throw _privateConstructorUsedError;
  ExamCriteriaDto? get criteria => throw _privateConstructorUsedError;
  ExamRangeDto? get juzRange => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamSummaryDtoCopyWith<ExamSummaryDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamSummaryDtoCopyWith<$Res> {
  factory $ExamSummaryDtoCopyWith(
          ExamSummaryDto value, $Res Function(ExamSummaryDto) then) =
      _$ExamSummaryDtoCopyWithImpl<$Res, ExamSummaryDto>;
  @useResult
  $Res call(
      {int id,
      String title,
      String? type,
      String? examBranch,
      int? centerId,
      int? circleId,
      double maxScore,
      double passScore,
      String status,
      String? scheduledAt,
      ExamCenterDto? center,
      ExamCircleDto? circle,
      ExamCriteriaDto? criteria,
      ExamRangeDto? juzRange});

  $ExamCenterDtoCopyWith<$Res>? get center;
  $ExamCircleDtoCopyWith<$Res>? get circle;
  $ExamCriteriaDtoCopyWith<$Res>? get criteria;
  $ExamRangeDtoCopyWith<$Res>? get juzRange;
}

/// @nodoc
class _$ExamSummaryDtoCopyWithImpl<$Res, $Val extends ExamSummaryDto>
    implements $ExamSummaryDtoCopyWith<$Res> {
  _$ExamSummaryDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? type = freezed,
    Object? examBranch = freezed,
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? maxScore = null,
    Object? passScore = null,
    Object? status = null,
    Object? scheduledAt = freezed,
    Object? center = freezed,
    Object? circle = freezed,
    Object? criteria = freezed,
    Object? juzRange = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      type: freezed == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      examBranch: freezed == examBranch
          ? _value.examBranch
          : examBranch // ignore: cast_nullable_to_non_nullable
              as String?,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      maxScore: null == maxScore
          ? _value.maxScore
          : maxScore // ignore: cast_nullable_to_non_nullable
              as double,
      passScore: null == passScore
          ? _value.passScore
          : passScore // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      scheduledAt: freezed == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as String?,
      center: freezed == center
          ? _value.center
          : center // ignore: cast_nullable_to_non_nullable
              as ExamCenterDto?,
      circle: freezed == circle
          ? _value.circle
          : circle // ignore: cast_nullable_to_non_nullable
              as ExamCircleDto?,
      criteria: freezed == criteria
          ? _value.criteria
          : criteria // ignore: cast_nullable_to_non_nullable
              as ExamCriteriaDto?,
      juzRange: freezed == juzRange
          ? _value.juzRange
          : juzRange // ignore: cast_nullable_to_non_nullable
              as ExamRangeDto?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCenterDtoCopyWith<$Res>? get center {
    if (_value.center == null) {
      return null;
    }

    return $ExamCenterDtoCopyWith<$Res>(_value.center!, (value) {
      return _then(_value.copyWith(center: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCircleDtoCopyWith<$Res>? get circle {
    if (_value.circle == null) {
      return null;
    }

    return $ExamCircleDtoCopyWith<$Res>(_value.circle!, (value) {
      return _then(_value.copyWith(circle: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCriteriaDtoCopyWith<$Res>? get criteria {
    if (_value.criteria == null) {
      return null;
    }

    return $ExamCriteriaDtoCopyWith<$Res>(_value.criteria!, (value) {
      return _then(_value.copyWith(criteria: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamRangeDtoCopyWith<$Res>? get juzRange {
    if (_value.juzRange == null) {
      return null;
    }

    return $ExamRangeDtoCopyWith<$Res>(_value.juzRange!, (value) {
      return _then(_value.copyWith(juzRange: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ExamSummaryDtoImplCopyWith<$Res>
    implements $ExamSummaryDtoCopyWith<$Res> {
  factory _$$ExamSummaryDtoImplCopyWith(_$ExamSummaryDtoImpl value,
          $Res Function(_$ExamSummaryDtoImpl) then) =
      __$$ExamSummaryDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String title,
      String? type,
      String? examBranch,
      int? centerId,
      int? circleId,
      double maxScore,
      double passScore,
      String status,
      String? scheduledAt,
      ExamCenterDto? center,
      ExamCircleDto? circle,
      ExamCriteriaDto? criteria,
      ExamRangeDto? juzRange});

  @override
  $ExamCenterDtoCopyWith<$Res>? get center;
  @override
  $ExamCircleDtoCopyWith<$Res>? get circle;
  @override
  $ExamCriteriaDtoCopyWith<$Res>? get criteria;
  @override
  $ExamRangeDtoCopyWith<$Res>? get juzRange;
}

/// @nodoc
class __$$ExamSummaryDtoImplCopyWithImpl<$Res>
    extends _$ExamSummaryDtoCopyWithImpl<$Res, _$ExamSummaryDtoImpl>
    implements _$$ExamSummaryDtoImplCopyWith<$Res> {
  __$$ExamSummaryDtoImplCopyWithImpl(
      _$ExamSummaryDtoImpl _value, $Res Function(_$ExamSummaryDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? type = freezed,
    Object? examBranch = freezed,
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? maxScore = null,
    Object? passScore = null,
    Object? status = null,
    Object? scheduledAt = freezed,
    Object? center = freezed,
    Object? circle = freezed,
    Object? criteria = freezed,
    Object? juzRange = freezed,
  }) {
    return _then(_$ExamSummaryDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      type: freezed == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      examBranch: freezed == examBranch
          ? _value.examBranch
          : examBranch // ignore: cast_nullable_to_non_nullable
              as String?,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      maxScore: null == maxScore
          ? _value.maxScore
          : maxScore // ignore: cast_nullable_to_non_nullable
              as double,
      passScore: null == passScore
          ? _value.passScore
          : passScore // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      scheduledAt: freezed == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as String?,
      center: freezed == center
          ? _value.center
          : center // ignore: cast_nullable_to_non_nullable
              as ExamCenterDto?,
      circle: freezed == circle
          ? _value.circle
          : circle // ignore: cast_nullable_to_non_nullable
              as ExamCircleDto?,
      criteria: freezed == criteria
          ? _value.criteria
          : criteria // ignore: cast_nullable_to_non_nullable
              as ExamCriteriaDto?,
      juzRange: freezed == juzRange
          ? _value.juzRange
          : juzRange // ignore: cast_nullable_to_non_nullable
              as ExamRangeDto?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamSummaryDtoImpl implements _ExamSummaryDto {
  const _$ExamSummaryDtoImpl(
      {required this.id,
      required this.title,
      this.type,
      this.examBranch,
      this.centerId,
      this.circleId,
      required this.maxScore,
      required this.passScore,
      required this.status,
      this.scheduledAt,
      this.center,
      this.circle,
      this.criteria,
      this.juzRange});

  factory _$ExamSummaryDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamSummaryDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String title;
  @override
  final String? type;
  @override
  final String? examBranch;
  @override
  final int? centerId;
  @override
  final int? circleId;
  @override
  final double maxScore;
  @override
  final double passScore;
  @override
  final String status;
  @override
  final String? scheduledAt;
  @override
  final ExamCenterDto? center;
  @override
  final ExamCircleDto? circle;
  @override
  final ExamCriteriaDto? criteria;
  @override
  final ExamRangeDto? juzRange;

  @override
  String toString() {
    return 'ExamSummaryDto(id: $id, title: $title, type: $type, examBranch: $examBranch, centerId: $centerId, circleId: $circleId, maxScore: $maxScore, passScore: $passScore, status: $status, scheduledAt: $scheduledAt, center: $center, circle: $circle, criteria: $criteria, juzRange: $juzRange)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamSummaryDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.examBranch, examBranch) ||
                other.examBranch == examBranch) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.maxScore, maxScore) ||
                other.maxScore == maxScore) &&
            (identical(other.passScore, passScore) ||
                other.passScore == passScore) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.scheduledAt, scheduledAt) ||
                other.scheduledAt == scheduledAt) &&
            (identical(other.center, center) || other.center == center) &&
            (identical(other.circle, circle) || other.circle == circle) &&
            (identical(other.criteria, criteria) ||
                other.criteria == criteria) &&
            (identical(other.juzRange, juzRange) ||
                other.juzRange == juzRange));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      type,
      examBranch,
      centerId,
      circleId,
      maxScore,
      passScore,
      status,
      scheduledAt,
      center,
      circle,
      criteria,
      juzRange);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamSummaryDtoImplCopyWith<_$ExamSummaryDtoImpl> get copyWith =>
      __$$ExamSummaryDtoImplCopyWithImpl<_$ExamSummaryDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamSummaryDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamSummaryDto implements ExamSummaryDto {
  const factory _ExamSummaryDto(
      {required final int id,
      required final String title,
      final String? type,
      final String? examBranch,
      final int? centerId,
      final int? circleId,
      required final double maxScore,
      required final double passScore,
      required final String status,
      final String? scheduledAt,
      final ExamCenterDto? center,
      final ExamCircleDto? circle,
      final ExamCriteriaDto? criteria,
      final ExamRangeDto? juzRange}) = _$ExamSummaryDtoImpl;

  factory _ExamSummaryDto.fromJson(Map<String, dynamic> json) =
      _$ExamSummaryDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get title;
  @override
  String? get type;
  @override
  String? get examBranch;
  @override
  int? get centerId;
  @override
  int? get circleId;
  @override
  double get maxScore;
  @override
  double get passScore;
  @override
  String get status;
  @override
  String? get scheduledAt;
  @override
  ExamCenterDto? get center;
  @override
  ExamCircleDto? get circle;
  @override
  ExamCriteriaDto? get criteria;
  @override
  ExamRangeDto? get juzRange;
  @override
  @JsonKey(ignore: true)
  _$$ExamSummaryDtoImplCopyWith<_$ExamSummaryDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ExamAttemptBreakdownDto _$ExamAttemptBreakdownDtoFromJson(
    Map<String, dynamic> json) {
  return _ExamAttemptBreakdownDto.fromJson(json);
}

/// @nodoc
mixin _$ExamAttemptBreakdownDto {
  int get id => throw _privateConstructorUsedError;
  double? get memorizationScore => throw _privateConstructorUsedError;
  double? get tajweedScore => throw _privateConstructorUsedError;
  double? get theoreticalTajweedScore => throw _privateConstructorUsedError;
  double? get performanceScore => throw _privateConstructorUsedError;
  double? get promptingDeductions => throw _privateConstructorUsedError;
  double? get remindingDeductions => throw _privateConstructorUsedError;
  double? get tajweedDeductions => throw _privateConstructorUsedError;
  String? get strengthNotes => throw _privateConstructorUsedError;
  String? get weaknessNotes => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamAttemptBreakdownDtoCopyWith<ExamAttemptBreakdownDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamAttemptBreakdownDtoCopyWith<$Res> {
  factory $ExamAttemptBreakdownDtoCopyWith(ExamAttemptBreakdownDto value,
          $Res Function(ExamAttemptBreakdownDto) then) =
      _$ExamAttemptBreakdownDtoCopyWithImpl<$Res, ExamAttemptBreakdownDto>;
  @useResult
  $Res call(
      {int id,
      double? memorizationScore,
      double? tajweedScore,
      double? theoreticalTajweedScore,
      double? performanceScore,
      double? promptingDeductions,
      double? remindingDeductions,
      double? tajweedDeductions,
      String? strengthNotes,
      String? weaknessNotes});
}

/// @nodoc
class _$ExamAttemptBreakdownDtoCopyWithImpl<$Res,
        $Val extends ExamAttemptBreakdownDto>
    implements $ExamAttemptBreakdownDtoCopyWith<$Res> {
  _$ExamAttemptBreakdownDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? memorizationScore = freezed,
    Object? tajweedScore = freezed,
    Object? theoreticalTajweedScore = freezed,
    Object? performanceScore = freezed,
    Object? promptingDeductions = freezed,
    Object? remindingDeductions = freezed,
    Object? tajweedDeductions = freezed,
    Object? strengthNotes = freezed,
    Object? weaknessNotes = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      memorizationScore: freezed == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double?,
      tajweedScore: freezed == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double?,
      theoreticalTajweedScore: freezed == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double?,
      performanceScore: freezed == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double?,
      promptingDeductions: freezed == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double?,
      remindingDeductions: freezed == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double?,
      tajweedDeductions: freezed == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double?,
      strengthNotes: freezed == strengthNotes
          ? _value.strengthNotes
          : strengthNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      weaknessNotes: freezed == weaknessNotes
          ? _value.weaknessNotes
          : weaknessNotes // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ExamAttemptBreakdownDtoImplCopyWith<$Res>
    implements $ExamAttemptBreakdownDtoCopyWith<$Res> {
  factory _$$ExamAttemptBreakdownDtoImplCopyWith(
          _$ExamAttemptBreakdownDtoImpl value,
          $Res Function(_$ExamAttemptBreakdownDtoImpl) then) =
      __$$ExamAttemptBreakdownDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      double? memorizationScore,
      double? tajweedScore,
      double? theoreticalTajweedScore,
      double? performanceScore,
      double? promptingDeductions,
      double? remindingDeductions,
      double? tajweedDeductions,
      String? strengthNotes,
      String? weaknessNotes});
}

/// @nodoc
class __$$ExamAttemptBreakdownDtoImplCopyWithImpl<$Res>
    extends _$ExamAttemptBreakdownDtoCopyWithImpl<$Res,
        _$ExamAttemptBreakdownDtoImpl>
    implements _$$ExamAttemptBreakdownDtoImplCopyWith<$Res> {
  __$$ExamAttemptBreakdownDtoImplCopyWithImpl(
      _$ExamAttemptBreakdownDtoImpl _value,
      $Res Function(_$ExamAttemptBreakdownDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? memorizationScore = freezed,
    Object? tajweedScore = freezed,
    Object? theoreticalTajweedScore = freezed,
    Object? performanceScore = freezed,
    Object? promptingDeductions = freezed,
    Object? remindingDeductions = freezed,
    Object? tajweedDeductions = freezed,
    Object? strengthNotes = freezed,
    Object? weaknessNotes = freezed,
  }) {
    return _then(_$ExamAttemptBreakdownDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      memorizationScore: freezed == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double?,
      tajweedScore: freezed == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double?,
      theoreticalTajweedScore: freezed == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double?,
      performanceScore: freezed == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double?,
      promptingDeductions: freezed == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double?,
      remindingDeductions: freezed == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double?,
      tajweedDeductions: freezed == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double?,
      strengthNotes: freezed == strengthNotes
          ? _value.strengthNotes
          : strengthNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      weaknessNotes: freezed == weaknessNotes
          ? _value.weaknessNotes
          : weaknessNotes // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamAttemptBreakdownDtoImpl implements _ExamAttemptBreakdownDto {
  const _$ExamAttemptBreakdownDtoImpl(
      {required this.id,
      this.memorizationScore,
      this.tajweedScore,
      this.theoreticalTajweedScore,
      this.performanceScore,
      this.promptingDeductions,
      this.remindingDeductions,
      this.tajweedDeductions,
      this.strengthNotes,
      this.weaknessNotes});

  factory _$ExamAttemptBreakdownDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamAttemptBreakdownDtoImplFromJson(json);

  @override
  final int id;
  @override
  final double? memorizationScore;
  @override
  final double? tajweedScore;
  @override
  final double? theoreticalTajweedScore;
  @override
  final double? performanceScore;
  @override
  final double? promptingDeductions;
  @override
  final double? remindingDeductions;
  @override
  final double? tajweedDeductions;
  @override
  final String? strengthNotes;
  @override
  final String? weaknessNotes;

  @override
  String toString() {
    return 'ExamAttemptBreakdownDto(id: $id, memorizationScore: $memorizationScore, tajweedScore: $tajweedScore, theoreticalTajweedScore: $theoreticalTajweedScore, performanceScore: $performanceScore, promptingDeductions: $promptingDeductions, remindingDeductions: $remindingDeductions, tajweedDeductions: $tajweedDeductions, strengthNotes: $strengthNotes, weaknessNotes: $weaknessNotes)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamAttemptBreakdownDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.memorizationScore, memorizationScore) ||
                other.memorizationScore == memorizationScore) &&
            (identical(other.tajweedScore, tajweedScore) ||
                other.tajweedScore == tajweedScore) &&
            (identical(
                    other.theoreticalTajweedScore, theoreticalTajweedScore) ||
                other.theoreticalTajweedScore == theoreticalTajweedScore) &&
            (identical(other.performanceScore, performanceScore) ||
                other.performanceScore == performanceScore) &&
            (identical(other.promptingDeductions, promptingDeductions) ||
                other.promptingDeductions == promptingDeductions) &&
            (identical(other.remindingDeductions, remindingDeductions) ||
                other.remindingDeductions == remindingDeductions) &&
            (identical(other.tajweedDeductions, tajweedDeductions) ||
                other.tajweedDeductions == tajweedDeductions) &&
            (identical(other.strengthNotes, strengthNotes) ||
                other.strengthNotes == strengthNotes) &&
            (identical(other.weaknessNotes, weaknessNotes) ||
                other.weaknessNotes == weaknessNotes));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      memorizationScore,
      tajweedScore,
      theoreticalTajweedScore,
      performanceScore,
      promptingDeductions,
      remindingDeductions,
      tajweedDeductions,
      strengthNotes,
      weaknessNotes);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamAttemptBreakdownDtoImplCopyWith<_$ExamAttemptBreakdownDtoImpl>
      get copyWith => __$$ExamAttemptBreakdownDtoImplCopyWithImpl<
          _$ExamAttemptBreakdownDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamAttemptBreakdownDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamAttemptBreakdownDto implements ExamAttemptBreakdownDto {
  const factory _ExamAttemptBreakdownDto(
      {required final int id,
      final double? memorizationScore,
      final double? tajweedScore,
      final double? theoreticalTajweedScore,
      final double? performanceScore,
      final double? promptingDeductions,
      final double? remindingDeductions,
      final double? tajweedDeductions,
      final String? strengthNotes,
      final String? weaknessNotes}) = _$ExamAttemptBreakdownDtoImpl;

  factory _ExamAttemptBreakdownDto.fromJson(Map<String, dynamic> json) =
      _$ExamAttemptBreakdownDtoImpl.fromJson;

  @override
  int get id;
  @override
  double? get memorizationScore;
  @override
  double? get tajweedScore;
  @override
  double? get theoreticalTajweedScore;
  @override
  double? get performanceScore;
  @override
  double? get promptingDeductions;
  @override
  double? get remindingDeductions;
  @override
  double? get tajweedDeductions;
  @override
  String? get strengthNotes;
  @override
  String? get weaknessNotes;
  @override
  @JsonKey(ignore: true)
  _$$ExamAttemptBreakdownDtoImplCopyWith<_$ExamAttemptBreakdownDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ExamAttemptCommitteeMemberDto _$ExamAttemptCommitteeMemberDtoFromJson(
    Map<String, dynamic> json) {
  return _ExamAttemptCommitteeMemberDto.fromJson(json);
}

/// @nodoc
mixin _$ExamAttemptCommitteeMemberDto {
  int get id => throw _privateConstructorUsedError;
  int get userId => throw _privateConstructorUsedError;
  String? get committeeRole => throw _privateConstructorUsedError;
  String? get roleAtAssignment => throw _privateConstructorUsedError;
  int? get assignedById => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  ExamUserSummaryDto? get user => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamAttemptCommitteeMemberDtoCopyWith<ExamAttemptCommitteeMemberDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamAttemptCommitteeMemberDtoCopyWith<$Res> {
  factory $ExamAttemptCommitteeMemberDtoCopyWith(
          ExamAttemptCommitteeMemberDto value,
          $Res Function(ExamAttemptCommitteeMemberDto) then) =
      _$ExamAttemptCommitteeMemberDtoCopyWithImpl<$Res,
          ExamAttemptCommitteeMemberDto>;
  @useResult
  $Res call(
      {int id,
      int userId,
      String? committeeRole,
      String? roleAtAssignment,
      int? assignedById,
      String? createdAt,
      ExamUserSummaryDto? user});

  $ExamUserSummaryDtoCopyWith<$Res>? get user;
}

/// @nodoc
class _$ExamAttemptCommitteeMemberDtoCopyWithImpl<$Res,
        $Val extends ExamAttemptCommitteeMemberDto>
    implements $ExamAttemptCommitteeMemberDtoCopyWith<$Res> {
  _$ExamAttemptCommitteeMemberDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? committeeRole = freezed,
    Object? roleAtAssignment = freezed,
    Object? assignedById = freezed,
    Object? createdAt = freezed,
    Object? user = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as int,
      committeeRole: freezed == committeeRole
          ? _value.committeeRole
          : committeeRole // ignore: cast_nullable_to_non_nullable
              as String?,
      roleAtAssignment: freezed == roleAtAssignment
          ? _value.roleAtAssignment
          : roleAtAssignment // ignore: cast_nullable_to_non_nullable
              as String?,
      assignedById: freezed == assignedById
          ? _value.assignedById
          : assignedById // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      user: freezed == user
          ? _value.user
          : user // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamUserSummaryDtoCopyWith<$Res>? get user {
    if (_value.user == null) {
      return null;
    }

    return $ExamUserSummaryDtoCopyWith<$Res>(_value.user!, (value) {
      return _then(_value.copyWith(user: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ExamAttemptCommitteeMemberDtoImplCopyWith<$Res>
    implements $ExamAttemptCommitteeMemberDtoCopyWith<$Res> {
  factory _$$ExamAttemptCommitteeMemberDtoImplCopyWith(
          _$ExamAttemptCommitteeMemberDtoImpl value,
          $Res Function(_$ExamAttemptCommitteeMemberDtoImpl) then) =
      __$$ExamAttemptCommitteeMemberDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int userId,
      String? committeeRole,
      String? roleAtAssignment,
      int? assignedById,
      String? createdAt,
      ExamUserSummaryDto? user});

  @override
  $ExamUserSummaryDtoCopyWith<$Res>? get user;
}

/// @nodoc
class __$$ExamAttemptCommitteeMemberDtoImplCopyWithImpl<$Res>
    extends _$ExamAttemptCommitteeMemberDtoCopyWithImpl<$Res,
        _$ExamAttemptCommitteeMemberDtoImpl>
    implements _$$ExamAttemptCommitteeMemberDtoImplCopyWith<$Res> {
  __$$ExamAttemptCommitteeMemberDtoImplCopyWithImpl(
      _$ExamAttemptCommitteeMemberDtoImpl _value,
      $Res Function(_$ExamAttemptCommitteeMemberDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? committeeRole = freezed,
    Object? roleAtAssignment = freezed,
    Object? assignedById = freezed,
    Object? createdAt = freezed,
    Object? user = freezed,
  }) {
    return _then(_$ExamAttemptCommitteeMemberDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as int,
      committeeRole: freezed == committeeRole
          ? _value.committeeRole
          : committeeRole // ignore: cast_nullable_to_non_nullable
              as String?,
      roleAtAssignment: freezed == roleAtAssignment
          ? _value.roleAtAssignment
          : roleAtAssignment // ignore: cast_nullable_to_non_nullable
              as String?,
      assignedById: freezed == assignedById
          ? _value.assignedById
          : assignedById // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      user: freezed == user
          ? _value.user
          : user // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamAttemptCommitteeMemberDtoImpl
    implements _ExamAttemptCommitteeMemberDto {
  const _$ExamAttemptCommitteeMemberDtoImpl(
      {required this.id,
      required this.userId,
      this.committeeRole,
      this.roleAtAssignment,
      this.assignedById,
      this.createdAt,
      this.user});

  factory _$ExamAttemptCommitteeMemberDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$ExamAttemptCommitteeMemberDtoImplFromJson(json);

  @override
  final int id;
  @override
  final int userId;
  @override
  final String? committeeRole;
  @override
  final String? roleAtAssignment;
  @override
  final int? assignedById;
  @override
  final String? createdAt;
  @override
  final ExamUserSummaryDto? user;

  @override
  String toString() {
    return 'ExamAttemptCommitteeMemberDto(id: $id, userId: $userId, committeeRole: $committeeRole, roleAtAssignment: $roleAtAssignment, assignedById: $assignedById, createdAt: $createdAt, user: $user)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamAttemptCommitteeMemberDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.committeeRole, committeeRole) ||
                other.committeeRole == committeeRole) &&
            (identical(other.roleAtAssignment, roleAtAssignment) ||
                other.roleAtAssignment == roleAtAssignment) &&
            (identical(other.assignedById, assignedById) ||
                other.assignedById == assignedById) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.user, user) || other.user == user));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, userId, committeeRole,
      roleAtAssignment, assignedById, createdAt, user);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamAttemptCommitteeMemberDtoImplCopyWith<
          _$ExamAttemptCommitteeMemberDtoImpl>
      get copyWith => __$$ExamAttemptCommitteeMemberDtoImplCopyWithImpl<
          _$ExamAttemptCommitteeMemberDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamAttemptCommitteeMemberDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamAttemptCommitteeMemberDto
    implements ExamAttemptCommitteeMemberDto {
  const factory _ExamAttemptCommitteeMemberDto(
      {required final int id,
      required final int userId,
      final String? committeeRole,
      final String? roleAtAssignment,
      final int? assignedById,
      final String? createdAt,
      final ExamUserSummaryDto? user}) = _$ExamAttemptCommitteeMemberDtoImpl;

  factory _ExamAttemptCommitteeMemberDto.fromJson(Map<String, dynamic> json) =
      _$ExamAttemptCommitteeMemberDtoImpl.fromJson;

  @override
  int get id;
  @override
  int get userId;
  @override
  String? get committeeRole;
  @override
  String? get roleAtAssignment;
  @override
  int? get assignedById;
  @override
  String? get createdAt;
  @override
  ExamUserSummaryDto? get user;
  @override
  @JsonKey(ignore: true)
  _$$ExamAttemptCommitteeMemberDtoImplCopyWith<
          _$ExamAttemptCommitteeMemberDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ExamAttemptQuestionDto _$ExamAttemptQuestionDtoFromJson(
    Map<String, dynamic> json) {
  return _ExamAttemptQuestionDto.fromJson(json);
}

/// @nodoc
mixin _$ExamAttemptQuestionDto {
  int get id => throw _privateConstructorUsedError;
  int get orderIndex => throw _privateConstructorUsedError;
  String get source => throw _privateConstructorUsedError;
  int get fromSurah => throw _privateConstructorUsedError;
  int get fromAyah => throw _privateConstructorUsedError;
  int get toSurah => throw _privateConstructorUsedError;
  int get toAyah => throw _privateConstructorUsedError;
  double get promptingDeductions => throw _privateConstructorUsedError;
  double get remindingDeductions => throw _privateConstructorUsedError;
  double get tajweedDeductions => throw _privateConstructorUsedError;
  bool get isEvaluated => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  String? get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamAttemptQuestionDtoCopyWith<ExamAttemptQuestionDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamAttemptQuestionDtoCopyWith<$Res> {
  factory $ExamAttemptQuestionDtoCopyWith(ExamAttemptQuestionDto value,
          $Res Function(ExamAttemptQuestionDto) then) =
      _$ExamAttemptQuestionDtoCopyWithImpl<$Res, ExamAttemptQuestionDto>;
  @useResult
  $Res call(
      {int id,
      int orderIndex,
      String source,
      int fromSurah,
      int fromAyah,
      int toSurah,
      int toAyah,
      double promptingDeductions,
      double remindingDeductions,
      double tajweedDeductions,
      bool isEvaluated,
      String? createdAt,
      String? updatedAt});
}

/// @nodoc
class _$ExamAttemptQuestionDtoCopyWithImpl<$Res,
        $Val extends ExamAttemptQuestionDto>
    implements $ExamAttemptQuestionDtoCopyWith<$Res> {
  _$ExamAttemptQuestionDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? orderIndex = null,
    Object? source = null,
    Object? fromSurah = null,
    Object? fromAyah = null,
    Object? toSurah = null,
    Object? toAyah = null,
    Object? promptingDeductions = null,
    Object? remindingDeductions = null,
    Object? tajweedDeductions = null,
    Object? isEvaluated = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      orderIndex: null == orderIndex
          ? _value.orderIndex
          : orderIndex // ignore: cast_nullable_to_non_nullable
              as int,
      source: null == source
          ? _value.source
          : source // ignore: cast_nullable_to_non_nullable
              as String,
      fromSurah: null == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int,
      fromAyah: null == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int,
      toSurah: null == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int,
      toAyah: null == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int,
      promptingDeductions: null == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      remindingDeductions: null == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedDeductions: null == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      isEvaluated: null == isEvaluated
          ? _value.isEvaluated
          : isEvaluated // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ExamAttemptQuestionDtoImplCopyWith<$Res>
    implements $ExamAttemptQuestionDtoCopyWith<$Res> {
  factory _$$ExamAttemptQuestionDtoImplCopyWith(
          _$ExamAttemptQuestionDtoImpl value,
          $Res Function(_$ExamAttemptQuestionDtoImpl) then) =
      __$$ExamAttemptQuestionDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int orderIndex,
      String source,
      int fromSurah,
      int fromAyah,
      int toSurah,
      int toAyah,
      double promptingDeductions,
      double remindingDeductions,
      double tajweedDeductions,
      bool isEvaluated,
      String? createdAt,
      String? updatedAt});
}

/// @nodoc
class __$$ExamAttemptQuestionDtoImplCopyWithImpl<$Res>
    extends _$ExamAttemptQuestionDtoCopyWithImpl<$Res,
        _$ExamAttemptQuestionDtoImpl>
    implements _$$ExamAttemptQuestionDtoImplCopyWith<$Res> {
  __$$ExamAttemptQuestionDtoImplCopyWithImpl(
      _$ExamAttemptQuestionDtoImpl _value,
      $Res Function(_$ExamAttemptQuestionDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? orderIndex = null,
    Object? source = null,
    Object? fromSurah = null,
    Object? fromAyah = null,
    Object? toSurah = null,
    Object? toAyah = null,
    Object? promptingDeductions = null,
    Object? remindingDeductions = null,
    Object? tajweedDeductions = null,
    Object? isEvaluated = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_$ExamAttemptQuestionDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      orderIndex: null == orderIndex
          ? _value.orderIndex
          : orderIndex // ignore: cast_nullable_to_non_nullable
              as int,
      source: null == source
          ? _value.source
          : source // ignore: cast_nullable_to_non_nullable
              as String,
      fromSurah: null == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int,
      fromAyah: null == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int,
      toSurah: null == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int,
      toAyah: null == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int,
      promptingDeductions: null == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      remindingDeductions: null == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedDeductions: null == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      isEvaluated: null == isEvaluated
          ? _value.isEvaluated
          : isEvaluated // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamAttemptQuestionDtoImpl implements _ExamAttemptQuestionDto {
  const _$ExamAttemptQuestionDtoImpl(
      {required this.id,
      required this.orderIndex,
      required this.source,
      required this.fromSurah,
      required this.fromAyah,
      required this.toSurah,
      required this.toAyah,
      this.promptingDeductions = 0,
      this.remindingDeductions = 0,
      this.tajweedDeductions = 0,
      this.isEvaluated = false,
      this.createdAt,
      this.updatedAt});

  factory _$ExamAttemptQuestionDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamAttemptQuestionDtoImplFromJson(json);

  @override
  final int id;
  @override
  final int orderIndex;
  @override
  final String source;
  @override
  final int fromSurah;
  @override
  final int fromAyah;
  @override
  final int toSurah;
  @override
  final int toAyah;
  @override
  @JsonKey()
  final double promptingDeductions;
  @override
  @JsonKey()
  final double remindingDeductions;
  @override
  @JsonKey()
  final double tajweedDeductions;
  @override
  @JsonKey()
  final bool isEvaluated;
  @override
  final String? createdAt;
  @override
  final String? updatedAt;

  @override
  String toString() {
    return 'ExamAttemptQuestionDto(id: $id, orderIndex: $orderIndex, source: $source, fromSurah: $fromSurah, fromAyah: $fromAyah, toSurah: $toSurah, toAyah: $toAyah, promptingDeductions: $promptingDeductions, remindingDeductions: $remindingDeductions, tajweedDeductions: $tajweedDeductions, isEvaluated: $isEvaluated, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamAttemptQuestionDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.orderIndex, orderIndex) ||
                other.orderIndex == orderIndex) &&
            (identical(other.source, source) || other.source == source) &&
            (identical(other.fromSurah, fromSurah) ||
                other.fromSurah == fromSurah) &&
            (identical(other.fromAyah, fromAyah) ||
                other.fromAyah == fromAyah) &&
            (identical(other.toSurah, toSurah) || other.toSurah == toSurah) &&
            (identical(other.toAyah, toAyah) || other.toAyah == toAyah) &&
            (identical(other.promptingDeductions, promptingDeductions) ||
                other.promptingDeductions == promptingDeductions) &&
            (identical(other.remindingDeductions, remindingDeductions) ||
                other.remindingDeductions == remindingDeductions) &&
            (identical(other.tajweedDeductions, tajweedDeductions) ||
                other.tajweedDeductions == tajweedDeductions) &&
            (identical(other.isEvaluated, isEvaluated) ||
                other.isEvaluated == isEvaluated) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      orderIndex,
      source,
      fromSurah,
      fromAyah,
      toSurah,
      toAyah,
      promptingDeductions,
      remindingDeductions,
      tajweedDeductions,
      isEvaluated,
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamAttemptQuestionDtoImplCopyWith<_$ExamAttemptQuestionDtoImpl>
      get copyWith => __$$ExamAttemptQuestionDtoImplCopyWithImpl<
          _$ExamAttemptQuestionDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamAttemptQuestionDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamAttemptQuestionDto implements ExamAttemptQuestionDto {
  const factory _ExamAttemptQuestionDto(
      {required final int id,
      required final int orderIndex,
      required final String source,
      required final int fromSurah,
      required final int fromAyah,
      required final int toSurah,
      required final int toAyah,
      final double promptingDeductions,
      final double remindingDeductions,
      final double tajweedDeductions,
      final bool isEvaluated,
      final String? createdAt,
      final String? updatedAt}) = _$ExamAttemptQuestionDtoImpl;

  factory _ExamAttemptQuestionDto.fromJson(Map<String, dynamic> json) =
      _$ExamAttemptQuestionDtoImpl.fromJson;

  @override
  int get id;
  @override
  int get orderIndex;
  @override
  String get source;
  @override
  int get fromSurah;
  @override
  int get fromAyah;
  @override
  int get toSurah;
  @override
  int get toAyah;
  @override
  double get promptingDeductions;
  @override
  double get remindingDeductions;
  @override
  double get tajweedDeductions;
  @override
  bool get isEvaluated;
  @override
  String? get createdAt;
  @override
  String? get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$ExamAttemptQuestionDtoImplCopyWith<_$ExamAttemptQuestionDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ExamAttemptDto _$ExamAttemptDtoFromJson(Map<String, dynamic> json) {
  return _ExamAttemptDto.fromJson(json);
}

/// @nodoc
mixin _$ExamAttemptDto {
  int get id => throw _privateConstructorUsedError;
  int get examId => throw _privateConstructorUsedError;
  int get studentId => throw _privateConstructorUsedError;
  int get circleId => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get examDate => throw _privateConstructorUsedError;
  String? get fullQuranCompletedAt => throw _privateConstructorUsedError;
  int? get stabilizationDays => throw _privateConstructorUsedError;
  String? get committeeNotes => throw _privateConstructorUsedError;
  double? get totalScore => throw _privateConstructorUsedError;
  String? get gradeLabel => throw _privateConstructorUsedError;
  String? get startedAt => throw _privateConstructorUsedError;
  String? get submittedAt => throw _privateConstructorUsedError;
  String? get reviewedAt => throw _privateConstructorUsedError;
  int? get evaluatedById => throw _privateConstructorUsedError;
  int? get lockVersion => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  String? get updatedAt => throw _privateConstructorUsedError;
  ExamUserSummaryDto? get student => throw _privateConstructorUsedError;
  ExamCircleDto? get circle => throw _privateConstructorUsedError;
  List<ExamAttemptCommitteeMemberDto>? get committeeMembers =>
      throw _privateConstructorUsedError;
  List<ExamAttemptQuestionDto>? get questions =>
      throw _privateConstructorUsedError;
  ExamUserSummaryDto? get evaluatedBy => throw _privateConstructorUsedError;
  ExamAttemptBreakdownDto? get breakdown => throw _privateConstructorUsedError;
  ExamSummaryDto? get exam => throw _privateConstructorUsedError;
  ExamRangeDto? get examRange => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ExamAttemptDtoCopyWith<ExamAttemptDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExamAttemptDtoCopyWith<$Res> {
  factory $ExamAttemptDtoCopyWith(
          ExamAttemptDto value, $Res Function(ExamAttemptDto) then) =
      _$ExamAttemptDtoCopyWithImpl<$Res, ExamAttemptDto>;
  @useResult
  $Res call(
      {int id,
      int examId,
      int studentId,
      int circleId,
      String status,
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
      ExamRangeDto? examRange});

  $ExamUserSummaryDtoCopyWith<$Res>? get student;
  $ExamCircleDtoCopyWith<$Res>? get circle;
  $ExamUserSummaryDtoCopyWith<$Res>? get evaluatedBy;
  $ExamAttemptBreakdownDtoCopyWith<$Res>? get breakdown;
  $ExamSummaryDtoCopyWith<$Res>? get exam;
  $ExamRangeDtoCopyWith<$Res>? get examRange;
}

/// @nodoc
class _$ExamAttemptDtoCopyWithImpl<$Res, $Val extends ExamAttemptDto>
    implements $ExamAttemptDtoCopyWith<$Res> {
  _$ExamAttemptDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? examId = null,
    Object? studentId = null,
    Object? circleId = null,
    Object? status = null,
    Object? examDate = freezed,
    Object? fullQuranCompletedAt = freezed,
    Object? stabilizationDays = freezed,
    Object? committeeNotes = freezed,
    Object? totalScore = freezed,
    Object? gradeLabel = freezed,
    Object? startedAt = freezed,
    Object? submittedAt = freezed,
    Object? reviewedAt = freezed,
    Object? evaluatedById = freezed,
    Object? lockVersion = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? student = freezed,
    Object? circle = freezed,
    Object? committeeMembers = freezed,
    Object? questions = freezed,
    Object? evaluatedBy = freezed,
    Object? breakdown = freezed,
    Object? exam = freezed,
    Object? examRange = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      examId: null == examId
          ? _value.examId
          : examId // ignore: cast_nullable_to_non_nullable
              as int,
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      examDate: freezed == examDate
          ? _value.examDate
          : examDate // ignore: cast_nullable_to_non_nullable
              as String?,
      fullQuranCompletedAt: freezed == fullQuranCompletedAt
          ? _value.fullQuranCompletedAt
          : fullQuranCompletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      stabilizationDays: freezed == stabilizationDays
          ? _value.stabilizationDays
          : stabilizationDays // ignore: cast_nullable_to_non_nullable
              as int?,
      committeeNotes: freezed == committeeNotes
          ? _value.committeeNotes
          : committeeNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      totalScore: freezed == totalScore
          ? _value.totalScore
          : totalScore // ignore: cast_nullable_to_non_nullable
              as double?,
      gradeLabel: freezed == gradeLabel
          ? _value.gradeLabel
          : gradeLabel // ignore: cast_nullable_to_non_nullable
              as String?,
      startedAt: freezed == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      submittedAt: freezed == submittedAt
          ? _value.submittedAt
          : submittedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      reviewedAt: freezed == reviewedAt
          ? _value.reviewedAt
          : reviewedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      evaluatedById: freezed == evaluatedById
          ? _value.evaluatedById
          : evaluatedById // ignore: cast_nullable_to_non_nullable
              as int?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      student: freezed == student
          ? _value.student
          : student // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
      circle: freezed == circle
          ? _value.circle
          : circle // ignore: cast_nullable_to_non_nullable
              as ExamCircleDto?,
      committeeMembers: freezed == committeeMembers
          ? _value.committeeMembers
          : committeeMembers // ignore: cast_nullable_to_non_nullable
              as List<ExamAttemptCommitteeMemberDto>?,
      questions: freezed == questions
          ? _value.questions
          : questions // ignore: cast_nullable_to_non_nullable
              as List<ExamAttemptQuestionDto>?,
      evaluatedBy: freezed == evaluatedBy
          ? _value.evaluatedBy
          : evaluatedBy // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
      breakdown: freezed == breakdown
          ? _value.breakdown
          : breakdown // ignore: cast_nullable_to_non_nullable
              as ExamAttemptBreakdownDto?,
      exam: freezed == exam
          ? _value.exam
          : exam // ignore: cast_nullable_to_non_nullable
              as ExamSummaryDto?,
      examRange: freezed == examRange
          ? _value.examRange
          : examRange // ignore: cast_nullable_to_non_nullable
              as ExamRangeDto?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamUserSummaryDtoCopyWith<$Res>? get student {
    if (_value.student == null) {
      return null;
    }

    return $ExamUserSummaryDtoCopyWith<$Res>(_value.student!, (value) {
      return _then(_value.copyWith(student: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamCircleDtoCopyWith<$Res>? get circle {
    if (_value.circle == null) {
      return null;
    }

    return $ExamCircleDtoCopyWith<$Res>(_value.circle!, (value) {
      return _then(_value.copyWith(circle: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamUserSummaryDtoCopyWith<$Res>? get evaluatedBy {
    if (_value.evaluatedBy == null) {
      return null;
    }

    return $ExamUserSummaryDtoCopyWith<$Res>(_value.evaluatedBy!, (value) {
      return _then(_value.copyWith(evaluatedBy: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamAttemptBreakdownDtoCopyWith<$Res>? get breakdown {
    if (_value.breakdown == null) {
      return null;
    }

    return $ExamAttemptBreakdownDtoCopyWith<$Res>(_value.breakdown!, (value) {
      return _then(_value.copyWith(breakdown: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamSummaryDtoCopyWith<$Res>? get exam {
    if (_value.exam == null) {
      return null;
    }

    return $ExamSummaryDtoCopyWith<$Res>(_value.exam!, (value) {
      return _then(_value.copyWith(exam: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $ExamRangeDtoCopyWith<$Res>? get examRange {
    if (_value.examRange == null) {
      return null;
    }

    return $ExamRangeDtoCopyWith<$Res>(_value.examRange!, (value) {
      return _then(_value.copyWith(examRange: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ExamAttemptDtoImplCopyWith<$Res>
    implements $ExamAttemptDtoCopyWith<$Res> {
  factory _$$ExamAttemptDtoImplCopyWith(_$ExamAttemptDtoImpl value,
          $Res Function(_$ExamAttemptDtoImpl) then) =
      __$$ExamAttemptDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int examId,
      int studentId,
      int circleId,
      String status,
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
      ExamRangeDto? examRange});

  @override
  $ExamUserSummaryDtoCopyWith<$Res>? get student;
  @override
  $ExamCircleDtoCopyWith<$Res>? get circle;
  @override
  $ExamUserSummaryDtoCopyWith<$Res>? get evaluatedBy;
  @override
  $ExamAttemptBreakdownDtoCopyWith<$Res>? get breakdown;
  @override
  $ExamSummaryDtoCopyWith<$Res>? get exam;
  @override
  $ExamRangeDtoCopyWith<$Res>? get examRange;
}

/// @nodoc
class __$$ExamAttemptDtoImplCopyWithImpl<$Res>
    extends _$ExamAttemptDtoCopyWithImpl<$Res, _$ExamAttemptDtoImpl>
    implements _$$ExamAttemptDtoImplCopyWith<$Res> {
  __$$ExamAttemptDtoImplCopyWithImpl(
      _$ExamAttemptDtoImpl _value, $Res Function(_$ExamAttemptDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? examId = null,
    Object? studentId = null,
    Object? circleId = null,
    Object? status = null,
    Object? examDate = freezed,
    Object? fullQuranCompletedAt = freezed,
    Object? stabilizationDays = freezed,
    Object? committeeNotes = freezed,
    Object? totalScore = freezed,
    Object? gradeLabel = freezed,
    Object? startedAt = freezed,
    Object? submittedAt = freezed,
    Object? reviewedAt = freezed,
    Object? evaluatedById = freezed,
    Object? lockVersion = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? student = freezed,
    Object? circle = freezed,
    Object? committeeMembers = freezed,
    Object? questions = freezed,
    Object? evaluatedBy = freezed,
    Object? breakdown = freezed,
    Object? exam = freezed,
    Object? examRange = freezed,
  }) {
    return _then(_$ExamAttemptDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      examId: null == examId
          ? _value.examId
          : examId // ignore: cast_nullable_to_non_nullable
              as int,
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      examDate: freezed == examDate
          ? _value.examDate
          : examDate // ignore: cast_nullable_to_non_nullable
              as String?,
      fullQuranCompletedAt: freezed == fullQuranCompletedAt
          ? _value.fullQuranCompletedAt
          : fullQuranCompletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      stabilizationDays: freezed == stabilizationDays
          ? _value.stabilizationDays
          : stabilizationDays // ignore: cast_nullable_to_non_nullable
              as int?,
      committeeNotes: freezed == committeeNotes
          ? _value.committeeNotes
          : committeeNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      totalScore: freezed == totalScore
          ? _value.totalScore
          : totalScore // ignore: cast_nullable_to_non_nullable
              as double?,
      gradeLabel: freezed == gradeLabel
          ? _value.gradeLabel
          : gradeLabel // ignore: cast_nullable_to_non_nullable
              as String?,
      startedAt: freezed == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      submittedAt: freezed == submittedAt
          ? _value.submittedAt
          : submittedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      reviewedAt: freezed == reviewedAt
          ? _value.reviewedAt
          : reviewedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      evaluatedById: freezed == evaluatedById
          ? _value.evaluatedById
          : evaluatedById // ignore: cast_nullable_to_non_nullable
              as int?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      student: freezed == student
          ? _value.student
          : student // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
      circle: freezed == circle
          ? _value.circle
          : circle // ignore: cast_nullable_to_non_nullable
              as ExamCircleDto?,
      committeeMembers: freezed == committeeMembers
          ? _value._committeeMembers
          : committeeMembers // ignore: cast_nullable_to_non_nullable
              as List<ExamAttemptCommitteeMemberDto>?,
      questions: freezed == questions
          ? _value._questions
          : questions // ignore: cast_nullable_to_non_nullable
              as List<ExamAttemptQuestionDto>?,
      evaluatedBy: freezed == evaluatedBy
          ? _value.evaluatedBy
          : evaluatedBy // ignore: cast_nullable_to_non_nullable
              as ExamUserSummaryDto?,
      breakdown: freezed == breakdown
          ? _value.breakdown
          : breakdown // ignore: cast_nullable_to_non_nullable
              as ExamAttemptBreakdownDto?,
      exam: freezed == exam
          ? _value.exam
          : exam // ignore: cast_nullable_to_non_nullable
              as ExamSummaryDto?,
      examRange: freezed == examRange
          ? _value.examRange
          : examRange // ignore: cast_nullable_to_non_nullable
              as ExamRangeDto?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ExamAttemptDtoImpl implements _ExamAttemptDto {
  const _$ExamAttemptDtoImpl(
      {required this.id,
      required this.examId,
      required this.studentId,
      required this.circleId,
      required this.status,
      this.examDate,
      this.fullQuranCompletedAt,
      this.stabilizationDays,
      this.committeeNotes,
      this.totalScore,
      this.gradeLabel,
      this.startedAt,
      this.submittedAt,
      this.reviewedAt,
      this.evaluatedById,
      this.lockVersion,
      this.createdAt,
      this.updatedAt,
      this.student,
      this.circle,
      final List<ExamAttemptCommitteeMemberDto>? committeeMembers,
      final List<ExamAttemptQuestionDto>? questions,
      this.evaluatedBy,
      this.breakdown,
      this.exam,
      this.examRange})
      : _committeeMembers = committeeMembers,
        _questions = questions;

  factory _$ExamAttemptDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExamAttemptDtoImplFromJson(json);

  @override
  final int id;
  @override
  final int examId;
  @override
  final int studentId;
  @override
  final int circleId;
  @override
  final String status;
  @override
  final String? examDate;
  @override
  final String? fullQuranCompletedAt;
  @override
  final int? stabilizationDays;
  @override
  final String? committeeNotes;
  @override
  final double? totalScore;
  @override
  final String? gradeLabel;
  @override
  final String? startedAt;
  @override
  final String? submittedAt;
  @override
  final String? reviewedAt;
  @override
  final int? evaluatedById;
  @override
  final int? lockVersion;
  @override
  final String? createdAt;
  @override
  final String? updatedAt;
  @override
  final ExamUserSummaryDto? student;
  @override
  final ExamCircleDto? circle;
  final List<ExamAttemptCommitteeMemberDto>? _committeeMembers;
  @override
  List<ExamAttemptCommitteeMemberDto>? get committeeMembers {
    final value = _committeeMembers;
    if (value == null) return null;
    if (_committeeMembers is EqualUnmodifiableListView)
      return _committeeMembers;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final List<ExamAttemptQuestionDto>? _questions;
  @override
  List<ExamAttemptQuestionDto>? get questions {
    final value = _questions;
    if (value == null) return null;
    if (_questions is EqualUnmodifiableListView) return _questions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  final ExamUserSummaryDto? evaluatedBy;
  @override
  final ExamAttemptBreakdownDto? breakdown;
  @override
  final ExamSummaryDto? exam;
  @override
  final ExamRangeDto? examRange;

  @override
  String toString() {
    return 'ExamAttemptDto(id: $id, examId: $examId, studentId: $studentId, circleId: $circleId, status: $status, examDate: $examDate, fullQuranCompletedAt: $fullQuranCompletedAt, stabilizationDays: $stabilizationDays, committeeNotes: $committeeNotes, totalScore: $totalScore, gradeLabel: $gradeLabel, startedAt: $startedAt, submittedAt: $submittedAt, reviewedAt: $reviewedAt, evaluatedById: $evaluatedById, lockVersion: $lockVersion, createdAt: $createdAt, updatedAt: $updatedAt, student: $student, circle: $circle, committeeMembers: $committeeMembers, questions: $questions, evaluatedBy: $evaluatedBy, breakdown: $breakdown, exam: $exam, examRange: $examRange)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExamAttemptDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.examId, examId) || other.examId == examId) &&
            (identical(other.studentId, studentId) ||
                other.studentId == studentId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.examDate, examDate) ||
                other.examDate == examDate) &&
            (identical(other.fullQuranCompletedAt, fullQuranCompletedAt) ||
                other.fullQuranCompletedAt == fullQuranCompletedAt) &&
            (identical(other.stabilizationDays, stabilizationDays) ||
                other.stabilizationDays == stabilizationDays) &&
            (identical(other.committeeNotes, committeeNotes) ||
                other.committeeNotes == committeeNotes) &&
            (identical(other.totalScore, totalScore) ||
                other.totalScore == totalScore) &&
            (identical(other.gradeLabel, gradeLabel) ||
                other.gradeLabel == gradeLabel) &&
            (identical(other.startedAt, startedAt) ||
                other.startedAt == startedAt) &&
            (identical(other.submittedAt, submittedAt) ||
                other.submittedAt == submittedAt) &&
            (identical(other.reviewedAt, reviewedAt) ||
                other.reviewedAt == reviewedAt) &&
            (identical(other.evaluatedById, evaluatedById) ||
                other.evaluatedById == evaluatedById) &&
            (identical(other.lockVersion, lockVersion) ||
                other.lockVersion == lockVersion) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.student, student) || other.student == student) &&
            (identical(other.circle, circle) || other.circle == circle) &&
            const DeepCollectionEquality()
                .equals(other._committeeMembers, _committeeMembers) &&
            const DeepCollectionEquality()
                .equals(other._questions, _questions) &&
            (identical(other.evaluatedBy, evaluatedBy) ||
                other.evaluatedBy == evaluatedBy) &&
            (identical(other.breakdown, breakdown) ||
                other.breakdown == breakdown) &&
            (identical(other.exam, exam) || other.exam == exam) &&
            (identical(other.examRange, examRange) ||
                other.examRange == examRange));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        examId,
        studentId,
        circleId,
        status,
        examDate,
        fullQuranCompletedAt,
        stabilizationDays,
        committeeNotes,
        totalScore,
        gradeLabel,
        startedAt,
        submittedAt,
        reviewedAt,
        evaluatedById,
        lockVersion,
        createdAt,
        updatedAt,
        student,
        circle,
        const DeepCollectionEquality().hash(_committeeMembers),
        const DeepCollectionEquality().hash(_questions),
        evaluatedBy,
        breakdown,
        exam,
        examRange
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ExamAttemptDtoImplCopyWith<_$ExamAttemptDtoImpl> get copyWith =>
      __$$ExamAttemptDtoImplCopyWithImpl<_$ExamAttemptDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExamAttemptDtoImplToJson(
      this,
    );
  }
}

abstract class _ExamAttemptDto implements ExamAttemptDto {
  const factory _ExamAttemptDto(
      {required final int id,
      required final int examId,
      required final int studentId,
      required final int circleId,
      required final String status,
      final String? examDate,
      final String? fullQuranCompletedAt,
      final int? stabilizationDays,
      final String? committeeNotes,
      final double? totalScore,
      final String? gradeLabel,
      final String? startedAt,
      final String? submittedAt,
      final String? reviewedAt,
      final int? evaluatedById,
      final int? lockVersion,
      final String? createdAt,
      final String? updatedAt,
      final ExamUserSummaryDto? student,
      final ExamCircleDto? circle,
      final List<ExamAttemptCommitteeMemberDto>? committeeMembers,
      final List<ExamAttemptQuestionDto>? questions,
      final ExamUserSummaryDto? evaluatedBy,
      final ExamAttemptBreakdownDto? breakdown,
      final ExamSummaryDto? exam,
      final ExamRangeDto? examRange}) = _$ExamAttemptDtoImpl;

  factory _ExamAttemptDto.fromJson(Map<String, dynamic> json) =
      _$ExamAttemptDtoImpl.fromJson;

  @override
  int get id;
  @override
  int get examId;
  @override
  int get studentId;
  @override
  int get circleId;
  @override
  String get status;
  @override
  String? get examDate;
  @override
  String? get fullQuranCompletedAt;
  @override
  int? get stabilizationDays;
  @override
  String? get committeeNotes;
  @override
  double? get totalScore;
  @override
  String? get gradeLabel;
  @override
  String? get startedAt;
  @override
  String? get submittedAt;
  @override
  String? get reviewedAt;
  @override
  int? get evaluatedById;
  @override
  int? get lockVersion;
  @override
  String? get createdAt;
  @override
  String? get updatedAt;
  @override
  ExamUserSummaryDto? get student;
  @override
  ExamCircleDto? get circle;
  @override
  List<ExamAttemptCommitteeMemberDto>? get committeeMembers;
  @override
  List<ExamAttemptQuestionDto>? get questions;
  @override
  ExamUserSummaryDto? get evaluatedBy;
  @override
  ExamAttemptBreakdownDto? get breakdown;
  @override
  ExamSummaryDto? get exam;
  @override
  ExamRangeDto? get examRange;
  @override
  @JsonKey(ignore: true)
  _$$ExamAttemptDtoImplCopyWith<_$ExamAttemptDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CreateExamRequestDto _$CreateExamRequestDtoFromJson(Map<String, dynamic> json) {
  return _CreateExamRequestDto.fromJson(json);
}

/// @nodoc
mixin _$CreateExamRequestDto {
  String get title => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String? get examBranch => throw _privateConstructorUsedError;
  double get maxScore => throw _privateConstructorUsedError;
  double get passScore => throw _privateConstructorUsedError;
  CreateExamCriteriaRequestDto? get criteria =>
      throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CreateExamRequestDtoCopyWith<CreateExamRequestDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateExamRequestDtoCopyWith<$Res> {
  factory $CreateExamRequestDtoCopyWith(CreateExamRequestDto value,
          $Res Function(CreateExamRequestDto) then) =
      _$CreateExamRequestDtoCopyWithImpl<$Res, CreateExamRequestDto>;
  @useResult
  $Res call(
      {String title,
      String type,
      String? examBranch,
      double maxScore,
      double passScore,
      CreateExamCriteriaRequestDto? criteria});

  $CreateExamCriteriaRequestDtoCopyWith<$Res>? get criteria;
}

/// @nodoc
class _$CreateExamRequestDtoCopyWithImpl<$Res,
        $Val extends CreateExamRequestDto>
    implements $CreateExamRequestDtoCopyWith<$Res> {
  _$CreateExamRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? title = null,
    Object? type = null,
    Object? examBranch = freezed,
    Object? maxScore = null,
    Object? passScore = null,
    Object? criteria = freezed,
  }) {
    return _then(_value.copyWith(
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      examBranch: freezed == examBranch
          ? _value.examBranch
          : examBranch // ignore: cast_nullable_to_non_nullable
              as String?,
      maxScore: null == maxScore
          ? _value.maxScore
          : maxScore // ignore: cast_nullable_to_non_nullable
              as double,
      passScore: null == passScore
          ? _value.passScore
          : passScore // ignore: cast_nullable_to_non_nullable
              as double,
      criteria: freezed == criteria
          ? _value.criteria
          : criteria // ignore: cast_nullable_to_non_nullable
              as CreateExamCriteriaRequestDto?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $CreateExamCriteriaRequestDtoCopyWith<$Res>? get criteria {
    if (_value.criteria == null) {
      return null;
    }

    return $CreateExamCriteriaRequestDtoCopyWith<$Res>(_value.criteria!,
        (value) {
      return _then(_value.copyWith(criteria: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$CreateExamRequestDtoImplCopyWith<$Res>
    implements $CreateExamRequestDtoCopyWith<$Res> {
  factory _$$CreateExamRequestDtoImplCopyWith(_$CreateExamRequestDtoImpl value,
          $Res Function(_$CreateExamRequestDtoImpl) then) =
      __$$CreateExamRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String title,
      String type,
      String? examBranch,
      double maxScore,
      double passScore,
      CreateExamCriteriaRequestDto? criteria});

  @override
  $CreateExamCriteriaRequestDtoCopyWith<$Res>? get criteria;
}

/// @nodoc
class __$$CreateExamRequestDtoImplCopyWithImpl<$Res>
    extends _$CreateExamRequestDtoCopyWithImpl<$Res, _$CreateExamRequestDtoImpl>
    implements _$$CreateExamRequestDtoImplCopyWith<$Res> {
  __$$CreateExamRequestDtoImplCopyWithImpl(_$CreateExamRequestDtoImpl _value,
      $Res Function(_$CreateExamRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? title = null,
    Object? type = null,
    Object? examBranch = freezed,
    Object? maxScore = null,
    Object? passScore = null,
    Object? criteria = freezed,
  }) {
    return _then(_$CreateExamRequestDtoImpl(
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      examBranch: freezed == examBranch
          ? _value.examBranch
          : examBranch // ignore: cast_nullable_to_non_nullable
              as String?,
      maxScore: null == maxScore
          ? _value.maxScore
          : maxScore // ignore: cast_nullable_to_non_nullable
              as double,
      passScore: null == passScore
          ? _value.passScore
          : passScore // ignore: cast_nullable_to_non_nullable
              as double,
      criteria: freezed == criteria
          ? _value.criteria
          : criteria // ignore: cast_nullable_to_non_nullable
              as CreateExamCriteriaRequestDto?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateExamRequestDtoImpl implements _CreateExamRequestDto {
  const _$CreateExamRequestDtoImpl(
      {required this.title,
      required this.type,
      this.examBranch,
      required this.maxScore,
      required this.passScore,
      this.criteria});

  factory _$CreateExamRequestDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$CreateExamRequestDtoImplFromJson(json);

  @override
  final String title;
  @override
  final String type;
  @override
  final String? examBranch;
  @override
  final double maxScore;
  @override
  final double passScore;
  @override
  final CreateExamCriteriaRequestDto? criteria;

  @override
  String toString() {
    return 'CreateExamRequestDto(title: $title, type: $type, examBranch: $examBranch, maxScore: $maxScore, passScore: $passScore, criteria: $criteria)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateExamRequestDtoImpl &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.examBranch, examBranch) ||
                other.examBranch == examBranch) &&
            (identical(other.maxScore, maxScore) ||
                other.maxScore == maxScore) &&
            (identical(other.passScore, passScore) ||
                other.passScore == passScore) &&
            (identical(other.criteria, criteria) ||
                other.criteria == criteria));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, title, type, examBranch, maxScore, passScore, criteria);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateExamRequestDtoImplCopyWith<_$CreateExamRequestDtoImpl>
      get copyWith =>
          __$$CreateExamRequestDtoImplCopyWithImpl<_$CreateExamRequestDtoImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateExamRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _CreateExamRequestDto implements CreateExamRequestDto {
  const factory _CreateExamRequestDto(
          {required final String title,
          required final String type,
          final String? examBranch,
          required final double maxScore,
          required final double passScore,
          final CreateExamCriteriaRequestDto? criteria}) =
      _$CreateExamRequestDtoImpl;

  factory _CreateExamRequestDto.fromJson(Map<String, dynamic> json) =
      _$CreateExamRequestDtoImpl.fromJson;

  @override
  String get title;
  @override
  String get type;
  @override
  String? get examBranch;
  @override
  double get maxScore;
  @override
  double get passScore;
  @override
  CreateExamCriteriaRequestDto? get criteria;
  @override
  @JsonKey(ignore: true)
  _$$CreateExamRequestDtoImplCopyWith<_$CreateExamRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

CreateExamCriteriaRequestDto _$CreateExamCriteriaRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _CreateExamCriteriaRequestDto.fromJson(json);
}

/// @nodoc
mixin _$CreateExamCriteriaRequestDto {
  double get memorizationScore => throw _privateConstructorUsedError;
  double get tajweedScore => throw _privateConstructorUsedError;
  double get theoreticalTajweedScore => throw _privateConstructorUsedError;
  double get performanceScore => throw _privateConstructorUsedError;
  double get promptingPenalty => throw _privateConstructorUsedError;
  double get remindingPenalty => throw _privateConstructorUsedError;
  double get tajweedPenalty => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CreateExamCriteriaRequestDtoCopyWith<CreateExamCriteriaRequestDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateExamCriteriaRequestDtoCopyWith<$Res> {
  factory $CreateExamCriteriaRequestDtoCopyWith(
          CreateExamCriteriaRequestDto value,
          $Res Function(CreateExamCriteriaRequestDto) then) =
      _$CreateExamCriteriaRequestDtoCopyWithImpl<$Res,
          CreateExamCriteriaRequestDto>;
  @useResult
  $Res call(
      {double memorizationScore,
      double tajweedScore,
      double theoreticalTajweedScore,
      double performanceScore,
      double promptingPenalty,
      double remindingPenalty,
      double tajweedPenalty});
}

/// @nodoc
class _$CreateExamCriteriaRequestDtoCopyWithImpl<$Res,
        $Val extends CreateExamCriteriaRequestDto>
    implements $CreateExamCriteriaRequestDtoCopyWith<$Res> {
  _$CreateExamCriteriaRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? memorizationScore = null,
    Object? tajweedScore = null,
    Object? theoreticalTajweedScore = null,
    Object? performanceScore = null,
    Object? promptingPenalty = null,
    Object? remindingPenalty = null,
    Object? tajweedPenalty = null,
  }) {
    return _then(_value.copyWith(
      memorizationScore: null == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedScore: null == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      theoreticalTajweedScore: null == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      performanceScore: null == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double,
      promptingPenalty: null == promptingPenalty
          ? _value.promptingPenalty
          : promptingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      remindingPenalty: null == remindingPenalty
          ? _value.remindingPenalty
          : remindingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedPenalty: null == tajweedPenalty
          ? _value.tajweedPenalty
          : tajweedPenalty // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateExamCriteriaRequestDtoImplCopyWith<$Res>
    implements $CreateExamCriteriaRequestDtoCopyWith<$Res> {
  factory _$$CreateExamCriteriaRequestDtoImplCopyWith(
          _$CreateExamCriteriaRequestDtoImpl value,
          $Res Function(_$CreateExamCriteriaRequestDtoImpl) then) =
      __$$CreateExamCriteriaRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {double memorizationScore,
      double tajweedScore,
      double theoreticalTajweedScore,
      double performanceScore,
      double promptingPenalty,
      double remindingPenalty,
      double tajweedPenalty});
}

/// @nodoc
class __$$CreateExamCriteriaRequestDtoImplCopyWithImpl<$Res>
    extends _$CreateExamCriteriaRequestDtoCopyWithImpl<$Res,
        _$CreateExamCriteriaRequestDtoImpl>
    implements _$$CreateExamCriteriaRequestDtoImplCopyWith<$Res> {
  __$$CreateExamCriteriaRequestDtoImplCopyWithImpl(
      _$CreateExamCriteriaRequestDtoImpl _value,
      $Res Function(_$CreateExamCriteriaRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? memorizationScore = null,
    Object? tajweedScore = null,
    Object? theoreticalTajweedScore = null,
    Object? performanceScore = null,
    Object? promptingPenalty = null,
    Object? remindingPenalty = null,
    Object? tajweedPenalty = null,
  }) {
    return _then(_$CreateExamCriteriaRequestDtoImpl(
      memorizationScore: null == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedScore: null == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      theoreticalTajweedScore: null == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      performanceScore: null == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double,
      promptingPenalty: null == promptingPenalty
          ? _value.promptingPenalty
          : promptingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      remindingPenalty: null == remindingPenalty
          ? _value.remindingPenalty
          : remindingPenalty // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedPenalty: null == tajweedPenalty
          ? _value.tajweedPenalty
          : tajweedPenalty // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateExamCriteriaRequestDtoImpl
    implements _CreateExamCriteriaRequestDto {
  const _$CreateExamCriteriaRequestDtoImpl(
      {required this.memorizationScore,
      required this.tajweedScore,
      required this.theoreticalTajweedScore,
      required this.performanceScore,
      required this.promptingPenalty,
      required this.remindingPenalty,
      required this.tajweedPenalty});

  factory _$CreateExamCriteriaRequestDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$CreateExamCriteriaRequestDtoImplFromJson(json);

  @override
  final double memorizationScore;
  @override
  final double tajweedScore;
  @override
  final double theoreticalTajweedScore;
  @override
  final double performanceScore;
  @override
  final double promptingPenalty;
  @override
  final double remindingPenalty;
  @override
  final double tajweedPenalty;

  @override
  String toString() {
    return 'CreateExamCriteriaRequestDto(memorizationScore: $memorizationScore, tajweedScore: $tajweedScore, theoreticalTajweedScore: $theoreticalTajweedScore, performanceScore: $performanceScore, promptingPenalty: $promptingPenalty, remindingPenalty: $remindingPenalty, tajweedPenalty: $tajweedPenalty)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateExamCriteriaRequestDtoImpl &&
            (identical(other.memorizationScore, memorizationScore) ||
                other.memorizationScore == memorizationScore) &&
            (identical(other.tajweedScore, tajweedScore) ||
                other.tajweedScore == tajweedScore) &&
            (identical(
                    other.theoreticalTajweedScore, theoreticalTajweedScore) ||
                other.theoreticalTajweedScore == theoreticalTajweedScore) &&
            (identical(other.performanceScore, performanceScore) ||
                other.performanceScore == performanceScore) &&
            (identical(other.promptingPenalty, promptingPenalty) ||
                other.promptingPenalty == promptingPenalty) &&
            (identical(other.remindingPenalty, remindingPenalty) ||
                other.remindingPenalty == remindingPenalty) &&
            (identical(other.tajweedPenalty, tajweedPenalty) ||
                other.tajweedPenalty == tajweedPenalty));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      memorizationScore,
      tajweedScore,
      theoreticalTajweedScore,
      performanceScore,
      promptingPenalty,
      remindingPenalty,
      tajweedPenalty);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateExamCriteriaRequestDtoImplCopyWith<
          _$CreateExamCriteriaRequestDtoImpl>
      get copyWith => __$$CreateExamCriteriaRequestDtoImplCopyWithImpl<
          _$CreateExamCriteriaRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateExamCriteriaRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _CreateExamCriteriaRequestDto
    implements CreateExamCriteriaRequestDto {
  const factory _CreateExamCriteriaRequestDto(
          {required final double memorizationScore,
          required final double tajweedScore,
          required final double theoreticalTajweedScore,
          required final double performanceScore,
          required final double promptingPenalty,
          required final double remindingPenalty,
          required final double tajweedPenalty}) =
      _$CreateExamCriteriaRequestDtoImpl;

  factory _CreateExamCriteriaRequestDto.fromJson(Map<String, dynamic> json) =
      _$CreateExamCriteriaRequestDtoImpl.fromJson;

  @override
  double get memorizationScore;
  @override
  double get tajweedScore;
  @override
  double get theoreticalTajweedScore;
  @override
  double get performanceScore;
  @override
  double get promptingPenalty;
  @override
  double get remindingPenalty;
  @override
  double get tajweedPenalty;
  @override
  @JsonKey(ignore: true)
  _$$CreateExamCriteriaRequestDtoImplCopyWith<
          _$CreateExamCriteriaRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

CreateExamAttemptRequestDto _$CreateExamAttemptRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _CreateExamAttemptRequestDto.fromJson(json);
}

/// @nodoc
mixin _$CreateExamAttemptRequestDto {
  int get studentId => throw _privateConstructorUsedError;
  int get circleId => throw _privateConstructorUsedError;
  String get examDate => throw _privateConstructorUsedError;
  String? get fullQuranCompletedAt => throw _privateConstructorUsedError;
  List<int> get committeeMemberIds => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CreateExamAttemptRequestDtoCopyWith<CreateExamAttemptRequestDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateExamAttemptRequestDtoCopyWith<$Res> {
  factory $CreateExamAttemptRequestDtoCopyWith(
          CreateExamAttemptRequestDto value,
          $Res Function(CreateExamAttemptRequestDto) then) =
      _$CreateExamAttemptRequestDtoCopyWithImpl<$Res,
          CreateExamAttemptRequestDto>;
  @useResult
  $Res call(
      {int studentId,
      int circleId,
      String examDate,
      String? fullQuranCompletedAt,
      List<int> committeeMemberIds});
}

/// @nodoc
class _$CreateExamAttemptRequestDtoCopyWithImpl<$Res,
        $Val extends CreateExamAttemptRequestDto>
    implements $CreateExamAttemptRequestDtoCopyWith<$Res> {
  _$CreateExamAttemptRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? circleId = null,
    Object? examDate = null,
    Object? fullQuranCompletedAt = freezed,
    Object? committeeMemberIds = null,
  }) {
    return _then(_value.copyWith(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      examDate: null == examDate
          ? _value.examDate
          : examDate // ignore: cast_nullable_to_non_nullable
              as String,
      fullQuranCompletedAt: freezed == fullQuranCompletedAt
          ? _value.fullQuranCompletedAt
          : fullQuranCompletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      committeeMemberIds: null == committeeMemberIds
          ? _value.committeeMemberIds
          : committeeMemberIds // ignore: cast_nullable_to_non_nullable
              as List<int>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateExamAttemptRequestDtoImplCopyWith<$Res>
    implements $CreateExamAttemptRequestDtoCopyWith<$Res> {
  factory _$$CreateExamAttemptRequestDtoImplCopyWith(
          _$CreateExamAttemptRequestDtoImpl value,
          $Res Function(_$CreateExamAttemptRequestDtoImpl) then) =
      __$$CreateExamAttemptRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int studentId,
      int circleId,
      String examDate,
      String? fullQuranCompletedAt,
      List<int> committeeMemberIds});
}

/// @nodoc
class __$$CreateExamAttemptRequestDtoImplCopyWithImpl<$Res>
    extends _$CreateExamAttemptRequestDtoCopyWithImpl<$Res,
        _$CreateExamAttemptRequestDtoImpl>
    implements _$$CreateExamAttemptRequestDtoImplCopyWith<$Res> {
  __$$CreateExamAttemptRequestDtoImplCopyWithImpl(
      _$CreateExamAttemptRequestDtoImpl _value,
      $Res Function(_$CreateExamAttemptRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? circleId = null,
    Object? examDate = null,
    Object? fullQuranCompletedAt = freezed,
    Object? committeeMemberIds = null,
  }) {
    return _then(_$CreateExamAttemptRequestDtoImpl(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      examDate: null == examDate
          ? _value.examDate
          : examDate // ignore: cast_nullable_to_non_nullable
              as String,
      fullQuranCompletedAt: freezed == fullQuranCompletedAt
          ? _value.fullQuranCompletedAt
          : fullQuranCompletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      committeeMemberIds: null == committeeMemberIds
          ? _value._committeeMemberIds
          : committeeMemberIds // ignore: cast_nullable_to_non_nullable
              as List<int>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateExamAttemptRequestDtoImpl
    implements _CreateExamAttemptRequestDto {
  const _$CreateExamAttemptRequestDtoImpl(
      {required this.studentId,
      required this.circleId,
      required this.examDate,
      this.fullQuranCompletedAt,
      required final List<int> committeeMemberIds})
      : _committeeMemberIds = committeeMemberIds;

  factory _$CreateExamAttemptRequestDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$CreateExamAttemptRequestDtoImplFromJson(json);

  @override
  final int studentId;
  @override
  final int circleId;
  @override
  final String examDate;
  @override
  final String? fullQuranCompletedAt;
  final List<int> _committeeMemberIds;
  @override
  List<int> get committeeMemberIds {
    if (_committeeMemberIds is EqualUnmodifiableListView)
      return _committeeMemberIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_committeeMemberIds);
  }

  @override
  String toString() {
    return 'CreateExamAttemptRequestDto(studentId: $studentId, circleId: $circleId, examDate: $examDate, fullQuranCompletedAt: $fullQuranCompletedAt, committeeMemberIds: $committeeMemberIds)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateExamAttemptRequestDtoImpl &&
            (identical(other.studentId, studentId) ||
                other.studentId == studentId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.examDate, examDate) ||
                other.examDate == examDate) &&
            (identical(other.fullQuranCompletedAt, fullQuranCompletedAt) ||
                other.fullQuranCompletedAt == fullQuranCompletedAt) &&
            const DeepCollectionEquality()
                .equals(other._committeeMemberIds, _committeeMemberIds));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      studentId,
      circleId,
      examDate,
      fullQuranCompletedAt,
      const DeepCollectionEquality().hash(_committeeMemberIds));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateExamAttemptRequestDtoImplCopyWith<_$CreateExamAttemptRequestDtoImpl>
      get copyWith => __$$CreateExamAttemptRequestDtoImplCopyWithImpl<
          _$CreateExamAttemptRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateExamAttemptRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _CreateExamAttemptRequestDto
    implements CreateExamAttemptRequestDto {
  const factory _CreateExamAttemptRequestDto(
          {required final int studentId,
          required final int circleId,
          required final String examDate,
          final String? fullQuranCompletedAt,
          required final List<int> committeeMemberIds}) =
      _$CreateExamAttemptRequestDtoImpl;

  factory _CreateExamAttemptRequestDto.fromJson(Map<String, dynamic> json) =
      _$CreateExamAttemptRequestDtoImpl.fromJson;

  @override
  int get studentId;
  @override
  int get circleId;
  @override
  String get examDate;
  @override
  String? get fullQuranCompletedAt;
  @override
  List<int> get committeeMemberIds;
  @override
  @JsonKey(ignore: true)
  _$$CreateExamAttemptRequestDtoImplCopyWith<_$CreateExamAttemptRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

UpdateAttemptCommitteeRequestDto _$UpdateAttemptCommitteeRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _UpdateAttemptCommitteeRequestDto.fromJson(json);
}

/// @nodoc
mixin _$UpdateAttemptCommitteeRequestDto {
  String? get examDate => throw _privateConstructorUsedError;
  String? get fullQuranCompletedAt => throw _privateConstructorUsedError;
  List<int>? get committeeMemberIds => throw _privateConstructorUsedError;
  int? get lockVersion => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $UpdateAttemptCommitteeRequestDtoCopyWith<UpdateAttemptCommitteeRequestDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UpdateAttemptCommitteeRequestDtoCopyWith<$Res> {
  factory $UpdateAttemptCommitteeRequestDtoCopyWith(
          UpdateAttemptCommitteeRequestDto value,
          $Res Function(UpdateAttemptCommitteeRequestDto) then) =
      _$UpdateAttemptCommitteeRequestDtoCopyWithImpl<$Res,
          UpdateAttemptCommitteeRequestDto>;
  @useResult
  $Res call(
      {String? examDate,
      String? fullQuranCompletedAt,
      List<int>? committeeMemberIds,
      int? lockVersion});
}

/// @nodoc
class _$UpdateAttemptCommitteeRequestDtoCopyWithImpl<$Res,
        $Val extends UpdateAttemptCommitteeRequestDto>
    implements $UpdateAttemptCommitteeRequestDtoCopyWith<$Res> {
  _$UpdateAttemptCommitteeRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? examDate = freezed,
    Object? fullQuranCompletedAt = freezed,
    Object? committeeMemberIds = freezed,
    Object? lockVersion = freezed,
  }) {
    return _then(_value.copyWith(
      examDate: freezed == examDate
          ? _value.examDate
          : examDate // ignore: cast_nullable_to_non_nullable
              as String?,
      fullQuranCompletedAt: freezed == fullQuranCompletedAt
          ? _value.fullQuranCompletedAt
          : fullQuranCompletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      committeeMemberIds: freezed == committeeMemberIds
          ? _value.committeeMemberIds
          : committeeMemberIds // ignore: cast_nullable_to_non_nullable
              as List<int>?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UpdateAttemptCommitteeRequestDtoImplCopyWith<$Res>
    implements $UpdateAttemptCommitteeRequestDtoCopyWith<$Res> {
  factory _$$UpdateAttemptCommitteeRequestDtoImplCopyWith(
          _$UpdateAttemptCommitteeRequestDtoImpl value,
          $Res Function(_$UpdateAttemptCommitteeRequestDtoImpl) then) =
      __$$UpdateAttemptCommitteeRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String? examDate,
      String? fullQuranCompletedAt,
      List<int>? committeeMemberIds,
      int? lockVersion});
}

/// @nodoc
class __$$UpdateAttemptCommitteeRequestDtoImplCopyWithImpl<$Res>
    extends _$UpdateAttemptCommitteeRequestDtoCopyWithImpl<$Res,
        _$UpdateAttemptCommitteeRequestDtoImpl>
    implements _$$UpdateAttemptCommitteeRequestDtoImplCopyWith<$Res> {
  __$$UpdateAttemptCommitteeRequestDtoImplCopyWithImpl(
      _$UpdateAttemptCommitteeRequestDtoImpl _value,
      $Res Function(_$UpdateAttemptCommitteeRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? examDate = freezed,
    Object? fullQuranCompletedAt = freezed,
    Object? committeeMemberIds = freezed,
    Object? lockVersion = freezed,
  }) {
    return _then(_$UpdateAttemptCommitteeRequestDtoImpl(
      examDate: freezed == examDate
          ? _value.examDate
          : examDate // ignore: cast_nullable_to_non_nullable
              as String?,
      fullQuranCompletedAt: freezed == fullQuranCompletedAt
          ? _value.fullQuranCompletedAt
          : fullQuranCompletedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      committeeMemberIds: freezed == committeeMemberIds
          ? _value._committeeMemberIds
          : committeeMemberIds // ignore: cast_nullable_to_non_nullable
              as List<int>?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UpdateAttemptCommitteeRequestDtoImpl
    implements _UpdateAttemptCommitteeRequestDto {
  const _$UpdateAttemptCommitteeRequestDtoImpl(
      {this.examDate,
      this.fullQuranCompletedAt,
      final List<int>? committeeMemberIds,
      this.lockVersion})
      : _committeeMemberIds = committeeMemberIds;

  factory _$UpdateAttemptCommitteeRequestDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$UpdateAttemptCommitteeRequestDtoImplFromJson(json);

  @override
  final String? examDate;
  @override
  final String? fullQuranCompletedAt;
  final List<int>? _committeeMemberIds;
  @override
  List<int>? get committeeMemberIds {
    final value = _committeeMemberIds;
    if (value == null) return null;
    if (_committeeMemberIds is EqualUnmodifiableListView)
      return _committeeMemberIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  final int? lockVersion;

  @override
  String toString() {
    return 'UpdateAttemptCommitteeRequestDto(examDate: $examDate, fullQuranCompletedAt: $fullQuranCompletedAt, committeeMemberIds: $committeeMemberIds, lockVersion: $lockVersion)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateAttemptCommitteeRequestDtoImpl &&
            (identical(other.examDate, examDate) ||
                other.examDate == examDate) &&
            (identical(other.fullQuranCompletedAt, fullQuranCompletedAt) ||
                other.fullQuranCompletedAt == fullQuranCompletedAt) &&
            const DeepCollectionEquality()
                .equals(other._committeeMemberIds, _committeeMemberIds) &&
            (identical(other.lockVersion, lockVersion) ||
                other.lockVersion == lockVersion));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, examDate, fullQuranCompletedAt,
      const DeepCollectionEquality().hash(_committeeMemberIds), lockVersion);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateAttemptCommitteeRequestDtoImplCopyWith<
          _$UpdateAttemptCommitteeRequestDtoImpl>
      get copyWith => __$$UpdateAttemptCommitteeRequestDtoImplCopyWithImpl<
          _$UpdateAttemptCommitteeRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UpdateAttemptCommitteeRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _UpdateAttemptCommitteeRequestDto
    implements UpdateAttemptCommitteeRequestDto {
  const factory _UpdateAttemptCommitteeRequestDto(
      {final String? examDate,
      final String? fullQuranCompletedAt,
      final List<int>? committeeMemberIds,
      final int? lockVersion}) = _$UpdateAttemptCommitteeRequestDtoImpl;

  factory _UpdateAttemptCommitteeRequestDto.fromJson(
          Map<String, dynamic> json) =
      _$UpdateAttemptCommitteeRequestDtoImpl.fromJson;

  @override
  String? get examDate;
  @override
  String? get fullQuranCompletedAt;
  @override
  List<int>? get committeeMemberIds;
  @override
  int? get lockVersion;
  @override
  @JsonKey(ignore: true)
  _$$UpdateAttemptCommitteeRequestDtoImplCopyWith<
          _$UpdateAttemptCommitteeRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

GenerateAttemptQuestionsRequestDto _$GenerateAttemptQuestionsRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _GenerateAttemptQuestionsRequestDto.fromJson(json);
}

/// @nodoc
mixin _$GenerateAttemptQuestionsRequestDto {
  int? get count => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $GenerateAttemptQuestionsRequestDtoCopyWith<
          GenerateAttemptQuestionsRequestDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GenerateAttemptQuestionsRequestDtoCopyWith<$Res> {
  factory $GenerateAttemptQuestionsRequestDtoCopyWith(
          GenerateAttemptQuestionsRequestDto value,
          $Res Function(GenerateAttemptQuestionsRequestDto) then) =
      _$GenerateAttemptQuestionsRequestDtoCopyWithImpl<$Res,
          GenerateAttemptQuestionsRequestDto>;
  @useResult
  $Res call({int? count});
}

/// @nodoc
class _$GenerateAttemptQuestionsRequestDtoCopyWithImpl<$Res,
        $Val extends GenerateAttemptQuestionsRequestDto>
    implements $GenerateAttemptQuestionsRequestDtoCopyWith<$Res> {
  _$GenerateAttemptQuestionsRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? count = freezed,
  }) {
    return _then(_value.copyWith(
      count: freezed == count
          ? _value.count
          : count // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GenerateAttemptQuestionsRequestDtoImplCopyWith<$Res>
    implements $GenerateAttemptQuestionsRequestDtoCopyWith<$Res> {
  factory _$$GenerateAttemptQuestionsRequestDtoImplCopyWith(
          _$GenerateAttemptQuestionsRequestDtoImpl value,
          $Res Function(_$GenerateAttemptQuestionsRequestDtoImpl) then) =
      __$$GenerateAttemptQuestionsRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int? count});
}

/// @nodoc
class __$$GenerateAttemptQuestionsRequestDtoImplCopyWithImpl<$Res>
    extends _$GenerateAttemptQuestionsRequestDtoCopyWithImpl<$Res,
        _$GenerateAttemptQuestionsRequestDtoImpl>
    implements _$$GenerateAttemptQuestionsRequestDtoImplCopyWith<$Res> {
  __$$GenerateAttemptQuestionsRequestDtoImplCopyWithImpl(
      _$GenerateAttemptQuestionsRequestDtoImpl _value,
      $Res Function(_$GenerateAttemptQuestionsRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? count = freezed,
  }) {
    return _then(_$GenerateAttemptQuestionsRequestDtoImpl(
      count: freezed == count
          ? _value.count
          : count // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GenerateAttemptQuestionsRequestDtoImpl
    implements _GenerateAttemptQuestionsRequestDto {
  const _$GenerateAttemptQuestionsRequestDtoImpl({this.count});

  factory _$GenerateAttemptQuestionsRequestDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$GenerateAttemptQuestionsRequestDtoImplFromJson(json);

  @override
  final int? count;

  @override
  String toString() {
    return 'GenerateAttemptQuestionsRequestDto(count: $count)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GenerateAttemptQuestionsRequestDtoImpl &&
            (identical(other.count, count) || other.count == count));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, count);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GenerateAttemptQuestionsRequestDtoImplCopyWith<
          _$GenerateAttemptQuestionsRequestDtoImpl>
      get copyWith => __$$GenerateAttemptQuestionsRequestDtoImplCopyWithImpl<
          _$GenerateAttemptQuestionsRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GenerateAttemptQuestionsRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _GenerateAttemptQuestionsRequestDto
    implements GenerateAttemptQuestionsRequestDto {
  const factory _GenerateAttemptQuestionsRequestDto({final int? count}) =
      _$GenerateAttemptQuestionsRequestDtoImpl;

  factory _GenerateAttemptQuestionsRequestDto.fromJson(
          Map<String, dynamic> json) =
      _$GenerateAttemptQuestionsRequestDtoImpl.fromJson;

  @override
  int? get count;
  @override
  @JsonKey(ignore: true)
  _$$GenerateAttemptQuestionsRequestDtoImplCopyWith<
          _$GenerateAttemptQuestionsRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ScoreAttemptQuestionRequestDto _$ScoreAttemptQuestionRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _ScoreAttemptQuestionRequestDto.fromJson(json);
}

/// @nodoc
mixin _$ScoreAttemptQuestionRequestDto {
  int get id => throw _privateConstructorUsedError;
  double get promptingDeductions => throw _privateConstructorUsedError;
  double get remindingDeductions => throw _privateConstructorUsedError;
  double get tajweedDeductions => throw _privateConstructorUsedError;
  bool get isEvaluated => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ScoreAttemptQuestionRequestDtoCopyWith<ScoreAttemptQuestionRequestDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ScoreAttemptQuestionRequestDtoCopyWith<$Res> {
  factory $ScoreAttemptQuestionRequestDtoCopyWith(
          ScoreAttemptQuestionRequestDto value,
          $Res Function(ScoreAttemptQuestionRequestDto) then) =
      _$ScoreAttemptQuestionRequestDtoCopyWithImpl<$Res,
          ScoreAttemptQuestionRequestDto>;
  @useResult
  $Res call(
      {int id,
      double promptingDeductions,
      double remindingDeductions,
      double tajweedDeductions,
      bool isEvaluated});
}

/// @nodoc
class _$ScoreAttemptQuestionRequestDtoCopyWithImpl<$Res,
        $Val extends ScoreAttemptQuestionRequestDto>
    implements $ScoreAttemptQuestionRequestDtoCopyWith<$Res> {
  _$ScoreAttemptQuestionRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? promptingDeductions = null,
    Object? remindingDeductions = null,
    Object? tajweedDeductions = null,
    Object? isEvaluated = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      promptingDeductions: null == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      remindingDeductions: null == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedDeductions: null == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      isEvaluated: null == isEvaluated
          ? _value.isEvaluated
          : isEvaluated // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ScoreAttemptQuestionRequestDtoImplCopyWith<$Res>
    implements $ScoreAttemptQuestionRequestDtoCopyWith<$Res> {
  factory _$$ScoreAttemptQuestionRequestDtoImplCopyWith(
          _$ScoreAttemptQuestionRequestDtoImpl value,
          $Res Function(_$ScoreAttemptQuestionRequestDtoImpl) then) =
      __$$ScoreAttemptQuestionRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      double promptingDeductions,
      double remindingDeductions,
      double tajweedDeductions,
      bool isEvaluated});
}

/// @nodoc
class __$$ScoreAttemptQuestionRequestDtoImplCopyWithImpl<$Res>
    extends _$ScoreAttemptQuestionRequestDtoCopyWithImpl<$Res,
        _$ScoreAttemptQuestionRequestDtoImpl>
    implements _$$ScoreAttemptQuestionRequestDtoImplCopyWith<$Res> {
  __$$ScoreAttemptQuestionRequestDtoImplCopyWithImpl(
      _$ScoreAttemptQuestionRequestDtoImpl _value,
      $Res Function(_$ScoreAttemptQuestionRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? promptingDeductions = null,
    Object? remindingDeductions = null,
    Object? tajweedDeductions = null,
    Object? isEvaluated = null,
  }) {
    return _then(_$ScoreAttemptQuestionRequestDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      promptingDeductions: null == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      remindingDeductions: null == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedDeductions: null == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      isEvaluated: null == isEvaluated
          ? _value.isEvaluated
          : isEvaluated // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ScoreAttemptQuestionRequestDtoImpl
    implements _ScoreAttemptQuestionRequestDto {
  const _$ScoreAttemptQuestionRequestDtoImpl(
      {required this.id,
      required this.promptingDeductions,
      required this.remindingDeductions,
      required this.tajweedDeductions,
      required this.isEvaluated});

  factory _$ScoreAttemptQuestionRequestDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$ScoreAttemptQuestionRequestDtoImplFromJson(json);

  @override
  final int id;
  @override
  final double promptingDeductions;
  @override
  final double remindingDeductions;
  @override
  final double tajweedDeductions;
  @override
  final bool isEvaluated;

  @override
  String toString() {
    return 'ScoreAttemptQuestionRequestDto(id: $id, promptingDeductions: $promptingDeductions, remindingDeductions: $remindingDeductions, tajweedDeductions: $tajweedDeductions, isEvaluated: $isEvaluated)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ScoreAttemptQuestionRequestDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.promptingDeductions, promptingDeductions) ||
                other.promptingDeductions == promptingDeductions) &&
            (identical(other.remindingDeductions, remindingDeductions) ||
                other.remindingDeductions == remindingDeductions) &&
            (identical(other.tajweedDeductions, tajweedDeductions) ||
                other.tajweedDeductions == tajweedDeductions) &&
            (identical(other.isEvaluated, isEvaluated) ||
                other.isEvaluated == isEvaluated));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, promptingDeductions,
      remindingDeductions, tajweedDeductions, isEvaluated);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ScoreAttemptQuestionRequestDtoImplCopyWith<
          _$ScoreAttemptQuestionRequestDtoImpl>
      get copyWith => __$$ScoreAttemptQuestionRequestDtoImplCopyWithImpl<
          _$ScoreAttemptQuestionRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ScoreAttemptQuestionRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _ScoreAttemptQuestionRequestDto
    implements ScoreAttemptQuestionRequestDto {
  const factory _ScoreAttemptQuestionRequestDto(
      {required final int id,
      required final double promptingDeductions,
      required final double remindingDeductions,
      required final double tajweedDeductions,
      required final bool isEvaluated}) = _$ScoreAttemptQuestionRequestDtoImpl;

  factory _ScoreAttemptQuestionRequestDto.fromJson(Map<String, dynamic> json) =
      _$ScoreAttemptQuestionRequestDtoImpl.fromJson;

  @override
  int get id;
  @override
  double get promptingDeductions;
  @override
  double get remindingDeductions;
  @override
  double get tajweedDeductions;
  @override
  bool get isEvaluated;
  @override
  @JsonKey(ignore: true)
  _$$ScoreAttemptQuestionRequestDtoImplCopyWith<
          _$ScoreAttemptQuestionRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ScoreAttemptRequestDto _$ScoreAttemptRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _ScoreAttemptRequestDto.fromJson(json);
}

/// @nodoc
mixin _$ScoreAttemptRequestDto {
  double get memorizationScore => throw _privateConstructorUsedError;
  double get tajweedScore => throw _privateConstructorUsedError;
  double get theoreticalTajweedScore => throw _privateConstructorUsedError;
  double get performanceScore => throw _privateConstructorUsedError;
  double get promptingDeductions => throw _privateConstructorUsedError;
  double get remindingDeductions => throw _privateConstructorUsedError;
  double get tajweedDeductions => throw _privateConstructorUsedError;
  String? get committeeNotes => throw _privateConstructorUsedError;
  String? get strengthNotes => throw _privateConstructorUsedError;
  String? get weaknessNotes => throw _privateConstructorUsedError;
  List<ScoreAttemptQuestionRequestDto>? get questions =>
      throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ScoreAttemptRequestDtoCopyWith<ScoreAttemptRequestDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ScoreAttemptRequestDtoCopyWith<$Res> {
  factory $ScoreAttemptRequestDtoCopyWith(ScoreAttemptRequestDto value,
          $Res Function(ScoreAttemptRequestDto) then) =
      _$ScoreAttemptRequestDtoCopyWithImpl<$Res, ScoreAttemptRequestDto>;
  @useResult
  $Res call(
      {double memorizationScore,
      double tajweedScore,
      double theoreticalTajweedScore,
      double performanceScore,
      double promptingDeductions,
      double remindingDeductions,
      double tajweedDeductions,
      String? committeeNotes,
      String? strengthNotes,
      String? weaknessNotes,
      List<ScoreAttemptQuestionRequestDto>? questions});
}

/// @nodoc
class _$ScoreAttemptRequestDtoCopyWithImpl<$Res,
        $Val extends ScoreAttemptRequestDto>
    implements $ScoreAttemptRequestDtoCopyWith<$Res> {
  _$ScoreAttemptRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? memorizationScore = null,
    Object? tajweedScore = null,
    Object? theoreticalTajweedScore = null,
    Object? performanceScore = null,
    Object? promptingDeductions = null,
    Object? remindingDeductions = null,
    Object? tajweedDeductions = null,
    Object? committeeNotes = freezed,
    Object? strengthNotes = freezed,
    Object? weaknessNotes = freezed,
    Object? questions = freezed,
  }) {
    return _then(_value.copyWith(
      memorizationScore: null == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedScore: null == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      theoreticalTajweedScore: null == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      performanceScore: null == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double,
      promptingDeductions: null == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      remindingDeductions: null == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedDeductions: null == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      committeeNotes: freezed == committeeNotes
          ? _value.committeeNotes
          : committeeNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      strengthNotes: freezed == strengthNotes
          ? _value.strengthNotes
          : strengthNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      weaknessNotes: freezed == weaknessNotes
          ? _value.weaknessNotes
          : weaknessNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      questions: freezed == questions
          ? _value.questions
          : questions // ignore: cast_nullable_to_non_nullable
              as List<ScoreAttemptQuestionRequestDto>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ScoreAttemptRequestDtoImplCopyWith<$Res>
    implements $ScoreAttemptRequestDtoCopyWith<$Res> {
  factory _$$ScoreAttemptRequestDtoImplCopyWith(
          _$ScoreAttemptRequestDtoImpl value,
          $Res Function(_$ScoreAttemptRequestDtoImpl) then) =
      __$$ScoreAttemptRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {double memorizationScore,
      double tajweedScore,
      double theoreticalTajweedScore,
      double performanceScore,
      double promptingDeductions,
      double remindingDeductions,
      double tajweedDeductions,
      String? committeeNotes,
      String? strengthNotes,
      String? weaknessNotes,
      List<ScoreAttemptQuestionRequestDto>? questions});
}

/// @nodoc
class __$$ScoreAttemptRequestDtoImplCopyWithImpl<$Res>
    extends _$ScoreAttemptRequestDtoCopyWithImpl<$Res,
        _$ScoreAttemptRequestDtoImpl>
    implements _$$ScoreAttemptRequestDtoImplCopyWith<$Res> {
  __$$ScoreAttemptRequestDtoImplCopyWithImpl(
      _$ScoreAttemptRequestDtoImpl _value,
      $Res Function(_$ScoreAttemptRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? memorizationScore = null,
    Object? tajweedScore = null,
    Object? theoreticalTajweedScore = null,
    Object? performanceScore = null,
    Object? promptingDeductions = null,
    Object? remindingDeductions = null,
    Object? tajweedDeductions = null,
    Object? committeeNotes = freezed,
    Object? strengthNotes = freezed,
    Object? weaknessNotes = freezed,
    Object? questions = freezed,
  }) {
    return _then(_$ScoreAttemptRequestDtoImpl(
      memorizationScore: null == memorizationScore
          ? _value.memorizationScore
          : memorizationScore // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedScore: null == tajweedScore
          ? _value.tajweedScore
          : tajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      theoreticalTajweedScore: null == theoreticalTajweedScore
          ? _value.theoreticalTajweedScore
          : theoreticalTajweedScore // ignore: cast_nullable_to_non_nullable
              as double,
      performanceScore: null == performanceScore
          ? _value.performanceScore
          : performanceScore // ignore: cast_nullable_to_non_nullable
              as double,
      promptingDeductions: null == promptingDeductions
          ? _value.promptingDeductions
          : promptingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      remindingDeductions: null == remindingDeductions
          ? _value.remindingDeductions
          : remindingDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      tajweedDeductions: null == tajweedDeductions
          ? _value.tajweedDeductions
          : tajweedDeductions // ignore: cast_nullable_to_non_nullable
              as double,
      committeeNotes: freezed == committeeNotes
          ? _value.committeeNotes
          : committeeNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      strengthNotes: freezed == strengthNotes
          ? _value.strengthNotes
          : strengthNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      weaknessNotes: freezed == weaknessNotes
          ? _value.weaknessNotes
          : weaknessNotes // ignore: cast_nullable_to_non_nullable
              as String?,
      questions: freezed == questions
          ? _value._questions
          : questions // ignore: cast_nullable_to_non_nullable
              as List<ScoreAttemptQuestionRequestDto>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ScoreAttemptRequestDtoImpl implements _ScoreAttemptRequestDto {
  const _$ScoreAttemptRequestDtoImpl(
      {required this.memorizationScore,
      required this.tajweedScore,
      required this.theoreticalTajweedScore,
      required this.performanceScore,
      required this.promptingDeductions,
      required this.remindingDeductions,
      required this.tajweedDeductions,
      this.committeeNotes,
      this.strengthNotes,
      this.weaknessNotes,
      final List<ScoreAttemptQuestionRequestDto>? questions})
      : _questions = questions;

  factory _$ScoreAttemptRequestDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ScoreAttemptRequestDtoImplFromJson(json);

  @override
  final double memorizationScore;
  @override
  final double tajweedScore;
  @override
  final double theoreticalTajweedScore;
  @override
  final double performanceScore;
  @override
  final double promptingDeductions;
  @override
  final double remindingDeductions;
  @override
  final double tajweedDeductions;
  @override
  final String? committeeNotes;
  @override
  final String? strengthNotes;
  @override
  final String? weaknessNotes;
  final List<ScoreAttemptQuestionRequestDto>? _questions;
  @override
  List<ScoreAttemptQuestionRequestDto>? get questions {
    final value = _questions;
    if (value == null) return null;
    if (_questions is EqualUnmodifiableListView) return _questions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  String toString() {
    return 'ScoreAttemptRequestDto(memorizationScore: $memorizationScore, tajweedScore: $tajweedScore, theoreticalTajweedScore: $theoreticalTajweedScore, performanceScore: $performanceScore, promptingDeductions: $promptingDeductions, remindingDeductions: $remindingDeductions, tajweedDeductions: $tajweedDeductions, committeeNotes: $committeeNotes, strengthNotes: $strengthNotes, weaknessNotes: $weaknessNotes, questions: $questions)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ScoreAttemptRequestDtoImpl &&
            (identical(other.memorizationScore, memorizationScore) ||
                other.memorizationScore == memorizationScore) &&
            (identical(other.tajweedScore, tajweedScore) ||
                other.tajweedScore == tajweedScore) &&
            (identical(
                    other.theoreticalTajweedScore, theoreticalTajweedScore) ||
                other.theoreticalTajweedScore == theoreticalTajweedScore) &&
            (identical(other.performanceScore, performanceScore) ||
                other.performanceScore == performanceScore) &&
            (identical(other.promptingDeductions, promptingDeductions) ||
                other.promptingDeductions == promptingDeductions) &&
            (identical(other.remindingDeductions, remindingDeductions) ||
                other.remindingDeductions == remindingDeductions) &&
            (identical(other.tajweedDeductions, tajweedDeductions) ||
                other.tajweedDeductions == tajweedDeductions) &&
            (identical(other.committeeNotes, committeeNotes) ||
                other.committeeNotes == committeeNotes) &&
            (identical(other.strengthNotes, strengthNotes) ||
                other.strengthNotes == strengthNotes) &&
            (identical(other.weaknessNotes, weaknessNotes) ||
                other.weaknessNotes == weaknessNotes) &&
            const DeepCollectionEquality()
                .equals(other._questions, _questions));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      memorizationScore,
      tajweedScore,
      theoreticalTajweedScore,
      performanceScore,
      promptingDeductions,
      remindingDeductions,
      tajweedDeductions,
      committeeNotes,
      strengthNotes,
      weaknessNotes,
      const DeepCollectionEquality().hash(_questions));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ScoreAttemptRequestDtoImplCopyWith<_$ScoreAttemptRequestDtoImpl>
      get copyWith => __$$ScoreAttemptRequestDtoImplCopyWithImpl<
          _$ScoreAttemptRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ScoreAttemptRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _ScoreAttemptRequestDto implements ScoreAttemptRequestDto {
  const factory _ScoreAttemptRequestDto(
          {required final double memorizationScore,
          required final double tajweedScore,
          required final double theoreticalTajweedScore,
          required final double performanceScore,
          required final double promptingDeductions,
          required final double remindingDeductions,
          required final double tajweedDeductions,
          final String? committeeNotes,
          final String? strengthNotes,
          final String? weaknessNotes,
          final List<ScoreAttemptQuestionRequestDto>? questions}) =
      _$ScoreAttemptRequestDtoImpl;

  factory _ScoreAttemptRequestDto.fromJson(Map<String, dynamic> json) =
      _$ScoreAttemptRequestDtoImpl.fromJson;

  @override
  double get memorizationScore;
  @override
  double get tajweedScore;
  @override
  double get theoreticalTajweedScore;
  @override
  double get performanceScore;
  @override
  double get promptingDeductions;
  @override
  double get remindingDeductions;
  @override
  double get tajweedDeductions;
  @override
  String? get committeeNotes;
  @override
  String? get strengthNotes;
  @override
  String? get weaknessNotes;
  @override
  List<ScoreAttemptQuestionRequestDto>? get questions;
  @override
  @JsonKey(ignore: true)
  _$$ScoreAttemptRequestDtoImplCopyWith<_$ScoreAttemptRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ShareAttemptResultResponseDto _$ShareAttemptResultResponseDtoFromJson(
    Map<String, dynamic> json) {
  return _ShareAttemptResultResponseDto.fromJson(json);
}

/// @nodoc
mixin _$ShareAttemptResultResponseDto {
  int get createdCount => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ShareAttemptResultResponseDtoCopyWith<ShareAttemptResultResponseDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ShareAttemptResultResponseDtoCopyWith<$Res> {
  factory $ShareAttemptResultResponseDtoCopyWith(
          ShareAttemptResultResponseDto value,
          $Res Function(ShareAttemptResultResponseDto) then) =
      _$ShareAttemptResultResponseDtoCopyWithImpl<$Res,
          ShareAttemptResultResponseDto>;
  @useResult
  $Res call({int createdCount});
}

/// @nodoc
class _$ShareAttemptResultResponseDtoCopyWithImpl<$Res,
        $Val extends ShareAttemptResultResponseDto>
    implements $ShareAttemptResultResponseDtoCopyWith<$Res> {
  _$ShareAttemptResultResponseDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? createdCount = null,
  }) {
    return _then(_value.copyWith(
      createdCount: null == createdCount
          ? _value.createdCount
          : createdCount // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ShareAttemptResultResponseDtoImplCopyWith<$Res>
    implements $ShareAttemptResultResponseDtoCopyWith<$Res> {
  factory _$$ShareAttemptResultResponseDtoImplCopyWith(
          _$ShareAttemptResultResponseDtoImpl value,
          $Res Function(_$ShareAttemptResultResponseDtoImpl) then) =
      __$$ShareAttemptResultResponseDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int createdCount});
}

/// @nodoc
class __$$ShareAttemptResultResponseDtoImplCopyWithImpl<$Res>
    extends _$ShareAttemptResultResponseDtoCopyWithImpl<$Res,
        _$ShareAttemptResultResponseDtoImpl>
    implements _$$ShareAttemptResultResponseDtoImplCopyWith<$Res> {
  __$$ShareAttemptResultResponseDtoImplCopyWithImpl(
      _$ShareAttemptResultResponseDtoImpl _value,
      $Res Function(_$ShareAttemptResultResponseDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? createdCount = null,
  }) {
    return _then(_$ShareAttemptResultResponseDtoImpl(
      createdCount: null == createdCount
          ? _value.createdCount
          : createdCount // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ShareAttemptResultResponseDtoImpl
    implements _ShareAttemptResultResponseDto {
  const _$ShareAttemptResultResponseDtoImpl({required this.createdCount});

  factory _$ShareAttemptResultResponseDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$ShareAttemptResultResponseDtoImplFromJson(json);

  @override
  final int createdCount;

  @override
  String toString() {
    return 'ShareAttemptResultResponseDto(createdCount: $createdCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ShareAttemptResultResponseDtoImpl &&
            (identical(other.createdCount, createdCount) ||
                other.createdCount == createdCount));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, createdCount);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ShareAttemptResultResponseDtoImplCopyWith<
          _$ShareAttemptResultResponseDtoImpl>
      get copyWith => __$$ShareAttemptResultResponseDtoImplCopyWithImpl<
          _$ShareAttemptResultResponseDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ShareAttemptResultResponseDtoImplToJson(
      this,
    );
  }
}

abstract class _ShareAttemptResultResponseDto
    implements ShareAttemptResultResponseDto {
  const factory _ShareAttemptResultResponseDto(
      {required final int createdCount}) = _$ShareAttemptResultResponseDtoImpl;

  factory _ShareAttemptResultResponseDto.fromJson(Map<String, dynamic> json) =
      _$ShareAttemptResultResponseDtoImpl.fromJson;

  @override
  int get createdCount;
  @override
  @JsonKey(ignore: true)
  _$$ShareAttemptResultResponseDtoImplCopyWith<
          _$ShareAttemptResultResponseDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}
