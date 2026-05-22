import 'package:freezed_annotation/freezed_annotation.dart';

part 'library_dtos.freezed.dart';
part 'library_dtos.g.dart';

@freezed
class LibraryCategoryDto with _$LibraryCategoryDto {
  const factory LibraryCategoryDto({
    required int id,
    required String name,
    String? description,
    int? centerId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _LibraryCategoryDto;

  factory LibraryCategoryDto.fromJson(Map<String, dynamic> json) =>
      _$LibraryCategoryDtoFromJson(json);
}

@freezed
class LibraryCategorySummaryDto with _$LibraryCategorySummaryDto {
  const factory LibraryCategorySummaryDto({
    required int id,
    required String name,
    required String code,
    int? centerId,
  }) = _LibraryCategorySummaryDto;

  factory LibraryCategorySummaryDto.fromJson(Map<String, dynamic> json) =>
      _$LibraryCategorySummaryDtoFromJson(json);
}

@freezed
class LibraryItemDto with _$LibraryItemDto {
  const factory LibraryItemDto({
    required int id,
    required String title,
    String? description,
    String? bookCategory,
    @Default('ORG') String visibility,
    @Default('DOCUMENT') String type,
    @Default('ACTIVE') String status,
    @Default('') String fileName,
    @Default('') String mimeType,
    @Default(0) int fileSize,
    // coverStorageKey يكون non-null في الـ API عندما يملك الملف غلافاً
    String? coverStorageKey,
    int? categoryId,
    LibraryCategorySummaryDto? category,
    int? centerId,
    int? circleId,
    @Default(0) int createdById,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _LibraryItemDto;

  // helper: هل يملك هذا العنصر صورة غلاف؟
  const LibraryItemDto._();
  bool get hasCover => coverStorageKey != null && coverStorageKey!.isNotEmpty;

  factory LibraryItemDto.fromJson(Map<String, dynamic> json) =>
      _$LibraryItemDtoFromJson(json);
}
