// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$LoginRequestImpl _$$LoginRequestImplFromJson(Map<String, dynamic> json) =>
    _$LoginRequestImpl(
      identifier: json['identifier'] as String,
      password: json['password'] as String,
    );

Map<String, dynamic> _$$LoginRequestImplToJson(_$LoginRequestImpl instance) =>
    <String, dynamic>{
      'identifier': instance.identifier,
      'password': instance.password,
    };

_$RefreshRequestImpl _$$RefreshRequestImplFromJson(Map<String, dynamic> json) =>
    _$RefreshRequestImpl(
      refreshToken: json['refreshToken'] as String,
    );

Map<String, dynamic> _$$RefreshRequestImplToJson(
        _$RefreshRequestImpl instance) =>
    <String, dynamic>{
      'refreshToken': instance.refreshToken,
    };

_$AuthSessionDtoImpl _$$AuthSessionDtoImplFromJson(Map<String, dynamic> json) =>
    _$AuthSessionDtoImpl(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: AuthUserDto.fromJson(json['user'] as Map<String, dynamic>),
      accessExpiresIn: json['accessExpiresIn'] as String?,
    );

Map<String, dynamic> _$$AuthSessionDtoImplToJson(
        _$AuthSessionDtoImpl instance) =>
    <String, dynamic>{
      'accessToken': instance.accessToken,
      'refreshToken': instance.refreshToken,
      'user': instance.user,
      'accessExpiresIn': instance.accessExpiresIn,
    };

_$AuthUserDtoImpl _$$AuthUserDtoImplFromJson(Map<String, dynamic> json) =>
    _$AuthUserDtoImpl(
      id: (json['id'] as num).toInt(),
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      role: json['role'] as String,
      phone: json['phone'] as String?,
      gender: json['gender'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      organizationName: json['organizationName'] as String?,
      organizationLogoUrl: json['organizationLogoUrl'] as String?,
    );

Map<String, dynamic> _$$AuthUserDtoImplToJson(_$AuthUserDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'fullName': instance.fullName,
      'role': instance.role,
      'phone': instance.phone,
      'gender': instance.gender,
      'avatarUrl': instance.avatarUrl,
      'organizationName': instance.organizationName,
      'organizationLogoUrl': instance.organizationLogoUrl,
    };

_$ForgotPasswordRequestImpl _$$ForgotPasswordRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$ForgotPasswordRequestImpl(
      identifier: json['identifier'] as String,
    );

Map<String, dynamic> _$$ForgotPasswordRequestImplToJson(
        _$ForgotPasswordRequestImpl instance) =>
    <String, dynamic>{
      'identifier': instance.identifier,
    };
