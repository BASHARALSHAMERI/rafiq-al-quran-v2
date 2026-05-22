// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'context_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CenterDtoImpl _$$CenterDtoImplFromJson(Map<String, dynamic> json) =>
    _$CenterDtoImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      domain: json['domain'] as String,
    );

Map<String, dynamic> _$$CenterDtoImplToJson(_$CenterDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'domain': instance.domain,
    };

_$CircleDtoImpl _$$CircleDtoImplFromJson(Map<String, dynamic> json) =>
    _$CircleDtoImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      centerId: json['centerId'] as String,
    );

Map<String, dynamic> _$$CircleDtoImplToJson(_$CircleDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'centerId': instance.centerId,
    };
