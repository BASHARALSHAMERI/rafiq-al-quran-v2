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
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get domain => throw _privateConstructorUsedError;

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
  $Res call({String id, String name, String domain});
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
    Object? domain = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      domain: null == domain
          ? _value.domain
          : domain // ignore: cast_nullable_to_non_nullable
              as String,
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
  $Res call({String id, String name, String domain});
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
    Object? domain = null,
  }) {
    return _then(_$CenterDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      domain: null == domain
          ? _value.domain
          : domain // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CenterDtoImpl implements _CenterDto {
  const _$CenterDtoImpl(
      {required this.id, required this.name, required this.domain});

  factory _$CenterDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$CenterDtoImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String domain;

  @override
  String toString() {
    return 'CenterDto(id: $id, name: $name, domain: $domain)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CenterDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.domain, domain) || other.domain == domain));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, domain);

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
      {required final String id,
      required final String name,
      required final String domain}) = _$CenterDtoImpl;

  factory _CenterDto.fromJson(Map<String, dynamic> json) =
      _$CenterDtoImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get domain;
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
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get centerId => throw _privateConstructorUsedError;

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
  $Res call({String id, String name, String centerId});
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
    Object? name = null,
    Object? centerId = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      centerId: null == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as String,
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
  $Res call({String id, String name, String centerId});
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
    Object? name = null,
    Object? centerId = null,
  }) {
    return _then(_$CircleDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      centerId: null == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CircleDtoImpl implements _CircleDto {
  const _$CircleDtoImpl(
      {required this.id, required this.name, required this.centerId});

  factory _$CircleDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$CircleDtoImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String centerId;

  @override
  String toString() {
    return 'CircleDto(id: $id, name: $name, centerId: $centerId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CircleDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, centerId);

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
      {required final String id,
      required final String name,
      required final String centerId}) = _$CircleDtoImpl;

  factory _CircleDto.fromJson(Map<String, dynamic> json) =
      _$CircleDtoImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get centerId;
  @override
  @JsonKey(ignore: true)
  _$$CircleDtoImplCopyWith<_$CircleDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
