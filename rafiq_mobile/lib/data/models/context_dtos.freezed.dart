// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'context_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CenterDto _$CenterDtoFromJson(Map<String, dynamic> json) {
  return _CenterDto.fromJson(json);
}

/// @nodoc
mixin _$CenterDto {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get code => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;
  String get gender => throw _privateConstructorUsedError;
  String? get timezone => throw _privateConstructorUsedError;
  String? get mosqueName => throw _privateConstructorUsedError;
  String? get locationText => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  int? get allowedRadiusMeters => throw _privateConstructorUsedError;
  String? get logoUrl => throw _privateConstructorUsedError;
  int get organizationId => throw _privateConstructorUsedError;
  int get centerAdminUserId => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CenterDtoCopyWith<CenterDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CenterDtoCopyWith<$Res> {
  factory $CenterDtoCopyWith(CenterDto value, $Res Function(CenterDto) then) =
      _$CenterDtoCopyWithImpl<$Res, CenterDto>;
  @useResult
  $Res call(
      {int id,
      String name,
      String code,
      bool isActive,
      String gender,
      String? timezone,
      String? mosqueName,
      String? locationText,
      double? latitude,
      double? longitude,
      int? allowedRadiusMeters,
      String? logoUrl,
      int organizationId,
      int centerAdminUserId});
}

/// @nodoc
class _$CenterDtoCopyWithImpl<$Res, $Val extends CenterDto>
    implements $CenterDtoCopyWith<$Res> {
  _$CenterDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? code = null,
    Object? isActive = null,
    Object? gender = null,
    Object? timezone = freezed,
    Object? mosqueName = freezed,
    Object? locationText = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? allowedRadiusMeters = freezed,
    Object? logoUrl = freezed,
    Object? organizationId = null,
    Object? centerAdminUserId = null,
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
      code: null == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      gender: null == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String,
      timezone: freezed == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String?,
      mosqueName: freezed == mosqueName
          ? _value.mosqueName
          : mosqueName // ignore: cast_nullable_to_non_nullable
              as String?,
      locationText: freezed == locationText
          ? _value.locationText
          : locationText // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      allowedRadiusMeters: freezed == allowedRadiusMeters
          ? _value.allowedRadiusMeters
          : allowedRadiusMeters // ignore: cast_nullable_to_non_nullable
              as int?,
      logoUrl: freezed == logoUrl
          ? _value.logoUrl
          : logoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      organizationId: null == organizationId
          ? _value.organizationId
          : organizationId // ignore: cast_nullable_to_non_nullable
              as int,
      centerAdminUserId: null == centerAdminUserId
          ? _value.centerAdminUserId
          : centerAdminUserId // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CenterDtoImplCopyWith<$Res>
    implements $CenterDtoCopyWith<$Res> {
  factory _$$CenterDtoImplCopyWith(
          _$CenterDtoImpl value, $Res Function(_$CenterDtoImpl) then) =
      __$$CenterDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String name,
      String code,
      bool isActive,
      String gender,
      String? timezone,
      String? mosqueName,
      String? locationText,
      double? latitude,
      double? longitude,
      int? allowedRadiusMeters,
      String? logoUrl,
      int organizationId,
      int centerAdminUserId});
}

/// @nodoc
class __$$CenterDtoImplCopyWithImpl<$Res>
    extends _$CenterDtoCopyWithImpl<$Res, _$CenterDtoImpl>
    implements _$$CenterDtoImplCopyWith<$Res> {
  __$$CenterDtoImplCopyWithImpl(
      _$CenterDtoImpl _value, $Res Function(_$CenterDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? code = null,
    Object? isActive = null,
    Object? gender = null,
    Object? timezone = freezed,
    Object? mosqueName = freezed,
    Object? locationText = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? allowedRadiusMeters = freezed,
    Object? logoUrl = freezed,
    Object? organizationId = null,
    Object? centerAdminUserId = null,
  }) {
    return _then(_$CenterDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      code: null == code
          ? _value.code
          : code // ignore: cast_nullable_to_non_nullable
              as String,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      gender: null == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String,
      timezone: freezed == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String?,
      mosqueName: freezed == mosqueName
          ? _value.mosqueName
          : mosqueName // ignore: cast_nullable_to_non_nullable
              as String?,
      locationText: freezed == locationText
          ? _value.locationText
          : locationText // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      allowedRadiusMeters: freezed == allowedRadiusMeters
          ? _value.allowedRadiusMeters
          : allowedRadiusMeters // ignore: cast_nullable_to_non_nullable
              as int?,
      logoUrl: freezed == logoUrl
          ? _value.logoUrl
          : logoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      organizationId: null == organizationId
          ? _value.organizationId
          : organizationId // ignore: cast_nullable_to_non_nullable
              as int,
      centerAdminUserId: null == centerAdminUserId
          ? _value.centerAdminUserId
          : centerAdminUserId // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CenterDtoImpl implements _CenterDto {
  const _$CenterDtoImpl(
      {required this.id,
      required this.name,
      required this.code,
      this.isActive = true,
      this.gender = 'MALE',
      this.timezone,
      this.mosqueName,
      this.locationText,
      this.latitude,
      this.longitude,
      this.allowedRadiusMeters,
      this.logoUrl,
      this.organizationId = 0,
      this.centerAdminUserId = 0});

  factory _$CenterDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$CenterDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  final String code;
  @override
  @JsonKey()
  final bool isActive;
  @override
  @JsonKey()
  final String gender;
  @override
  final String? timezone;
  @override
  final String? mosqueName;
  @override
  final String? locationText;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  final int? allowedRadiusMeters;
  @override
  final String? logoUrl;
  @override
  @JsonKey()
  final int organizationId;
  @override
  @JsonKey()
  final int centerAdminUserId;

  @override
  String toString() {
    return 'CenterDto(id: $id, name: $name, code: $code, isActive: $isActive, gender: $gender, timezone: $timezone, mosqueName: $mosqueName, locationText: $locationText, latitude: $latitude, longitude: $longitude, allowedRadiusMeters: $allowedRadiusMeters, logoUrl: $logoUrl, organizationId: $organizationId, centerAdminUserId: $centerAdminUserId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CenterDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.gender, gender) || other.gender == gender) &&
            (identical(other.timezone, timezone) ||
                other.timezone == timezone) &&
            (identical(other.mosqueName, mosqueName) ||
                other.mosqueName == mosqueName) &&
            (identical(other.locationText, locationText) ||
                other.locationText == locationText) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.allowedRadiusMeters, allowedRadiusMeters) ||
                other.allowedRadiusMeters == allowedRadiusMeters) &&
            (identical(other.logoUrl, logoUrl) || other.logoUrl == logoUrl) &&
            (identical(other.organizationId, organizationId) ||
                other.organizationId == organizationId) &&
            (identical(other.centerAdminUserId, centerAdminUserId) ||
                other.centerAdminUserId == centerAdminUserId));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      name,
      code,
      isActive,
      gender,
      timezone,
      mosqueName,
      locationText,
      latitude,
      longitude,
      allowedRadiusMeters,
      logoUrl,
      organizationId,
      centerAdminUserId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CenterDtoImplCopyWith<_$CenterDtoImpl> get copyWith =>
      __$$CenterDtoImplCopyWithImpl<_$CenterDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CenterDtoImplToJson(
      this,
    );
  }
}

abstract class _CenterDto implements CenterDto {
  const factory _CenterDto(
      {required final int id,
      required final String name,
      required final String code,
      final bool isActive,
      final String gender,
      final String? timezone,
      final String? mosqueName,
      final String? locationText,
      final double? latitude,
      final double? longitude,
      final int? allowedRadiusMeters,
      final String? logoUrl,
      final int organizationId,
      final int centerAdminUserId}) = _$CenterDtoImpl;

  factory _CenterDto.fromJson(Map<String, dynamic> json) =
      _$CenterDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  String get code;
  @override
  bool get isActive;
  @override
  String get gender;
  @override
  String? get timezone;
  @override
  String? get mosqueName;
  @override
  String? get locationText;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  int? get allowedRadiusMeters;
  @override
  String? get logoUrl;
  @override
  int get organizationId;
  @override
  int get centerAdminUserId;
  @override
  @JsonKey(ignore: true)
  _$$CenterDtoImplCopyWith<_$CenterDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CircleDto _$CircleDtoFromJson(Map<String, dynamic> json) {
  return _CircleDto.fromJson(json);
}

/// @nodoc
mixin _$CircleDto {
  int get id => throw _privateConstructorUsedError;
  int get centerId => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  int get teacherId => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;
  String get gender => throw _privateConstructorUsedError;
  String get circleType => throw _privateConstructorUsedError;
  String get approvalStatus => throw _privateConstructorUsedError;
  String? get mosqueName => throw _privateConstructorUsedError;
  String? get locationText => throw _privateConstructorUsedError;
  double? get latitude => throw _privateConstructorUsedError;
  double? get longitude => throw _privateConstructorUsedError;
  int? get allowedRadiusMeters => throw _privateConstructorUsedError;
  String? get teacherName => throw _privateConstructorUsedError;
  int? get studentsCount => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CircleDtoCopyWith<CircleDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CircleDtoCopyWith<$Res> {
  factory $CircleDtoCopyWith(CircleDto value, $Res Function(CircleDto) then) =
      _$CircleDtoCopyWithImpl<$Res, CircleDto>;
  @useResult
  $Res call(
      {int id,
      int centerId,
      String name,
      int teacherId,
      bool isActive,
      String gender,
      String circleType,
      String approvalStatus,
      String? mosqueName,
      String? locationText,
      double? latitude,
      double? longitude,
      int? allowedRadiusMeters,
      String? teacherName,
      int? studentsCount});
}

/// @nodoc
class _$CircleDtoCopyWithImpl<$Res, $Val extends CircleDto>
    implements $CircleDtoCopyWith<$Res> {
  _$CircleDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? centerId = null,
    Object? name = null,
    Object? teacherId = null,
    Object? isActive = null,
    Object? gender = null,
    Object? circleType = null,
    Object? approvalStatus = null,
    Object? mosqueName = freezed,
    Object? locationText = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? allowedRadiusMeters = freezed,
    Object? teacherName = freezed,
    Object? studentsCount = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      centerId: null == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      teacherId: null == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      gender: null == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String,
      circleType: null == circleType
          ? _value.circleType
          : circleType // ignore: cast_nullable_to_non_nullable
              as String,
      approvalStatus: null == approvalStatus
          ? _value.approvalStatus
          : approvalStatus // ignore: cast_nullable_to_non_nullable
              as String,
      mosqueName: freezed == mosqueName
          ? _value.mosqueName
          : mosqueName // ignore: cast_nullable_to_non_nullable
              as String?,
      locationText: freezed == locationText
          ? _value.locationText
          : locationText // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      allowedRadiusMeters: freezed == allowedRadiusMeters
          ? _value.allowedRadiusMeters
          : allowedRadiusMeters // ignore: cast_nullable_to_non_nullable
              as int?,
      teacherName: freezed == teacherName
          ? _value.teacherName
          : teacherName // ignore: cast_nullable_to_non_nullable
              as String?,
      studentsCount: freezed == studentsCount
          ? _value.studentsCount
          : studentsCount // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CircleDtoImplCopyWith<$Res>
    implements $CircleDtoCopyWith<$Res> {
  factory _$$CircleDtoImplCopyWith(
          _$CircleDtoImpl value, $Res Function(_$CircleDtoImpl) then) =
      __$$CircleDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int centerId,
      String name,
      int teacherId,
      bool isActive,
      String gender,
      String circleType,
      String approvalStatus,
      String? mosqueName,
      String? locationText,
      double? latitude,
      double? longitude,
      int? allowedRadiusMeters,
      String? teacherName,
      int? studentsCount});
}

/// @nodoc
class __$$CircleDtoImplCopyWithImpl<$Res>
    extends _$CircleDtoCopyWithImpl<$Res, _$CircleDtoImpl>
    implements _$$CircleDtoImplCopyWith<$Res> {
  __$$CircleDtoImplCopyWithImpl(
      _$CircleDtoImpl _value, $Res Function(_$CircleDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? centerId = null,
    Object? name = null,
    Object? teacherId = null,
    Object? isActive = null,
    Object? gender = null,
    Object? circleType = null,
    Object? approvalStatus = null,
    Object? mosqueName = freezed,
    Object? locationText = freezed,
    Object? latitude = freezed,
    Object? longitude = freezed,
    Object? allowedRadiusMeters = freezed,
    Object? teacherName = freezed,
    Object? studentsCount = freezed,
  }) {
    return _then(_$CircleDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      centerId: null == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      teacherId: null == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      gender: null == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String,
      circleType: null == circleType
          ? _value.circleType
          : circleType // ignore: cast_nullable_to_non_nullable
              as String,
      approvalStatus: null == approvalStatus
          ? _value.approvalStatus
          : approvalStatus // ignore: cast_nullable_to_non_nullable
              as String,
      mosqueName: freezed == mosqueName
          ? _value.mosqueName
          : mosqueName // ignore: cast_nullable_to_non_nullable
              as String?,
      locationText: freezed == locationText
          ? _value.locationText
          : locationText // ignore: cast_nullable_to_non_nullable
              as String?,
      latitude: freezed == latitude
          ? _value.latitude
          : latitude // ignore: cast_nullable_to_non_nullable
              as double?,
      longitude: freezed == longitude
          ? _value.longitude
          : longitude // ignore: cast_nullable_to_non_nullable
              as double?,
      allowedRadiusMeters: freezed == allowedRadiusMeters
          ? _value.allowedRadiusMeters
          : allowedRadiusMeters // ignore: cast_nullable_to_non_nullable
              as int?,
      teacherName: freezed == teacherName
          ? _value.teacherName
          : teacherName // ignore: cast_nullable_to_non_nullable
              as String?,
      studentsCount: freezed == studentsCount
          ? _value.studentsCount
          : studentsCount // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CircleDtoImpl implements _CircleDto {
  const _$CircleDtoImpl(
      {required this.id,
      required this.centerId,
      required this.name,
      this.teacherId = 0,
      this.isActive = true,
      this.gender = 'MALE',
      this.circleType = 'HIFZ',
      this.approvalStatus = 'APPROVED',
      this.mosqueName,
      this.locationText,
      this.latitude,
      this.longitude,
      this.allowedRadiusMeters,
      this.teacherName,
      this.studentsCount});

  factory _$CircleDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$CircleDtoImplFromJson(json);

  @override
  final int id;
  @override
  final int centerId;
  @override
  final String name;
  @override
  @JsonKey()
  final int teacherId;
  @override
  @JsonKey()
  final bool isActive;
  @override
  @JsonKey()
  final String gender;
  @override
  @JsonKey()
  final String circleType;
  @override
  @JsonKey()
  final String approvalStatus;
  @override
  final String? mosqueName;
  @override
  final String? locationText;
  @override
  final double? latitude;
  @override
  final double? longitude;
  @override
  final int? allowedRadiusMeters;
  @override
  final String? teacherName;
  @override
  final int? studentsCount;

  @override
  String toString() {
    return 'CircleDto(id: $id, centerId: $centerId, name: $name, teacherId: $teacherId, isActive: $isActive, gender: $gender, circleType: $circleType, approvalStatus: $approvalStatus, mosqueName: $mosqueName, locationText: $locationText, latitude: $latitude, longitude: $longitude, allowedRadiusMeters: $allowedRadiusMeters, teacherName: $teacherName, studentsCount: $studentsCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CircleDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.teacherId, teacherId) ||
                other.teacherId == teacherId) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.gender, gender) || other.gender == gender) &&
            (identical(other.circleType, circleType) ||
                other.circleType == circleType) &&
            (identical(other.approvalStatus, approvalStatus) ||
                other.approvalStatus == approvalStatus) &&
            (identical(other.mosqueName, mosqueName) ||
                other.mosqueName == mosqueName) &&
            (identical(other.locationText, locationText) ||
                other.locationText == locationText) &&
            (identical(other.latitude, latitude) ||
                other.latitude == latitude) &&
            (identical(other.longitude, longitude) ||
                other.longitude == longitude) &&
            (identical(other.allowedRadiusMeters, allowedRadiusMeters) ||
                other.allowedRadiusMeters == allowedRadiusMeters) &&
            (identical(other.teacherName, teacherName) ||
                other.teacherName == teacherName) &&
            (identical(other.studentsCount, studentsCount) ||
                other.studentsCount == studentsCount));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      centerId,
      name,
      teacherId,
      isActive,
      gender,
      circleType,
      approvalStatus,
      mosqueName,
      locationText,
      latitude,
      longitude,
      allowedRadiusMeters,
      teacherName,
      studentsCount);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CircleDtoImplCopyWith<_$CircleDtoImpl> get copyWith =>
      __$$CircleDtoImplCopyWithImpl<_$CircleDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CircleDtoImplToJson(
      this,
    );
  }
}

abstract class _CircleDto implements CircleDto {
  const factory _CircleDto(
      {required final int id,
      required final int centerId,
      required final String name,
      final int teacherId,
      final bool isActive,
      final String gender,
      final String circleType,
      final String approvalStatus,
      final String? mosqueName,
      final String? locationText,
      final double? latitude,
      final double? longitude,
      final int? allowedRadiusMeters,
      final String? teacherName,
      final int? studentsCount}) = _$CircleDtoImpl;

  factory _CircleDto.fromJson(Map<String, dynamic> json) =
      _$CircleDtoImpl.fromJson;

  @override
  int get id;
  @override
  int get centerId;
  @override
  String get name;
  @override
  int get teacherId;
  @override
  bool get isActive;
  @override
  String get gender;
  @override
  String get circleType;
  @override
  String get approvalStatus;
  @override
  String? get mosqueName;
  @override
  String? get locationText;
  @override
  double? get latitude;
  @override
  double? get longitude;
  @override
  int? get allowedRadiusMeters;
  @override
  String? get teacherName;
  @override
  int? get studentsCount;
  @override
  @JsonKey(ignore: true)
  _$$CircleDtoImplCopyWith<_$CircleDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
