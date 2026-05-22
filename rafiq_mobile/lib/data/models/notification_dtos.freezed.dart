// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'notification_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

NotificationDto _$NotificationDtoFromJson(Map<String, dynamic> json) {
  return _NotificationDto.fromJson(json);
}

/// @nodoc
mixin _$NotificationDto {
  int get id => throw _privateConstructorUsedError;
  String get type =>
      throw _privateConstructorUsedError; // SYSTEM, EXAM_RESULT, FOLLOW_UP, ASSIGNMENT, REMINDER
  String get title => throw _privateConstructorUsedError;
  String get message => throw _privateConstructorUsedError;
  bool get isRead => throw _privateConstructorUsedError;
  int get userId => throw _privateConstructorUsedError;
  Map<String, dynamic>? get metadata => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $NotificationDtoCopyWith<NotificationDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $NotificationDtoCopyWith<$Res> {
  factory $NotificationDtoCopyWith(
          NotificationDto value, $Res Function(NotificationDto) then) =
      _$NotificationDtoCopyWithImpl<$Res, NotificationDto>;
  @useResult
  $Res call(
      {int id,
      String type,
      String title,
      String message,
      bool isRead,
      int userId,
      Map<String, dynamic>? metadata,
      DateTime createdAt,
      DateTime updatedAt});
}

/// @nodoc
class _$NotificationDtoCopyWithImpl<$Res, $Val extends NotificationDto>
    implements $NotificationDtoCopyWith<$Res> {
  _$NotificationDtoCopyWithImpl(this._value, this._then);

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
    Object? message = null,
    Object? isRead = null,
    Object? userId = null,
    Object? metadata = freezed,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      isRead: null == isRead
          ? _value.isRead
          : isRead // ignore: cast_nullable_to_non_nullable
              as bool,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as int,
      metadata: freezed == metadata
          ? _value.metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: null == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$NotificationDtoImplCopyWith<$Res>
    implements $NotificationDtoCopyWith<$Res> {
  factory _$$NotificationDtoImplCopyWith(_$NotificationDtoImpl value,
          $Res Function(_$NotificationDtoImpl) then) =
      __$$NotificationDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String type,
      String title,
      String message,
      bool isRead,
      int userId,
      Map<String, dynamic>? metadata,
      DateTime createdAt,
      DateTime updatedAt});
}

/// @nodoc
class __$$NotificationDtoImplCopyWithImpl<$Res>
    extends _$NotificationDtoCopyWithImpl<$Res, _$NotificationDtoImpl>
    implements _$$NotificationDtoImplCopyWith<$Res> {
  __$$NotificationDtoImplCopyWithImpl(
      _$NotificationDtoImpl _value, $Res Function(_$NotificationDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? title = null,
    Object? message = null,
    Object? isRead = null,
    Object? userId = null,
    Object? metadata = freezed,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(_$NotificationDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
      isRead: null == isRead
          ? _value.isRead
          : isRead // ignore: cast_nullable_to_non_nullable
              as bool,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as int,
      metadata: freezed == metadata
          ? _value._metadata
          : metadata // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      updatedAt: null == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$NotificationDtoImpl implements _NotificationDto {
  const _$NotificationDtoImpl(
      {required this.id,
      required this.type,
      required this.title,
      required this.message,
      required this.isRead,
      required this.userId,
      final Map<String, dynamic>? metadata,
      required this.createdAt,
      required this.updatedAt})
      : _metadata = metadata;

  factory _$NotificationDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$NotificationDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String type;
// SYSTEM, EXAM_RESULT, FOLLOW_UP, ASSIGNMENT, REMINDER
  @override
  final String title;
  @override
  final String message;
  @override
  final bool isRead;
  @override
  final int userId;
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
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  @override
  String toString() {
    return 'NotificationDto(id: $id, type: $type, title: $title, message: $message, isRead: $isRead, userId: $userId, metadata: $metadata, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NotificationDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.isRead, isRead) || other.isRead == isRead) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            const DeepCollectionEquality().equals(other._metadata, _metadata) &&
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
      type,
      title,
      message,
      isRead,
      userId,
      const DeepCollectionEquality().hash(_metadata),
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$NotificationDtoImplCopyWith<_$NotificationDtoImpl> get copyWith =>
      __$$NotificationDtoImplCopyWithImpl<_$NotificationDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$NotificationDtoImplToJson(
      this,
    );
  }
}

abstract class _NotificationDto implements NotificationDto {
  const factory _NotificationDto(
      {required final int id,
      required final String type,
      required final String title,
      required final String message,
      required final bool isRead,
      required final int userId,
      final Map<String, dynamic>? metadata,
      required final DateTime createdAt,
      required final DateTime updatedAt}) = _$NotificationDtoImpl;

  factory _NotificationDto.fromJson(Map<String, dynamic> json) =
      _$NotificationDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get type;
  @override // SYSTEM, EXAM_RESULT, FOLLOW_UP, ASSIGNMENT, REMINDER
  String get title;
  @override
  String get message;
  @override
  bool get isRead;
  @override
  int get userId;
  @override
  Map<String, dynamic>? get metadata;
  @override
  DateTime get createdAt;
  @override
  DateTime get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$NotificationDtoImplCopyWith<_$NotificationDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

UnreadCountDto _$UnreadCountDtoFromJson(Map<String, dynamic> json) {
  return _UnreadCountDto.fromJson(json);
}

/// @nodoc
mixin _$UnreadCountDto {
  int get count => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $UnreadCountDtoCopyWith<UnreadCountDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UnreadCountDtoCopyWith<$Res> {
  factory $UnreadCountDtoCopyWith(
          UnreadCountDto value, $Res Function(UnreadCountDto) then) =
      _$UnreadCountDtoCopyWithImpl<$Res, UnreadCountDto>;
  @useResult
  $Res call({int count});
}

/// @nodoc
class _$UnreadCountDtoCopyWithImpl<$Res, $Val extends UnreadCountDto>
    implements $UnreadCountDtoCopyWith<$Res> {
  _$UnreadCountDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? count = null,
  }) {
    return _then(_value.copyWith(
      count: null == count
          ? _value.count
          : count // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UnreadCountDtoImplCopyWith<$Res>
    implements $UnreadCountDtoCopyWith<$Res> {
  factory _$$UnreadCountDtoImplCopyWith(_$UnreadCountDtoImpl value,
          $Res Function(_$UnreadCountDtoImpl) then) =
      __$$UnreadCountDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int count});
}

/// @nodoc
class __$$UnreadCountDtoImplCopyWithImpl<$Res>
    extends _$UnreadCountDtoCopyWithImpl<$Res, _$UnreadCountDtoImpl>
    implements _$$UnreadCountDtoImplCopyWith<$Res> {
  __$$UnreadCountDtoImplCopyWithImpl(
      _$UnreadCountDtoImpl _value, $Res Function(_$UnreadCountDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? count = null,
  }) {
    return _then(_$UnreadCountDtoImpl(
      count: null == count
          ? _value.count
          : count // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UnreadCountDtoImpl implements _UnreadCountDto {
  const _$UnreadCountDtoImpl({required this.count});

  factory _$UnreadCountDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$UnreadCountDtoImplFromJson(json);

  @override
  final int count;

  @override
  String toString() {
    return 'UnreadCountDto(count: $count)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UnreadCountDtoImpl &&
            (identical(other.count, count) || other.count == count));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, count);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UnreadCountDtoImplCopyWith<_$UnreadCountDtoImpl> get copyWith =>
      __$$UnreadCountDtoImplCopyWithImpl<_$UnreadCountDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UnreadCountDtoImplToJson(
      this,
    );
  }
}

abstract class _UnreadCountDto implements UnreadCountDto {
  const factory _UnreadCountDto({required final int count}) =
      _$UnreadCountDtoImpl;

  factory _UnreadCountDto.fromJson(Map<String, dynamic> json) =
      _$UnreadCountDtoImpl.fromJson;

  @override
  int get count;
  @override
  @JsonKey(ignore: true)
  _$$UnreadCountDtoImplCopyWith<_$UnreadCountDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
