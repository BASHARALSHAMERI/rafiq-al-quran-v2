// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'library_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

LibraryCategoryDto _$LibraryCategoryDtoFromJson(Map<String, dynamic> json) {
  return _LibraryCategoryDto.fromJson(json);
}

/// @nodoc
mixin _$LibraryCategoryDto {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  int? get centerId => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $LibraryCategoryDtoCopyWith<LibraryCategoryDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LibraryCategoryDtoCopyWith<$Res> {
  factory $LibraryCategoryDtoCopyWith(
          LibraryCategoryDto value, $Res Function(LibraryCategoryDto) then) =
      _$LibraryCategoryDtoCopyWithImpl<$Res, LibraryCategoryDto>;
  @useResult
  $Res call(
      {int id,
      String name,
      String? description,
      int? centerId,
      DateTime? createdAt,
      DateTime? updatedAt});
}

/// @nodoc
class _$LibraryCategoryDtoCopyWithImpl<$Res, $Val extends LibraryCategoryDto>
    implements $LibraryCategoryDtoCopyWith<$Res> {
  _$LibraryCategoryDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = freezed,
    Object? centerId = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
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
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LibraryCategoryDtoImplCopyWith<$Res>
    implements $LibraryCategoryDtoCopyWith<$Res> {
  factory _$$LibraryCategoryDtoImplCopyWith(_$LibraryCategoryDtoImpl value,
          $Res Function(_$LibraryCategoryDtoImpl) then) =
      __$$LibraryCategoryDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String name,
      String? description,
      int? centerId,
      DateTime? createdAt,
      DateTime? updatedAt});
}

/// @nodoc
class __$$LibraryCategoryDtoImplCopyWithImpl<$Res>
    extends _$LibraryCategoryDtoCopyWithImpl<$Res, _$LibraryCategoryDtoImpl>
    implements _$$LibraryCategoryDtoImplCopyWith<$Res> {
  __$$LibraryCategoryDtoImplCopyWithImpl(_$LibraryCategoryDtoImpl _value,
      $Res Function(_$LibraryCategoryDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? description = freezed,
    Object? centerId = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_$LibraryCategoryDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LibraryCategoryDtoImpl implements _LibraryCategoryDto {
  const _$LibraryCategoryDtoImpl(
      {required this.id,
      required this.name,
      this.description,
      this.centerId,
      this.createdAt,
      this.updatedAt});

  factory _$LibraryCategoryDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$LibraryCategoryDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  final String? description;
  @override
  final int? centerId;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'LibraryCategoryDto(id: $id, name: $name, description: $description, centerId: $centerId, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LibraryCategoryDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, name, description, centerId, createdAt, updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LibraryCategoryDtoImplCopyWith<_$LibraryCategoryDtoImpl> get copyWith =>
      __$$LibraryCategoryDtoImplCopyWithImpl<_$LibraryCategoryDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LibraryCategoryDtoImplToJson(
      this,
    );
  }
}

abstract class _LibraryCategoryDto implements LibraryCategoryDto {
  const factory _LibraryCategoryDto(
      {required final int id,
      required final String name,
      final String? description,
      final int? centerId,
      final DateTime? createdAt,
      final DateTime? updatedAt}) = _$LibraryCategoryDtoImpl;

  factory _LibraryCategoryDto.fromJson(Map<String, dynamic> json) =
      _$LibraryCategoryDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  String? get description;
  @override
  int? get centerId;
  @override
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$LibraryCategoryDtoImplCopyWith<_$LibraryCategoryDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

LibraryCategorySummaryDto _$LibraryCategorySummaryDtoFromJson(
    Map<String, dynamic> json) {
  return _LibraryCategorySummaryDto.fromJson(json);
}

/// @nodoc
mixin _$LibraryCategorySummaryDto {
  int get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get code => throw _privateConstructorUsedError;
  int? get centerId => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $LibraryCategorySummaryDtoCopyWith<LibraryCategorySummaryDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LibraryCategorySummaryDtoCopyWith<$Res> {
  factory $LibraryCategorySummaryDtoCopyWith(LibraryCategorySummaryDto value,
          $Res Function(LibraryCategorySummaryDto) then) =
      _$LibraryCategorySummaryDtoCopyWithImpl<$Res, LibraryCategorySummaryDto>;
  @useResult
  $Res call({int id, String name, String code, int? centerId});
}

/// @nodoc
class _$LibraryCategorySummaryDtoCopyWithImpl<$Res,
        $Val extends LibraryCategorySummaryDto>
    implements $LibraryCategorySummaryDtoCopyWith<$Res> {
  _$LibraryCategorySummaryDtoCopyWithImpl(this._value, this._then);

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
    Object? centerId = freezed,
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
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$LibraryCategorySummaryDtoImplCopyWith<$Res>
    implements $LibraryCategorySummaryDtoCopyWith<$Res> {
  factory _$$LibraryCategorySummaryDtoImplCopyWith(
          _$LibraryCategorySummaryDtoImpl value,
          $Res Function(_$LibraryCategorySummaryDtoImpl) then) =
      __$$LibraryCategorySummaryDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({int id, String name, String code, int? centerId});
}

/// @nodoc
class __$$LibraryCategorySummaryDtoImplCopyWithImpl<$Res>
    extends _$LibraryCategorySummaryDtoCopyWithImpl<$Res,
        _$LibraryCategorySummaryDtoImpl>
    implements _$$LibraryCategorySummaryDtoImplCopyWith<$Res> {
  __$$LibraryCategorySummaryDtoImplCopyWithImpl(
      _$LibraryCategorySummaryDtoImpl _value,
      $Res Function(_$LibraryCategorySummaryDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? code = null,
    Object? centerId = freezed,
  }) {
    return _then(_$LibraryCategorySummaryDtoImpl(
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
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LibraryCategorySummaryDtoImpl implements _LibraryCategorySummaryDto {
  const _$LibraryCategorySummaryDtoImpl(
      {required this.id,
      required this.name,
      required this.code,
      this.centerId});

  factory _$LibraryCategorySummaryDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$LibraryCategorySummaryDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String name;
  @override
  final String code;
  @override
  final int? centerId;

  @override
  String toString() {
    return 'LibraryCategorySummaryDto(id: $id, name: $name, code: $code, centerId: $centerId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LibraryCategorySummaryDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, code, centerId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LibraryCategorySummaryDtoImplCopyWith<_$LibraryCategorySummaryDtoImpl>
      get copyWith => __$$LibraryCategorySummaryDtoImplCopyWithImpl<
          _$LibraryCategorySummaryDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LibraryCategorySummaryDtoImplToJson(
      this,
    );
  }
}

abstract class _LibraryCategorySummaryDto implements LibraryCategorySummaryDto {
  const factory _LibraryCategorySummaryDto(
      {required final int id,
      required final String name,
      required final String code,
      final int? centerId}) = _$LibraryCategorySummaryDtoImpl;

  factory _LibraryCategorySummaryDto.fromJson(Map<String, dynamic> json) =
      _$LibraryCategorySummaryDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get name;
  @override
  String get code;
  @override
  int? get centerId;
  @override
  @JsonKey(ignore: true)
  _$$LibraryCategorySummaryDtoImplCopyWith<_$LibraryCategorySummaryDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

LibraryItemDto _$LibraryItemDtoFromJson(Map<String, dynamic> json) {
  return _LibraryItemDto.fromJson(json);
}

/// @nodoc
mixin _$LibraryItemDto {
  int get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  String? get bookCategory => throw _privateConstructorUsedError;
  String get visibility => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String get fileName => throw _privateConstructorUsedError;
  String get mimeType => throw _privateConstructorUsedError;
  int get fileSize =>
      throw _privateConstructorUsedError; // coverStorageKey يكون non-null في الـ API عندما يملك الملف غلافاً
  String? get coverStorageKey => throw _privateConstructorUsedError;
  int? get categoryId => throw _privateConstructorUsedError;
  LibraryCategorySummaryDto? get category => throw _privateConstructorUsedError;
  int? get centerId => throw _privateConstructorUsedError;
  int? get circleId => throw _privateConstructorUsedError;
  int get createdById => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $LibraryItemDtoCopyWith<LibraryItemDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $LibraryItemDtoCopyWith<$Res> {
  factory $LibraryItemDtoCopyWith(
          LibraryItemDto value, $Res Function(LibraryItemDto) then) =
      _$LibraryItemDtoCopyWithImpl<$Res, LibraryItemDto>;
  @useResult
  $Res call(
      {int id,
      String title,
      String? description,
      String? bookCategory,
      String visibility,
      String type,
      String status,
      String fileName,
      String mimeType,
      int fileSize,
      String? coverStorageKey,
      int? categoryId,
      LibraryCategorySummaryDto? category,
      int? centerId,
      int? circleId,
      int createdById,
      DateTime? createdAt,
      DateTime? updatedAt});

  $LibraryCategorySummaryDtoCopyWith<$Res>? get category;
}

/// @nodoc
class _$LibraryItemDtoCopyWithImpl<$Res, $Val extends LibraryItemDto>
    implements $LibraryItemDtoCopyWith<$Res> {
  _$LibraryItemDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = freezed,
    Object? bookCategory = freezed,
    Object? visibility = null,
    Object? type = null,
    Object? status = null,
    Object? fileName = null,
    Object? mimeType = null,
    Object? fileSize = null,
    Object? coverStorageKey = freezed,
    Object? categoryId = freezed,
    Object? category = freezed,
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? createdById = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
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
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      bookCategory: freezed == bookCategory
          ? _value.bookCategory
          : bookCategory // ignore: cast_nullable_to_non_nullable
              as String?,
      visibility: null == visibility
          ? _value.visibility
          : visibility // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      fileName: null == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String,
      mimeType: null == mimeType
          ? _value.mimeType
          : mimeType // ignore: cast_nullable_to_non_nullable
              as String,
      fileSize: null == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int,
      coverStorageKey: freezed == coverStorageKey
          ? _value.coverStorageKey
          : coverStorageKey // ignore: cast_nullable_to_non_nullable
              as String?,
      categoryId: freezed == categoryId
          ? _value.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      category: freezed == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as LibraryCategorySummaryDto?,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      createdById: null == createdById
          ? _value.createdById
          : createdById // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $LibraryCategorySummaryDtoCopyWith<$Res>? get category {
    if (_value.category == null) {
      return null;
    }

    return $LibraryCategorySummaryDtoCopyWith<$Res>(_value.category!, (value) {
      return _then(_value.copyWith(category: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$LibraryItemDtoImplCopyWith<$Res>
    implements $LibraryItemDtoCopyWith<$Res> {
  factory _$$LibraryItemDtoImplCopyWith(_$LibraryItemDtoImpl value,
          $Res Function(_$LibraryItemDtoImpl) then) =
      __$$LibraryItemDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      String title,
      String? description,
      String? bookCategory,
      String visibility,
      String type,
      String status,
      String fileName,
      String mimeType,
      int fileSize,
      String? coverStorageKey,
      int? categoryId,
      LibraryCategorySummaryDto? category,
      int? centerId,
      int? circleId,
      int createdById,
      DateTime? createdAt,
      DateTime? updatedAt});

  @override
  $LibraryCategorySummaryDtoCopyWith<$Res>? get category;
}

/// @nodoc
class __$$LibraryItemDtoImplCopyWithImpl<$Res>
    extends _$LibraryItemDtoCopyWithImpl<$Res, _$LibraryItemDtoImpl>
    implements _$$LibraryItemDtoImplCopyWith<$Res> {
  __$$LibraryItemDtoImplCopyWithImpl(
      _$LibraryItemDtoImpl _value, $Res Function(_$LibraryItemDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = freezed,
    Object? bookCategory = freezed,
    Object? visibility = null,
    Object? type = null,
    Object? status = null,
    Object? fileName = null,
    Object? mimeType = null,
    Object? fileSize = null,
    Object? coverStorageKey = freezed,
    Object? categoryId = freezed,
    Object? category = freezed,
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? createdById = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_$LibraryItemDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      bookCategory: freezed == bookCategory
          ? _value.bookCategory
          : bookCategory // ignore: cast_nullable_to_non_nullable
              as String?,
      visibility: null == visibility
          ? _value.visibility
          : visibility // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      fileName: null == fileName
          ? _value.fileName
          : fileName // ignore: cast_nullable_to_non_nullable
              as String,
      mimeType: null == mimeType
          ? _value.mimeType
          : mimeType // ignore: cast_nullable_to_non_nullable
              as String,
      fileSize: null == fileSize
          ? _value.fileSize
          : fileSize // ignore: cast_nullable_to_non_nullable
              as int,
      coverStorageKey: freezed == coverStorageKey
          ? _value.coverStorageKey
          : coverStorageKey // ignore: cast_nullable_to_non_nullable
              as String?,
      categoryId: freezed == categoryId
          ? _value.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      category: freezed == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as LibraryCategorySummaryDto?,
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      createdById: null == createdById
          ? _value.createdById
          : createdById // ignore: cast_nullable_to_non_nullable
              as int,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$LibraryItemDtoImpl extends _LibraryItemDto {
  const _$LibraryItemDtoImpl(
      {required this.id,
      required this.title,
      this.description,
      this.bookCategory,
      this.visibility = 'ORG',
      this.type = 'DOCUMENT',
      this.status = 'ACTIVE',
      this.fileName = '',
      this.mimeType = '',
      this.fileSize = 0,
      this.coverStorageKey,
      this.categoryId,
      this.category,
      this.centerId,
      this.circleId,
      this.createdById = 0,
      this.createdAt,
      this.updatedAt})
      : super._();

  factory _$LibraryItemDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$LibraryItemDtoImplFromJson(json);

  @override
  final int id;
  @override
  final String title;
  @override
  final String? description;
  @override
  final String? bookCategory;
  @override
  @JsonKey()
  final String visibility;
  @override
  @JsonKey()
  final String type;
  @override
  @JsonKey()
  final String status;
  @override
  @JsonKey()
  final String fileName;
  @override
  @JsonKey()
  final String mimeType;
  @override
  @JsonKey()
  final int fileSize;
// coverStorageKey يكون non-null في الـ API عندما يملك الملف غلافاً
  @override
  final String? coverStorageKey;
  @override
  final int? categoryId;
  @override
  final LibraryCategorySummaryDto? category;
  @override
  final int? centerId;
  @override
  final int? circleId;
  @override
  @JsonKey()
  final int createdById;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'LibraryItemDto(id: $id, title: $title, description: $description, bookCategory: $bookCategory, visibility: $visibility, type: $type, status: $status, fileName: $fileName, mimeType: $mimeType, fileSize: $fileSize, coverStorageKey: $coverStorageKey, categoryId: $categoryId, category: $category, centerId: $centerId, circleId: $circleId, createdById: $createdById, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$LibraryItemDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.bookCategory, bookCategory) ||
                other.bookCategory == bookCategory) &&
            (identical(other.visibility, visibility) ||
                other.visibility == visibility) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.fileName, fileName) ||
                other.fileName == fileName) &&
            (identical(other.mimeType, mimeType) ||
                other.mimeType == mimeType) &&
            (identical(other.fileSize, fileSize) ||
                other.fileSize == fileSize) &&
            (identical(other.coverStorageKey, coverStorageKey) ||
                other.coverStorageKey == coverStorageKey) &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.createdById, createdById) ||
                other.createdById == createdById) &&
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
      title,
      description,
      bookCategory,
      visibility,
      type,
      status,
      fileName,
      mimeType,
      fileSize,
      coverStorageKey,
      categoryId,
      category,
      centerId,
      circleId,
      createdById,
      createdAt,
      updatedAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$LibraryItemDtoImplCopyWith<_$LibraryItemDtoImpl> get copyWith =>
      __$$LibraryItemDtoImplCopyWithImpl<_$LibraryItemDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$LibraryItemDtoImplToJson(
      this,
    );
  }
}

abstract class _LibraryItemDto extends LibraryItemDto {
  const factory _LibraryItemDto(
      {required final int id,
      required final String title,
      final String? description,
      final String? bookCategory,
      final String visibility,
      final String type,
      final String status,
      final String fileName,
      final String mimeType,
      final int fileSize,
      final String? coverStorageKey,
      final int? categoryId,
      final LibraryCategorySummaryDto? category,
      final int? centerId,
      final int? circleId,
      final int createdById,
      final DateTime? createdAt,
      final DateTime? updatedAt}) = _$LibraryItemDtoImpl;
  const _LibraryItemDto._() : super._();

  factory _LibraryItemDto.fromJson(Map<String, dynamic> json) =
      _$LibraryItemDtoImpl.fromJson;

  @override
  int get id;
  @override
  String get title;
  @override
  String? get description;
  @override
  String? get bookCategory;
  @override
  String get visibility;
  @override
  String get type;
  @override
  String get status;
  @override
  String get fileName;
  @override
  String get mimeType;
  @override
  int get fileSize;
  @override // coverStorageKey يكون non-null في الـ API عندما يملك الملف غلافاً
  String? get coverStorageKey;
  @override
  int? get categoryId;
  @override
  LibraryCategorySummaryDto? get category;
  @override
  int? get centerId;
  @override
  int? get circleId;
  @override
  int get createdById;
  @override
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  @JsonKey(ignore: true)
  _$$LibraryItemDtoImplCopyWith<_$LibraryItemDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
