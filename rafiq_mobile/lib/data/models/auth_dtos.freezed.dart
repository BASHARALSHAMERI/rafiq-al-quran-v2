// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auth_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

LoginRequest _$LoginRequestFromJson(Map<String, dynamic> json) {
  return _LoginRequest.fromJson(json);
}

/// @nodoc
mixin _$LoginRequest {
  String get identifier => throw _privateConstructorUsedError;
  String get password => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $LoginRequestCopyWith<LoginRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LoginRequestCopyWith<$Res> {
  factory $LoginRequestCopyWith(
          LoginRequest value, $Res Function(LoginRequest) then) =
      _$LoginRequestCopyWithImpl<$Res, LoginRequest>;
  @useResult
  $Res call({String identifier, String password});
}

/// @nodoc
class _$LoginRequestCopyWithImpl<$Res, $Val extends LoginRequest>
    implements $LoginRequestCopyWith<$Res> {
  _$LoginRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? identifier = null,
    Object? password = null,
  }) {
    return _then(_value.copyWith(
      identifier: null == identifier
          ? _value.identifier
          : identifier // ignore: cast_nullable_to_non_nullable
              as String,
      password: null == password
          ? _value.password
          : password // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LoginRequestImplCopyWith<$Res>
    implements $LoginRequestCopyWith<$Res> {
  factory _$$LoginRequestImplCopyWith(
          _$LoginRequestImpl value, $Res Function(_$LoginRequestImpl) then) =
      __$$LoginRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String identifier, String password});
}

/// @nodoc
class __$$LoginRequestImplCopyWithImpl<$Res>
    extends _$LoginRequestCopyWithImpl<$Res, _$LoginRequestImpl>
    implements _$$LoginRequestImplCopyWith<$Res> {
  __$$LoginRequestImplCopyWithImpl(
      _$LoginRequestImpl _value, $Res Function(_$LoginRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? identifier = null,
    Object? password = null,
  }) {
    return _then(_$LoginRequestImpl(
      identifier: null == identifier
          ? _value.identifier
          : identifier // ignore: cast_nullable_to_non_nullable
              as String,
      password: null == password
          ? _value.password
          : password // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LoginRequestImpl implements _LoginRequest {
  const _$LoginRequestImpl({required this.identifier, required this.password});

  factory _$LoginRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$LoginRequestImplFromJson(json);

  @override
  final String identifier;
  @override
  final String password;

  @override
  String toString() {
    return 'LoginRequest(identifier: $identifier, password: $password)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LoginRequestImpl &&
            (identical(other.identifier, identifier) ||
                other.identifier == identifier) &&
            (identical(other.password, password) ||
                other.password == password));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, identifier, password);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LoginRequestImplCopyWith<_$LoginRequestImpl> get copyWith =>
      __$$LoginRequestImplCopyWithImpl<_$LoginRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LoginRequestImplToJson(
      this,
    );
  }
}

abstract class _LoginRequest implements LoginRequest {
  const factory _LoginRequest(
      {required final String identifier,
      required final String password}) = _$LoginRequestImpl;

  factory _LoginRequest.fromJson(Map<String, dynamic> json) =
      _$LoginRequestImpl.fromJson;

  @override
  String get identifier;
  @override
  String get password;
  @override
  @JsonKey(ignore: true)
  _$$LoginRequestImplCopyWith<_$LoginRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

RefreshRequest _$RefreshRequestFromJson(Map<String, dynamic> json) {
  return _RefreshRequest.fromJson(json);
}

/// @nodoc
mixin _$RefreshRequest {
  String get refreshToken => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $RefreshRequestCopyWith<RefreshRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RefreshRequestCopyWith<$Res> {
  factory $RefreshRequestCopyWith(
          RefreshRequest value, $Res Function(RefreshRequest) then) =
      _$RefreshRequestCopyWithImpl<$Res, RefreshRequest>;
  @useResult
  $Res call({String refreshToken});
}

/// @nodoc
class _$RefreshRequestCopyWithImpl<$Res, $Val extends RefreshRequest>
    implements $RefreshRequestCopyWith<$Res> {
  _$RefreshRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? refreshToken = null,
  }) {
    return _then(_value.copyWith(
      refreshToken: null == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$RefreshRequestImplCopyWith<$Res>
    implements $RefreshRequestCopyWith<$Res> {
  factory _$$RefreshRequestImplCopyWith(_$RefreshRequestImpl value,
          $Res Function(_$RefreshRequestImpl) then) =
      __$$RefreshRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String refreshToken});
}

/// @nodoc
class __$$RefreshRequestImplCopyWithImpl<$Res>
    extends _$RefreshRequestCopyWithImpl<$Res, _$RefreshRequestImpl>
    implements _$$RefreshRequestImplCopyWith<$Res> {
  __$$RefreshRequestImplCopyWithImpl(
      _$RefreshRequestImpl _value, $Res Function(_$RefreshRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? refreshToken = null,
  }) {
    return _then(_$RefreshRequestImpl(
      refreshToken: null == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$RefreshRequestImpl implements _RefreshRequest {
  const _$RefreshRequestImpl({required this.refreshToken});

  factory _$RefreshRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$RefreshRequestImplFromJson(json);

  @override
  final String refreshToken;

  @override
  String toString() {
    return 'RefreshRequest(refreshToken: $refreshToken)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RefreshRequestImpl &&
            (identical(other.refreshToken, refreshToken) ||
                other.refreshToken == refreshToken));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, refreshToken);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$RefreshRequestImplCopyWith<_$RefreshRequestImpl> get copyWith =>
      __$$RefreshRequestImplCopyWithImpl<_$RefreshRequestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RefreshRequestImplToJson(
      this,
    );
  }
}

abstract class _RefreshRequest implements RefreshRequest {
  const factory _RefreshRequest({required final String refreshToken}) =
      _$RefreshRequestImpl;

  factory _RefreshRequest.fromJson(Map<String, dynamic> json) =
      _$RefreshRequestImpl.fromJson;

  @override
  String get refreshToken;
  @override
  @JsonKey(ignore: true)
  _$$RefreshRequestImplCopyWith<_$RefreshRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AuthSessionDto _$AuthSessionDtoFromJson(Map<String, dynamic> json) {
  return _AuthSessionDto.fromJson(json);
}

/// @nodoc
mixin _$AuthSessionDto {
  String get accessToken => throw _privateConstructorUsedError;
  String get refreshToken => throw _privateConstructorUsedError;
  AuthUserDto get user => throw _privateConstructorUsedError;
  String? get accessExpiresIn => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AuthSessionDtoCopyWith<AuthSessionDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthSessionDtoCopyWith<$Res> {
  factory $AuthSessionDtoCopyWith(
          AuthSessionDto value, $Res Function(AuthSessionDto) then) =
      _$AuthSessionDtoCopyWithImpl<$Res, AuthSessionDto>;
  @useResult
  $Res call(
      {String accessToken,
      String refreshToken,
      AuthUserDto user,
      String? accessExpiresIn});

  $AuthUserDtoCopyWith<$Res> get user;
}

/// @nodoc
class _$AuthSessionDtoCopyWithImpl<$Res, $Val extends AuthSessionDto>
    implements $AuthSessionDtoCopyWith<$Res> {
  _$AuthSessionDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accessToken = null,
    Object? refreshToken = null,
    Object? user = null,
    Object? accessExpiresIn = freezed,
  }) {
    return _then(_value.copyWith(
      accessToken: null == accessToken
          ? _value.accessToken
          : accessToken // ignore: cast_nullable_to_non_nullable
              as String,
      refreshToken: null == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String,
      user: null == user
          ? _value.user
          : user // ignore: cast_nullable_to_non_nullable
              as AuthUserDto,
      accessExpiresIn: freezed == accessExpiresIn
          ? _value.accessExpiresIn
          : accessExpiresIn // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $AuthUserDtoCopyWith<$Res> get user {
    return $AuthUserDtoCopyWith<$Res>(_value.user, (value) {
      return _then(_value.copyWith(user: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$AuthSessionDtoImplCopyWith<$Res>
    implements $AuthSessionDtoCopyWith<$Res> {
  factory _$$AuthSessionDtoImplCopyWith(_$AuthSessionDtoImpl value,
          $Res Function(_$AuthSessionDtoImpl) then) =
      __$$AuthSessionDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String accessToken,
      String refreshToken,
      AuthUserDto user,
      String? accessExpiresIn});

  @override
  $AuthUserDtoCopyWith<$Res> get user;
}

/// @nodoc
class __$$AuthSessionDtoImplCopyWithImpl<$Res>
    extends _$AuthSessionDtoCopyWithImpl<$Res, _$AuthSessionDtoImpl>
    implements _$$AuthSessionDtoImplCopyWith<$Res> {
  __$$AuthSessionDtoImplCopyWithImpl(
      _$AuthSessionDtoImpl _value, $Res Function(_$AuthSessionDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accessToken = null,
    Object? refreshToken = null,
    Object? user = null,
    Object? accessExpiresIn = freezed,
  }) {
    return _then(_$AuthSessionDtoImpl(
      accessToken: null == accessToken
          ? _value.accessToken
          : accessToken // ignore: cast_nullable_to_non_nullable
              as String,
      refreshToken: null == refreshToken
          ? _value.refreshToken
          : refreshToken // ignore: cast_nullable_to_non_nullable
              as String,
      user: null == user
          ? _value.user
          : user // ignore: cast_nullable_to_non_nullable
              as AuthUserDto,
      accessExpiresIn: freezed == accessExpiresIn
          ? _value.accessExpiresIn
          : accessExpiresIn // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AuthSessionDtoImpl implements _AuthSessionDto {
  const _$AuthSessionDtoImpl(
      {required this.accessToken,
      required this.refreshToken,
      required this.user,
      this.accessExpiresIn});

  factory _$AuthSessionDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$AuthSessionDtoImplFromJson(json);

  @override
  final String accessToken;
  @override
  final String refreshToken;
  @override
  final AuthUserDto user;
  @override
  final String? accessExpiresIn;

  @override
  String toString() {
    return 'AuthSessionDto(accessToken: $accessToken, refreshToken: $refreshToken, user: $user, accessExpiresIn: $accessExpiresIn)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthSessionDtoImpl &&
            (identical(other.accessToken, accessToken) ||
                other.accessToken == accessToken) &&
            (identical(other.refreshToken, refreshToken) ||
                other.refreshToken == refreshToken) &&
            (identical(other.user, user) || other.user == user) &&
            (identical(other.accessExpiresIn, accessExpiresIn) ||
                other.accessExpiresIn == accessExpiresIn));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, accessToken, refreshToken, user, accessExpiresIn);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthSessionDtoImplCopyWith<_$AuthSessionDtoImpl> get copyWith =>
      __$$AuthSessionDtoImplCopyWithImpl<_$AuthSessionDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AuthSessionDtoImplToJson(
      this,
    );
  }
}

abstract class _AuthSessionDto implements AuthSessionDto {
  const factory _AuthSessionDto(
      {required final String accessToken,
      required final String refreshToken,
      required final AuthUserDto user,
      final String? accessExpiresIn}) = _$AuthSessionDtoImpl;

  factory _AuthSessionDto.fromJson(Map<String, dynamic> json) =
      _$AuthSessionDtoImpl.fromJson;

  @override
  String get accessToken;
  @override
  String get refreshToken;
  @override
  AuthUserDto get user;
  @override
  String? get accessExpiresIn;
  @override
  @JsonKey(ignore: true)
  _$$AuthSessionDtoImplCopyWith<_$AuthSessionDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AuthUserDto _$AuthUserDtoFromJson(Map<String, dynamic> json) {
  return _AuthUserDto.fromJson(json);
}

/// @nodoc
mixin _$AuthUserDto {
  int get id => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get fullName => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;
  int get organizationId => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;
  String get accountStatus => throw _privateConstructorUsedError;
  String? get phone => throw _privateConstructorUsedError;
  String? get gender => throw _privateConstructorUsedError;
  String? get avatarUrl => throw _privateConstructorUsedError;
  String? get organizationName => throw _privateConstructorUsedError;
  String? get organizationLogoUrl => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AuthUserDtoCopyWith<AuthUserDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthUserDtoCopyWith<$Res> {
  factory $AuthUserDtoCopyWith(
          AuthUserDto value, $Res Function(AuthUserDto) then) =
      _$AuthUserDtoCopyWithImpl<$Res, AuthUserDto>;
  @useResult
  $Res call(
      {int id,
      String email,
      String fullName,
      String role,
      int organizationId,
      bool isActive,
      String accountStatus,
      String? phone,
      String? gender,
      String? avatarUrl,
      String? organizationName,
      String? organizationLogoUrl});
}

/// @nodoc
class _$AuthUserDtoCopyWithImpl<$Res, $Val extends AuthUserDto>
    implements $AuthUserDtoCopyWith<$Res> {
  _$AuthUserDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? fullName = null,
    Object? role = null,
    Object? organizationId = null,
    Object? isActive = null,
    Object? accountStatus = null,
    Object? phone = freezed,
    Object? gender = freezed,
    Object? avatarUrl = freezed,
    Object? organizationName = freezed,
    Object? organizationLogoUrl = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      organizationId: null == organizationId
          ? _value.organizationId
          : organizationId // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      accountStatus: null == accountStatus
          ? _value.accountStatus
          : accountStatus // ignore: cast_nullable_to_non_nullable
              as String,
      phone: freezed == phone
          ? _value.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String?,
      gender: freezed == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String?,
      avatarUrl: freezed == avatarUrl
          ? _value.avatarUrl
          : avatarUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      organizationName: freezed == organizationName
          ? _value.organizationName
          : organizationName // ignore: cast_nullable_to_non_nullable
              as String?,
      organizationLogoUrl: freezed == organizationLogoUrl
          ? _value.organizationLogoUrl
          : organizationLogoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AuthUserDtoImplCopyWith<$Res>
    implements $AuthUserDtoCopyWith<$Res> {
  factory _$$AuthUserDtoImplCopyWith(
          _$AuthUserDtoImpl value, $Res Function(_$AuthUserDtoImpl) then) =
      __$$AuthUserDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String email,
      String fullName,
      String role,
      int organizationId,
      bool isActive,
      String accountStatus,
      String? phone,
      String? gender,
      String? avatarUrl,
      String? organizationName,
      String? organizationLogoUrl});
}

/// @nodoc
class __$$AuthUserDtoImplCopyWithImpl<$Res>
    extends _$AuthUserDtoCopyWithImpl<$Res, _$AuthUserDtoImpl>
    implements _$$AuthUserDtoImplCopyWith<$Res> {
  __$$AuthUserDtoImplCopyWithImpl(
      _$AuthUserDtoImpl _value, $Res Function(_$AuthUserDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? fullName = null,
    Object? role = null,
    Object? organizationId = null,
    Object? isActive = null,
    Object? accountStatus = null,
    Object? phone = freezed,
    Object? gender = freezed,
    Object? avatarUrl = freezed,
    Object? organizationName = freezed,
    Object? organizationLogoUrl = freezed,
  }) {
    return _then(_$AuthUserDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: null == fullName
          ? _value.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String,
      organizationId: null == organizationId
          ? _value.organizationId
          : organizationId // ignore: cast_nullable_to_non_nullable
              as int,
      isActive: null == isActive
          ? _value.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      accountStatus: null == accountStatus
          ? _value.accountStatus
          : accountStatus // ignore: cast_nullable_to_non_nullable
              as String,
      phone: freezed == phone
          ? _value.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String?,
      gender: freezed == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String?,
      avatarUrl: freezed == avatarUrl
          ? _value.avatarUrl
          : avatarUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      organizationName: freezed == organizationName
          ? _value.organizationName
          : organizationName // ignore: cast_nullable_to_non_nullable
              as String?,
      organizationLogoUrl: freezed == organizationLogoUrl
          ? _value.organizationLogoUrl
          : organizationLogoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AuthUserDtoImpl implements _AuthUserDto {
  const _$AuthUserDtoImpl(
      {required this.id,
      required this.email,
      required this.fullName,
      required this.role,
      this.organizationId = 0,
      this.isActive = true,
      this.accountStatus = 'ACTIVE',
      this.phone,
      this.gender,
      this.avatarUrl,
      this.organizationName,
      this.organizationLogoUrl});

  factory _$AuthUserDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$AuthUserDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String email;
  @override
  final String fullName;
  @override
  final String role;
  @override
  @JsonKey()
  final int organizationId;
  @override
  @JsonKey()
  final bool isActive;
  @override
  @JsonKey()
  final String accountStatus;
  @override
  final String? phone;
  @override
  final String? gender;
  @override
  final String? avatarUrl;
  @override
  final String? organizationName;
  @override
  final String? organizationLogoUrl;

  @override
  String toString() {
    return 'AuthUserDto(id: $id, email: $email, fullName: $fullName, role: $role, organizationId: $organizationId, isActive: $isActive, accountStatus: $accountStatus, phone: $phone, gender: $gender, avatarUrl: $avatarUrl, organizationName: $organizationName, organizationLogoUrl: $organizationLogoUrl)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthUserDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.organizationId, organizationId) ||
                other.organizationId == organizationId) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.accountStatus, accountStatus) ||
                other.accountStatus == accountStatus) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.gender, gender) || other.gender == gender) &&
            (identical(other.avatarUrl, avatarUrl) ||
                other.avatarUrl == avatarUrl) &&
            (identical(other.organizationName, organizationName) ||
                other.organizationName == organizationName) &&
            (identical(other.organizationLogoUrl, organizationLogoUrl) ||
                other.organizationLogoUrl == organizationLogoUrl));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      email,
      fullName,
      role,
      organizationId,
      isActive,
      accountStatus,
      phone,
      gender,
      avatarUrl,
      organizationName,
      organizationLogoUrl);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthUserDtoImplCopyWith<_$AuthUserDtoImpl> get copyWith =>
      __$$AuthUserDtoImplCopyWithImpl<_$AuthUserDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AuthUserDtoImplToJson(
      this,
    );
  }
}

abstract class _AuthUserDto implements AuthUserDto {
  const factory _AuthUserDto(
      {required final int id,
      required final String email,
      required final String fullName,
      required final String role,
      final int organizationId,
      final bool isActive,
      final String accountStatus,
      final String? phone,
      final String? gender,
      final String? avatarUrl,
      final String? organizationName,
      final String? organizationLogoUrl}) = _$AuthUserDtoImpl;

  factory _AuthUserDto.fromJson(Map<String, dynamic> json) =
      _$AuthUserDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get email;
  @override
  String get fullName;
  @override
  String get role;
  @override
  int get organizationId;
  @override
  bool get isActive;
  @override
  String get accountStatus;
  @override
  String? get phone;
  @override
  String? get gender;
  @override
  String? get avatarUrl;
  @override
  String? get organizationName;
  @override
  String? get organizationLogoUrl;
  @override
  @JsonKey(ignore: true)
  _$$AuthUserDtoImplCopyWith<_$AuthUserDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ForgotPasswordRequest _$ForgotPasswordRequestFromJson(
    Map<String, dynamic> json) {
  return _ForgotPasswordRequest.fromJson(json);
}

/// @nodoc
mixin _$ForgotPasswordRequest {
  String get identifier => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ForgotPasswordRequestCopyWith<ForgotPasswordRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ForgotPasswordRequestCopyWith<$Res> {
  factory $ForgotPasswordRequestCopyWith(ForgotPasswordRequest value,
          $Res Function(ForgotPasswordRequest) then) =
      _$ForgotPasswordRequestCopyWithImpl<$Res, ForgotPasswordRequest>;
  @useResult
  $Res call({String identifier});
}

/// @nodoc
class _$ForgotPasswordRequestCopyWithImpl<$Res,
        $Val extends ForgotPasswordRequest>
    implements $ForgotPasswordRequestCopyWith<$Res> {
  _$ForgotPasswordRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? identifier = null,
  }) {
    return _then(_value.copyWith(
      identifier: null == identifier
          ? _value.identifier
          : identifier // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ForgotPasswordRequestImplCopyWith<$Res>
    implements $ForgotPasswordRequestCopyWith<$Res> {
  factory _$$ForgotPasswordRequestImplCopyWith(
          _$ForgotPasswordRequestImpl value,
          $Res Function(_$ForgotPasswordRequestImpl) then) =
      __$$ForgotPasswordRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String identifier});
}

/// @nodoc
class __$$ForgotPasswordRequestImplCopyWithImpl<$Res>
    extends _$ForgotPasswordRequestCopyWithImpl<$Res,
        _$ForgotPasswordRequestImpl>
    implements _$$ForgotPasswordRequestImplCopyWith<$Res> {
  __$$ForgotPasswordRequestImplCopyWithImpl(_$ForgotPasswordRequestImpl _value,
      $Res Function(_$ForgotPasswordRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? identifier = null,
  }) {
    return _then(_$ForgotPasswordRequestImpl(
      identifier: null == identifier
          ? _value.identifier
          : identifier // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ForgotPasswordRequestImpl implements _ForgotPasswordRequest {
  const _$ForgotPasswordRequestImpl({required this.identifier});

  factory _$ForgotPasswordRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$ForgotPasswordRequestImplFromJson(json);

  @override
  final String identifier;

  @override
  String toString() {
    return 'ForgotPasswordRequest(identifier: $identifier)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ForgotPasswordRequestImpl &&
            (identical(other.identifier, identifier) ||
                other.identifier == identifier));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, identifier);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ForgotPasswordRequestImplCopyWith<_$ForgotPasswordRequestImpl>
      get copyWith => __$$ForgotPasswordRequestImplCopyWithImpl<
          _$ForgotPasswordRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ForgotPasswordRequestImplToJson(
      this,
    );
  }
}

abstract class _ForgotPasswordRequest implements ForgotPasswordRequest {
  const factory _ForgotPasswordRequest({required final String identifier}) =
      _$ForgotPasswordRequestImpl;

  factory _ForgotPasswordRequest.fromJson(Map<String, dynamic> json) =
      _$ForgotPasswordRequestImpl.fromJson;

  @override
  String get identifier;
  @override
  @JsonKey(ignore: true)
  _$$ForgotPasswordRequestImplCopyWith<_$ForgotPasswordRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}
