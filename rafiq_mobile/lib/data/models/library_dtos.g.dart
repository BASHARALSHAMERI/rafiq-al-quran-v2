// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'library_dtos.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$LibraryCategoryDtoImpl _$$LibraryCategoryDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$LibraryCategoryDtoImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      description: json['description'] as String?,
      centerId: (json['centerId'] as num?)?.toInt(),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$$LibraryCategoryDtoImplToJson(
        _$LibraryCategoryDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'centerId': instance.centerId,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };

_$LibraryCategorySummaryDtoImpl _$$LibraryCategorySummaryDtoImplFromJson(
        Map<String, dynamic> json) =>
    _$LibraryCategorySummaryDtoImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      code: json['code'] as String,
      centerId: (json['centerId'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$LibraryCategorySummaryDtoImplToJson(
        _$LibraryCategorySummaryDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'code': instance.code,
      'centerId': instance.centerId,
    };

_$LibraryItemDtoImpl _$$LibraryItemDtoImplFromJson(Map<String, dynamic> json) =>
    _$LibraryItemDtoImpl(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String,
      description: json['description'] as String?,
      bookCategory: json['bookCategory'] as String?,
      visibility: json['visibility'] as String? ?? 'ORG',
      type: json['type'] as String? ?? 'DOCUMENT',
      status: json['status'] as String? ?? 'ACTIVE',
      fileName: json['fileName'] as String? ?? '',
      mimeType: json['mimeType'] as String? ?? '',
      fileSize: (json['fileSize'] as num?)?.toInt() ?? 0,
      coverStorageKey: json['coverStorageKey'] as String?,
      categoryId: (json['categoryId'] as num?)?.toInt(),
      category: json['category'] == null
          ? null
          : LibraryCategorySummaryDto.fromJson(
              json['category'] as Map<String, dynamic>),
      centerId: (json['centerId'] as num?)?.toInt(),
      circleId: (json['circleId'] as num?)?.toInt(),
      createdById: (json['createdById'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$$LibraryItemDtoImplToJson(
        _$LibraryItemDtoImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'bookCategory': instance.bookCategory,
      'visibility': instance.visibility,
      'type': instance.type,
      'status': instance.status,
      'fileName': instance.fileName,
      'mimeType': instance.mimeType,
      'fileSize': instance.fileSize,
      'coverStorageKey': instance.coverStorageKey,
      'categoryId': instance.categoryId,
      'category': instance.category,
      'centerId': instance.centerId,
      'circleId': instance.circleId,
      'createdById': instance.createdById,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };
