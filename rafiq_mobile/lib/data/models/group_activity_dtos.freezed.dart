// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'group_activity_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

CreateGroupActivityRequestDto _$CreateGroupActivityRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _CreateGroupActivityRequestDto.fromJson(json);
}

/// @nodoc
mixin _$CreateGroupActivityRequestDto {
  int get circleId => throw _privateConstructorUsedError;
  String get activityDate => throw _privateConstructorUsedError; // YYYY-MM-DD
  String get activityType =>
      throw _privateConstructorUsedError; // LECTURE|TAFSEER|SEERAH|FIQH|TAJWEED|HADITH|EDUCATIONAL
  String get title => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CreateGroupActivityRequestDtoCopyWith<CreateGroupActivityRequestDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateGroupActivityRequestDtoCopyWith<$Res> {
  factory $CreateGroupActivityRequestDtoCopyWith(
          CreateGroupActivityRequestDto value,
          $Res Function(CreateGroupActivityRequestDto) then) =
      _$CreateGroupActivityRequestDtoCopyWithImpl<$Res,
          CreateGroupActivityRequestDto>;
  @useResult
  $Res call(
      {int circleId,
      String activityDate,
      String activityType,
      String title,
      String? description});
}

/// @nodoc
class _$CreateGroupActivityRequestDtoCopyWithImpl<$Res,
        $Val extends CreateGroupActivityRequestDto>
    implements $CreateGroupActivityRequestDtoCopyWith<$Res> {
  _$CreateGroupActivityRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? circleId = null,
    Object? activityDate = null,
    Object? activityType = null,
    Object? title = null,
    Object? description = freezed,
  }) {
    return _then(_value.copyWith(
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      activityDate: null == activityDate
          ? _value.activityDate
          : activityDate // ignore: cast_nullable_to_non_nullable
              as String,
      activityType: null == activityType
          ? _value.activityType
          : activityType // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateGroupActivityRequestDtoImplCopyWith<$Res>
    implements $CreateGroupActivityRequestDtoCopyWith<$Res> {
  factory _$$CreateGroupActivityRequestDtoImplCopyWith(
          _$CreateGroupActivityRequestDtoImpl value,
          $Res Function(_$CreateGroupActivityRequestDtoImpl) then) =
      __$$CreateGroupActivityRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int circleId,
      String activityDate,
      String activityType,
      String title,
      String? description});
}

/// @nodoc
class __$$CreateGroupActivityRequestDtoImplCopyWithImpl<$Res>
    extends _$CreateGroupActivityRequestDtoCopyWithImpl<$Res,
        _$CreateGroupActivityRequestDtoImpl>
    implements _$$CreateGroupActivityRequestDtoImplCopyWith<$Res> {
  __$$CreateGroupActivityRequestDtoImplCopyWithImpl(
      _$CreateGroupActivityRequestDtoImpl _value,
      $Res Function(_$CreateGroupActivityRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? circleId = null,
    Object? activityDate = null,
    Object? activityType = null,
    Object? title = null,
    Object? description = freezed,
  }) {
    return _then(_$CreateGroupActivityRequestDtoImpl(
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      activityDate: null == activityDate
          ? _value.activityDate
          : activityDate // ignore: cast_nullable_to_non_nullable
              as String,
      activityType: null == activityType
          ? _value.activityType
          : activityType // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateGroupActivityRequestDtoImpl
    implements _CreateGroupActivityRequestDto {
  const _$CreateGroupActivityRequestDtoImpl(
      {required this.circleId,
      required this.activityDate,
      required this.activityType,
      required this.title,
      this.description});

  factory _$CreateGroupActivityRequestDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$CreateGroupActivityRequestDtoImplFromJson(json);

  @override
  final int circleId;
  @override
  final String activityDate;
// YYYY-MM-DD
  @override
  final String activityType;
// LECTURE|TAFSEER|SEERAH|FIQH|TAJWEED|HADITH|EDUCATIONAL
  @override
  final String title;
  @override
  final String? description;

  @override
  String toString() {
    return 'CreateGroupActivityRequestDto(circleId: $circleId, activityDate: $activityDate, activityType: $activityType, title: $title, description: $description)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateGroupActivityRequestDtoImpl &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.activityDate, activityDate) ||
                other.activityDate == activityDate) &&
            (identical(other.activityType, activityType) ||
                other.activityType == activityType) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, circleId, activityDate, activityType, title, description);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateGroupActivityRequestDtoImplCopyWith<
          _$CreateGroupActivityRequestDtoImpl>
      get copyWith => __$$CreateGroupActivityRequestDtoImplCopyWithImpl<
          _$CreateGroupActivityRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateGroupActivityRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _CreateGroupActivityRequestDto
    implements CreateGroupActivityRequestDto {
  const factory _CreateGroupActivityRequestDto(
      {required final int circleId,
      required final String activityDate,
      required final String activityType,
      required final String title,
      final String? description}) = _$CreateGroupActivityRequestDtoImpl;

  factory _CreateGroupActivityRequestDto.fromJson(Map<String, dynamic> json) =
      _$CreateGroupActivityRequestDtoImpl.fromJson;

  @override
  int get circleId;
  @override
  String get activityDate;
  @override // YYYY-MM-DD
  String get activityType;
  @override // LECTURE|TAFSEER|SEERAH|FIQH|TAJWEED|HADITH|EDUCATIONAL
  String get title;
  @override
  String? get description;
  @override
  @JsonKey(ignore: true)
  _$$CreateGroupActivityRequestDtoImplCopyWith<
          _$CreateGroupActivityRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

GroupActivityDto _$GroupActivityDtoFromJson(Map<String, dynamic> json) {
  return _GroupActivityDto.fromJson(json);
}

/// @nodoc
mixin _$GroupActivityDto {
  int get id => throw _privateConstructorUsedError;
  int get circleId => throw _privateConstructorUsedError;
  int get teacherId => throw _privateConstructorUsedError;
  String get activityDate => throw _privateConstructorUsedError;
  String get activityType => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  int get participantsCount => throw _privateConstructorUsedError;
  List<GroupActivityParticipantDto> get participants =>
      throw _privateConstructorUsedError;
  String get createdAt => throw _privateConstructorUsedError;
  String get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $GroupActivityDtoCopyWith<GroupActivityDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GroupActivityDtoCopyWith<$Res> {
  factory $GroupActivityDtoCopyWith(
          GroupActivityDto value, $Res Function(GroupActivityDto) then) =
      _$GroupActivityDtoCopyWithImpl<$Res, GroupActivityDto>;
  @useResult
  $Res call(
      {int id,
      int circleId,
      int teacherId,
      String activityDate,
      String activityType,
      String title,
      String? description,
      int participantsCount,
      List<GroupActivityParticipantDto> participants,
      String createdAt,
      String updatedAt});
}

/// @nodoc
class _$GroupActivityDtoCopyWithImpl<$Res, $Val extends GroupActivityDto>
    implements $GroupActivityDtoCopyWith<$Res> {
  _$GroupActivityDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? circleId = null,
    Object? teacherId = null,
    Object? activityDate = null,
    Object? activityType = null,
    Object? title = null,
    Object? description = freezed,
    Object? participantsCount = null,
    Object? participants = null,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      teacherId: null == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int,
      activityDate: null == activityDate
          ? _value.activityDate
          : activityDate // ignore: cast_nullable_to_non_nullable
              as String,
      activityType: null == activityType
          ? _value.activityType
          : activityType // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      participantsCount: null == participantsCount
          ? _value.participantsCount
          : participantsCount // ignore: cast_nullable_to_non_nullable
              as int,
      participants: null == participants
          ? _value.participants
          : participants // ignore: cast_nullable_to_non_nullable
              as List<GroupActivityParticipantDto>,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
      updatedAt: null == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GroupActivityDtoImplCopyWith<$Res>
    implements $GroupActivityDtoCopyWith<$Res> {
  factory _$$GroupActivityDtoImplCopyWith(_$GroupActivityDtoImpl value,
          $Res Function(_$GroupActivityDtoImpl) then) =
      __$$GroupActivityDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int circleId,
      int teacherId,
      String activityDate,
      String activityType,
      String title,
      String? description,
      int participantsCount,
      List<GroupActivityParticipantDto> participants,
      String createdAt,
      String updatedAt});
}

/// @nodoc
class __$$GroupActivityDtoImplCopyWithImpl<$Res>
    extends _$GroupActivityDtoCopyWithImpl<$Res, _$GroupActivityDtoImpl>
    implements _$$GroupActivityDtoImplCopyWith<$Res> {
  __$$GroupActivityDtoImplCopyWithImpl(_$GroupActivityDtoImpl _value,
      $Res Function(_$GroupActivityDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? circleId = null,
    Object? teacherId = null,
    Object? activityDate = null,
    Object? activityType = null,
    Object? title = null,
    Object? description = freezed,
    Object? participantsCount = null,
    Object? participants = null,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(_$GroupActivityDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      teacherId: null == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int,
      activityDate: null == activityDate
          ? _value.activityDate
          : activityDate // ignore: cast_nullable_to_non_nullable
              as String,
      activityType: null == activityType
          ? _value.activityType
          : activityType // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      participantsCount: null == participantsCount
          ? _value.participantsCount
          : participantsCount // ignore: cast_nullable_to_non_nullable
              as int,
      participants: null == participants
          ? _value._participants
          : participants // ignore: cast_nullable_to_non_nullable
              as List<GroupActivityParticipantDto>,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
      updatedAt: null == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GroupActivityDtoImpl implements _GroupActivityDto {
  const _$GroupActivityDtoImpl(
      {required this.id,
      required this.circleId,
      required this.teacherId,
      required this.activityDate,
      required this.activityType,
      required this.title,
      this.description,
      required this.participantsCount,
      required final List<GroupActivityParticipantDto> participants,
      required this.createdAt,
      required this.updatedAt})
      : _participants = participants;

  factory _$GroupActivityDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$GroupActivityDtoImplFromJson(json);

  @override
  final int id;
  @override
  final int circleId;
  @override
  final int teacherId;
  @override
  final String activityDate;
  @override
  final String activityType;
  @override
  final String title;
  @override
  final String? description;
  @override
  final int participantsCount;
  final List<GroupActivityParticipantDto> _participants;
  @override
  List<GroupActivityParticipantDto> get participants {
    if (_participants is EqualUnmodifiableListView) return _participants;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_participants);
  }

  @override
  final String createdAt;
  @override
  final String updatedAt;

  @override
  String toString() {
    return 'GroupActivityDto(id: $id, circleId: $circleId, teacherId: $teacherId, activityDate: $activityDate, activityType: $activityType, title: $title, description: $description, participantsCount: $participantsCount, participants: $participants, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GroupActivityDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.teacherId, teacherId) ||
                other.teacherId == teacherId) &&
            (identical(other.activityDate, activityDate) ||
                other.activityDate == activityDate) &&
            (identical(other.activityType, activityType) ||
                other.activityType == activityType) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.participantsCount, participantsCount) ||
                other.participantsCount == participantsCount) &&
            const DeepCollectionEquality()
                .equals(other._participants, _participants) &&
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
      circleId,
      teacherId,
      activityDate,
      activityType,
      title,
      description,
      participantsCount,
      const DeepCollectionEquality().hash(_participants),
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GroupActivityDtoImplCopyWith<_$GroupActivityDtoImpl> get copyWith =>
      __$$GroupActivityDtoImplCopyWithImpl<_$GroupActivityDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GroupActivityDtoImplToJson(
      this,
    );
  }
}

abstract class _GroupActivityDto implements GroupActivityDto {
  const factory _GroupActivityDto(
      {required final int id,
      required final int circleId,
      required final int teacherId,
      required final String activityDate,
      required final String activityType,
      required final String title,
      final String? description,
      required final int participantsCount,
      required final List<GroupActivityParticipantDto> participants,
      required final String createdAt,
      required final String updatedAt}) = _$GroupActivityDtoImpl;

  factory _GroupActivityDto.fromJson(Map<String, dynamic> json) =
      _$GroupActivityDtoImpl.fromJson;

  @override
  int get id;
  @override
  int get circleId;
  @override
  int get teacherId;
  @override
  String get activityDate;
  @override
  String get activityType;
  @override
  String get title;
  @override
  String? get description;
  @override
  int get participantsCount;
  @override
  List<GroupActivityParticipantDto> get participants;
  @override
  String get createdAt;
  @override
  String get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$GroupActivityDtoImplCopyWith<_$GroupActivityDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

GroupActivityParticipantDto _$GroupActivityParticipantDtoFromJson(
    Map<String, dynamic> json) {
  return _GroupActivityParticipantDto.fromJson(json);
}

/// @nodoc
mixin _$GroupActivityParticipantDto {
  int get studentId => throw _privateConstructorUsedError;
  String get fullName => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $GroupActivityParticipantDtoCopyWith<GroupActivityParticipantDto>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GroupActivityParticipantDtoCopyWith<$Res> {
  factory $GroupActivityParticipantDtoCopyWith(
          GroupActivityParticipantDto value,
          $Res Function(GroupActivityParticipantDto) then) =
      _$GroupActivityParticipantDtoCopyWithImpl<$Res,
          GroupActivityParticipantDto>;
  @useResult
  $Res call({int studentId, String fullName});
}

/// @nodoc
class _$GroupActivityParticipantDtoCopyWithImpl<$Res,
        $Val extends GroupActivityParticipantDto>
    implements $GroupActivityParticipantDtoCopyWith<$Res> {
  _$GroupActivityParticipantDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? fullName = null,
  }) {
    return _then(_value.copyWith(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GroupActivityParticipantDtoImplCopyWith<$Res>
    implements $GroupActivityParticipantDtoCopyWith<$Res> {
  factory _$$GroupActivityParticipantDtoImplCopyWith(
          _$GroupActivityParticipantDtoImpl value,
          $Res Function(_$GroupActivityParticipantDtoImpl) then) =
      __$$GroupActivityParticipantDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int studentId, String fullName});
}

/// @nodoc
class __$$GroupActivityParticipantDtoImplCopyWithImpl<$Res>
    extends _$GroupActivityParticipantDtoCopyWithImpl<$Res,
        _$GroupActivityParticipantDtoImpl>
    implements _$$GroupActivityParticipantDtoImplCopyWith<$Res> {
  __$$GroupActivityParticipantDtoImplCopyWithImpl(
      _$GroupActivityParticipantDtoImpl _value,
      $Res Function(_$GroupActivityParticipantDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? fullName = null,
  }) {
    return _then(_$GroupActivityParticipantDtoImpl(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GroupActivityParticipantDtoImpl
    implements _GroupActivityParticipantDto {
  const _$GroupActivityParticipantDtoImpl(
      {required this.studentId, required this.fullName});

  factory _$GroupActivityParticipantDtoImpl.fromJson(
          Map<String, dynamic> json) =>
      _$$GroupActivityParticipantDtoImplFromJson(json);

  @override
  final int studentId;
  @override
  final String fullName;

  @override
  String toString() {
    return 'GroupActivityParticipantDto(studentId: $studentId, fullName: $fullName)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GroupActivityParticipantDtoImpl &&
            (identical(other.studentId, studentId) ||
                other.studentId == studentId) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, studentId, fullName);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GroupActivityParticipantDtoImplCopyWith<_$GroupActivityParticipantDtoImpl>
      get copyWith => __$$GroupActivityParticipantDtoImplCopyWithImpl<
          _$GroupActivityParticipantDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GroupActivityParticipantDtoImplToJson(
      this,
    );
  }
}

abstract class _GroupActivityParticipantDto
    implements GroupActivityParticipantDto {
  const factory _GroupActivityParticipantDto(
      {required final int studentId,
      required final String fullName}) = _$GroupActivityParticipantDtoImpl;

  factory _GroupActivityParticipantDto.fromJson(Map<String, dynamic> json) =
      _$GroupActivityParticipantDtoImpl.fromJson;

  @override
  int get studentId;
  @override
  String get fullName;
  @override
  @JsonKey(ignore: true)
  _$$GroupActivityParticipantDtoImplCopyWith<_$GroupActivityParticipantDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}
