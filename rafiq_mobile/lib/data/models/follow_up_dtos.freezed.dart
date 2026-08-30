// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'follow_up_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

FollowUpRecordDto _$FollowUpRecordDtoFromJson(Map<String, dynamic> json) {
  return _FollowUpRecordDto.fromJson(json);
}

/// @nodoc
mixin _$FollowUpRecordDto {
  int get id => throw _privateConstructorUsedError;
  int get studentId => throw _privateConstructorUsedError;
  int get circleId => throw _privateConstructorUsedError;
  int get teacherId => throw _privateConstructorUsedError;
  String get recordDate =>
      throw _privateConstructorUsedError; // ISO 8601 YYYY-MM-DD
  String get type => throw _privateConstructorUsedError; // RECITE, REVIEW, BOTH
  String get status => throw _privateConstructorUsedError; // DRAFT, FINAL
  String? get surah => throw _privateConstructorUsedError;
  int? get fromSurah => throw _privateConstructorUsedError;
  int? get toSurah => throw _privateConstructorUsedError;
  int? get fromAyah => throw _privateConstructorUsedError;
  int? get toAyah => throw _privateConstructorUsedError;
  int? get fromPage => throw _privateConstructorUsedError;
  int? get toPage => throw _privateConstructorUsedError;
  double? get pagesCount => throw _privateConstructorUsedError;
  int? get rating => throw _privateConstructorUsedError;
  int? get matnId => throw _privateConstructorUsedError;
  String? get matnName => throw _privateConstructorUsedError;
  String? get matnStatus =>
      throw _privateConstructorUsedError; // PENDING, COMPLETED, FAILED
  String? get notes => throw _privateConstructorUsedError;
  String? get idempotencyKey => throw _privateConstructorUsedError;
  int? get lockVersion =>
      throw _privateConstructorUsedError; // Joined standard fields might exist but we map what we need
  Map<String, dynamic>? get student => throw _privateConstructorUsedError;
  Map<String, dynamic>? get teacher => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $FollowUpRecordDtoCopyWith<FollowUpRecordDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $FollowUpRecordDtoCopyWith<$Res> {
  factory $FollowUpRecordDtoCopyWith(
          FollowUpRecordDto value, $Res Function(FollowUpRecordDto) then) =
      _$FollowUpRecordDtoCopyWithImpl<$Res, FollowUpRecordDto>;
  @useResult
  $Res call(
      {int id,
      int studentId,
      int circleId,
      int teacherId,
      String recordDate,
      String type,
      String status,
      String? surah,
      int? fromSurah,
      int? toSurah,
      int? fromAyah,
      int? toAyah,
      int? fromPage,
      int? toPage,
      double? pagesCount,
      int? rating,
      int? matnId,
      String? matnName,
      String? matnStatus,
      String? notes,
      String? idempotencyKey,
      int? lockVersion,
      Map<String, dynamic>? student,
      Map<String, dynamic>? teacher});
}

/// @nodoc
class _$FollowUpRecordDtoCopyWithImpl<$Res, $Val extends FollowUpRecordDto>
    implements $FollowUpRecordDtoCopyWith<$Res> {
  _$FollowUpRecordDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? studentId = null,
    Object? circleId = null,
    Object? teacherId = null,
    Object? recordDate = null,
    Object? type = null,
    Object? status = null,
    Object? surah = freezed,
    Object? fromSurah = freezed,
    Object? toSurah = freezed,
    Object? fromAyah = freezed,
    Object? toAyah = freezed,
    Object? fromPage = freezed,
    Object? toPage = freezed,
    Object? pagesCount = freezed,
    Object? rating = freezed,
    Object? matnId = freezed,
    Object? matnName = freezed,
    Object? matnStatus = freezed,
    Object? notes = freezed,
    Object? idempotencyKey = freezed,
    Object? lockVersion = freezed,
    Object? student = freezed,
    Object? teacher = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      teacherId: null == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int,
      recordDate: null == recordDate
          ? _value.recordDate
          : recordDate // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      surah: freezed == surah
          ? _value.surah
          : surah // ignore: cast_nullable_to_non_nullable
              as String?,
      fromSurah: freezed == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      toSurah: freezed == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromAyah: freezed == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      toAyah: freezed == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromPage: freezed == fromPage
          ? _value.fromPage
          : fromPage // ignore: cast_nullable_to_non_nullable
              as int?,
      toPage: freezed == toPage
          ? _value.toPage
          : toPage // ignore: cast_nullable_to_non_nullable
              as int?,
      pagesCount: freezed == pagesCount
          ? _value.pagesCount
          : pagesCount // ignore: cast_nullable_to_non_nullable
              as double?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int?,
      matnId: freezed == matnId
          ? _value.matnId
          : matnId // ignore: cast_nullable_to_non_nullable
              as int?,
      matnName: freezed == matnName
          ? _value.matnName
          : matnName // ignore: cast_nullable_to_non_nullable
              as String?,
      matnStatus: freezed == matnStatus
          ? _value.matnStatus
          : matnStatus // ignore: cast_nullable_to_non_nullable
              as String?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      idempotencyKey: freezed == idempotencyKey
          ? _value.idempotencyKey
          : idempotencyKey // ignore: cast_nullable_to_non_nullable
              as String?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
      student: freezed == student
          ? _value.student
          : student // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      teacher: freezed == teacher
          ? _value.teacher
          : teacher // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$FollowUpRecordDtoImplCopyWith<$Res>
    implements $FollowUpRecordDtoCopyWith<$Res> {
  factory _$$FollowUpRecordDtoImplCopyWith(_$FollowUpRecordDtoImpl value,
          $Res Function(_$FollowUpRecordDtoImpl) then) =
      __$$FollowUpRecordDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int studentId,
      int circleId,
      int teacherId,
      String recordDate,
      String type,
      String status,
      String? surah,
      int? fromSurah,
      int? toSurah,
      int? fromAyah,
      int? toAyah,
      int? fromPage,
      int? toPage,
      double? pagesCount,
      int? rating,
      int? matnId,
      String? matnName,
      String? matnStatus,
      String? notes,
      String? idempotencyKey,
      int? lockVersion,
      Map<String, dynamic>? student,
      Map<String, dynamic>? teacher});
}

/// @nodoc
class __$$FollowUpRecordDtoImplCopyWithImpl<$Res>
    extends _$FollowUpRecordDtoCopyWithImpl<$Res, _$FollowUpRecordDtoImpl>
    implements _$$FollowUpRecordDtoImplCopyWith<$Res> {
  __$$FollowUpRecordDtoImplCopyWithImpl(_$FollowUpRecordDtoImpl _value,
      $Res Function(_$FollowUpRecordDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? studentId = null,
    Object? circleId = null,
    Object? teacherId = null,
    Object? recordDate = null,
    Object? type = null,
    Object? status = null,
    Object? surah = freezed,
    Object? fromSurah = freezed,
    Object? toSurah = freezed,
    Object? fromAyah = freezed,
    Object? toAyah = freezed,
    Object? fromPage = freezed,
    Object? toPage = freezed,
    Object? pagesCount = freezed,
    Object? rating = freezed,
    Object? matnId = freezed,
    Object? matnName = freezed,
    Object? matnStatus = freezed,
    Object? notes = freezed,
    Object? idempotencyKey = freezed,
    Object? lockVersion = freezed,
    Object? student = freezed,
    Object? teacher = freezed,
  }) {
    return _then(_$FollowUpRecordDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      teacherId: null == teacherId
          ? _value.teacherId
          : teacherId // ignore: cast_nullable_to_non_nullable
              as int,
      recordDate: null == recordDate
          ? _value.recordDate
          : recordDate // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      surah: freezed == surah
          ? _value.surah
          : surah // ignore: cast_nullable_to_non_nullable
              as String?,
      fromSurah: freezed == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      toSurah: freezed == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromAyah: freezed == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      toAyah: freezed == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromPage: freezed == fromPage
          ? _value.fromPage
          : fromPage // ignore: cast_nullable_to_non_nullable
              as int?,
      toPage: freezed == toPage
          ? _value.toPage
          : toPage // ignore: cast_nullable_to_non_nullable
              as int?,
      pagesCount: freezed == pagesCount
          ? _value.pagesCount
          : pagesCount // ignore: cast_nullable_to_non_nullable
              as double?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int?,
      matnId: freezed == matnId
          ? _value.matnId
          : matnId // ignore: cast_nullable_to_non_nullable
              as int?,
      matnName: freezed == matnName
          ? _value.matnName
          : matnName // ignore: cast_nullable_to_non_nullable
              as String?,
      matnStatus: freezed == matnStatus
          ? _value.matnStatus
          : matnStatus // ignore: cast_nullable_to_non_nullable
              as String?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      idempotencyKey: freezed == idempotencyKey
          ? _value.idempotencyKey
          : idempotencyKey // ignore: cast_nullable_to_non_nullable
              as String?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
      student: freezed == student
          ? _value._student
          : student // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      teacher: freezed == teacher
          ? _value._teacher
          : teacher // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$FollowUpRecordDtoImpl implements _FollowUpRecordDto {
  const _$FollowUpRecordDtoImpl(
      {required this.id,
      required this.studentId,
      required this.circleId,
      required this.teacherId,
      required this.recordDate,
      required this.type,
      required this.status,
      this.surah,
      this.fromSurah,
      this.toSurah,
      this.fromAyah,
      this.toAyah,
      this.fromPage,
      this.toPage,
      this.pagesCount,
      this.rating,
      this.matnId,
      this.matnName,
      this.matnStatus,
      this.notes,
      this.idempotencyKey,
      this.lockVersion,
      final Map<String, dynamic>? student,
      final Map<String, dynamic>? teacher})
      : _student = student,
        _teacher = teacher;

  factory _$FollowUpRecordDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$FollowUpRecordDtoImplFromJson(json);

  @override
  final int id;
  @override
  final int studentId;
  @override
  final int circleId;
  @override
  final int teacherId;
  @override
  final String recordDate;
// ISO 8601 YYYY-MM-DD
  @override
  final String type;
// RECITE, REVIEW, BOTH
  @override
  final String status;
// DRAFT, FINAL
  @override
  final String? surah;
  @override
  final int? fromSurah;
  @override
  final int? toSurah;
  @override
  final int? fromAyah;
  @override
  final int? toAyah;
  @override
  final int? fromPage;
  @override
  final int? toPage;
  @override
  final double? pagesCount;
  @override
  final int? rating;
  @override
  final int? matnId;
  @override
  final String? matnName;
  @override
  final String? matnStatus;
// PENDING, COMPLETED, FAILED
  @override
  final String? notes;
  @override
  final String? idempotencyKey;
  @override
  final int? lockVersion;
// Joined standard fields might exist but we map what we need
  final Map<String, dynamic>? _student;
// Joined standard fields might exist but we map what we need
  @override
  Map<String, dynamic>? get student {
    final value = _student;
    if (value == null) return null;
    if (_student is EqualUnmodifiableMapView) return _student;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  final Map<String, dynamic>? _teacher;
  @override
  Map<String, dynamic>? get teacher {
    final value = _teacher;
    if (value == null) return null;
    if (_teacher is EqualUnmodifiableMapView) return _teacher;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'FollowUpRecordDto(id: $id, studentId: $studentId, circleId: $circleId, teacherId: $teacherId, recordDate: $recordDate, type: $type, status: $status, surah: $surah, fromSurah: $fromSurah, toSurah: $toSurah, fromAyah: $fromAyah, toAyah: $toAyah, fromPage: $fromPage, toPage: $toPage, pagesCount: $pagesCount, rating: $rating, matnId: $matnId, matnName: $matnName, matnStatus: $matnStatus, notes: $notes, idempotencyKey: $idempotencyKey, lockVersion: $lockVersion, student: $student, teacher: $teacher)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FollowUpRecordDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.studentId, studentId) ||
                other.studentId == studentId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.teacherId, teacherId) ||
                other.teacherId == teacherId) &&
            (identical(other.recordDate, recordDate) ||
                other.recordDate == recordDate) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.surah, surah) || other.surah == surah) &&
            (identical(other.fromSurah, fromSurah) ||
                other.fromSurah == fromSurah) &&
            (identical(other.toSurah, toSurah) || other.toSurah == toSurah) &&
            (identical(other.fromAyah, fromAyah) ||
                other.fromAyah == fromAyah) &&
            (identical(other.toAyah, toAyah) || other.toAyah == toAyah) &&
            (identical(other.fromPage, fromPage) ||
                other.fromPage == fromPage) &&
            (identical(other.toPage, toPage) || other.toPage == toPage) &&
            (identical(other.pagesCount, pagesCount) ||
                other.pagesCount == pagesCount) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.matnId, matnId) || other.matnId == matnId) &&
            (identical(other.matnName, matnName) ||
                other.matnName == matnName) &&
            (identical(other.matnStatus, matnStatus) ||
                other.matnStatus == matnStatus) &&
            (identical(other.notes, notes) || other.notes == notes) &&
            (identical(other.idempotencyKey, idempotencyKey) ||
                other.idempotencyKey == idempotencyKey) &&
            (identical(other.lockVersion, lockVersion) ||
                other.lockVersion == lockVersion) &&
            const DeepCollectionEquality().equals(other._student, _student) &&
            const DeepCollectionEquality().equals(other._teacher, _teacher));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        studentId,
        circleId,
        teacherId,
        recordDate,
        type,
        status,
        surah,
        fromSurah,
        toSurah,
        fromAyah,
        toAyah,
        fromPage,
        toPage,
        pagesCount,
        rating,
        matnId,
        matnName,
        matnStatus,
        notes,
        idempotencyKey,
        lockVersion,
        const DeepCollectionEquality().hash(_student),
        const DeepCollectionEquality().hash(_teacher)
      ]);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$FollowUpRecordDtoImplCopyWith<_$FollowUpRecordDtoImpl> get copyWith =>
      __$$FollowUpRecordDtoImplCopyWithImpl<_$FollowUpRecordDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$FollowUpRecordDtoImplToJson(
      this,
    );
  }
}

abstract class _FollowUpRecordDto implements FollowUpRecordDto {
  const factory _FollowUpRecordDto(
      {required final int id,
      required final int studentId,
      required final int circleId,
      required final int teacherId,
      required final String recordDate,
      required final String type,
      required final String status,
      final String? surah,
      final int? fromSurah,
      final int? toSurah,
      final int? fromAyah,
      final int? toAyah,
      final int? fromPage,
      final int? toPage,
      final double? pagesCount,
      final int? rating,
      final int? matnId,
      final String? matnName,
      final String? matnStatus,
      final String? notes,
      final String? idempotencyKey,
      final int? lockVersion,
      final Map<String, dynamic>? student,
      final Map<String, dynamic>? teacher}) = _$FollowUpRecordDtoImpl;

  factory _FollowUpRecordDto.fromJson(Map<String, dynamic> json) =
      _$FollowUpRecordDtoImpl.fromJson;

  @override
  int get id;
  @override
  int get studentId;
  @override
  int get circleId;
  @override
  int get teacherId;
  @override
  String get recordDate;
  @override // ISO 8601 YYYY-MM-DD
  String get type;
  @override // RECITE, REVIEW, BOTH
  String get status;
  @override // DRAFT, FINAL
  String? get surah;
  @override
  int? get fromSurah;
  @override
  int? get toSurah;
  @override
  int? get fromAyah;
  @override
  int? get toAyah;
  @override
  int? get fromPage;
  @override
  int? get toPage;
  @override
  double? get pagesCount;
  @override
  int? get rating;
  @override
  int? get matnId;
  @override
  String? get matnName;
  @override
  String? get matnStatus;
  @override // PENDING, COMPLETED, FAILED
  String? get notes;
  @override
  String? get idempotencyKey;
  @override
  int? get lockVersion;
  @override // Joined standard fields might exist but we map what we need
  Map<String, dynamic>? get student;
  @override
  Map<String, dynamic>? get teacher;
  @override
  @JsonKey(ignore: true)
  _$$FollowUpRecordDtoImplCopyWith<_$FollowUpRecordDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CreateFollowUpRequestDto _$CreateFollowUpRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _CreateFollowUpRequestDto.fromJson(json);
}

/// @nodoc
mixin _$CreateFollowUpRequestDto {
  int get studentId => throw _privateConstructorUsedError;
  int get circleId => throw _privateConstructorUsedError;
  String get recordDate => throw _privateConstructorUsedError; // YYYY-MM-DD
  String get type => throw _privateConstructorUsedError; // RECITE, REVIEW, BOTH
  String? get status =>
      throw _privateConstructorUsedError; // DRAFT, FINAL (default FINAL usually if not draft)
  String? get surah => throw _privateConstructorUsedError;
  int? get fromSurah => throw _privateConstructorUsedError;
  int? get toSurah => throw _privateConstructorUsedError;
  int? get fromAyah => throw _privateConstructorUsedError;
  int? get toAyah => throw _privateConstructorUsedError;
  double? get pagesCount => throw _privateConstructorUsedError;
  int? get rating => throw _privateConstructorUsedError;
  int? get matnId => throw _privateConstructorUsedError;
  String? get matnName => throw _privateConstructorUsedError;
  String? get matnStatus => throw _privateConstructorUsedError;
  String? get notes => throw _privateConstructorUsedError;
  String? get idempotencyKey => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $CreateFollowUpRequestDtoCopyWith<CreateFollowUpRequestDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateFollowUpRequestDtoCopyWith<$Res> {
  factory $CreateFollowUpRequestDtoCopyWith(CreateFollowUpRequestDto value,
          $Res Function(CreateFollowUpRequestDto) then) =
      _$CreateFollowUpRequestDtoCopyWithImpl<$Res, CreateFollowUpRequestDto>;
  @useResult
  $Res call(
      {int studentId,
      int circleId,
      String recordDate,
      String type,
      String? status,
      String? surah,
      int? fromSurah,
      int? toSurah,
      int? fromAyah,
      int? toAyah,
      double? pagesCount,
      int? rating,
      int? matnId,
      String? matnName,
      String? matnStatus,
      String? notes,
      String? idempotencyKey});
}

/// @nodoc
class _$CreateFollowUpRequestDtoCopyWithImpl<$Res,
        $Val extends CreateFollowUpRequestDto>
    implements $CreateFollowUpRequestDtoCopyWith<$Res> {
  _$CreateFollowUpRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? circleId = null,
    Object? recordDate = null,
    Object? type = null,
    Object? status = freezed,
    Object? surah = freezed,
    Object? fromSurah = freezed,
    Object? toSurah = freezed,
    Object? fromAyah = freezed,
    Object? toAyah = freezed,
    Object? pagesCount = freezed,
    Object? rating = freezed,
    Object? matnId = freezed,
    Object? matnName = freezed,
    Object? matnStatus = freezed,
    Object? notes = freezed,
    Object? idempotencyKey = freezed,
  }) {
    return _then(_value.copyWith(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      recordDate: null == recordDate
          ? _value.recordDate
          : recordDate // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      surah: freezed == surah
          ? _value.surah
          : surah // ignore: cast_nullable_to_non_nullable
              as String?,
      fromSurah: freezed == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      toSurah: freezed == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromAyah: freezed == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      toAyah: freezed == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      pagesCount: freezed == pagesCount
          ? _value.pagesCount
          : pagesCount // ignore: cast_nullable_to_non_nullable
              as double?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int?,
      matnId: freezed == matnId
          ? _value.matnId
          : matnId // ignore: cast_nullable_to_non_nullable
              as int?,
      matnName: freezed == matnName
          ? _value.matnName
          : matnName // ignore: cast_nullable_to_non_nullable
              as String?,
      matnStatus: freezed == matnStatus
          ? _value.matnStatus
          : matnStatus // ignore: cast_nullable_to_non_nullable
              as String?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      idempotencyKey: freezed == idempotencyKey
          ? _value.idempotencyKey
          : idempotencyKey // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateFollowUpRequestDtoImplCopyWith<$Res>
    implements $CreateFollowUpRequestDtoCopyWith<$Res> {
  factory _$$CreateFollowUpRequestDtoImplCopyWith(
          _$CreateFollowUpRequestDtoImpl value,
          $Res Function(_$CreateFollowUpRequestDtoImpl) then) =
      __$$CreateFollowUpRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int studentId,
      int circleId,
      String recordDate,
      String type,
      String? status,
      String? surah,
      int? fromSurah,
      int? toSurah,
      int? fromAyah,
      int? toAyah,
      double? pagesCount,
      int? rating,
      int? matnId,
      String? matnName,
      String? matnStatus,
      String? notes,
      String? idempotencyKey});
}

/// @nodoc
class __$$CreateFollowUpRequestDtoImplCopyWithImpl<$Res>
    extends _$CreateFollowUpRequestDtoCopyWithImpl<$Res,
        _$CreateFollowUpRequestDtoImpl>
    implements _$$CreateFollowUpRequestDtoImplCopyWith<$Res> {
  __$$CreateFollowUpRequestDtoImplCopyWithImpl(
      _$CreateFollowUpRequestDtoImpl _value,
      $Res Function(_$CreateFollowUpRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? circleId = null,
    Object? recordDate = null,
    Object? type = null,
    Object? status = freezed,
    Object? surah = freezed,
    Object? fromSurah = freezed,
    Object? toSurah = freezed,
    Object? fromAyah = freezed,
    Object? toAyah = freezed,
    Object? pagesCount = freezed,
    Object? rating = freezed,
    Object? matnId = freezed,
    Object? matnName = freezed,
    Object? matnStatus = freezed,
    Object? notes = freezed,
    Object? idempotencyKey = freezed,
  }) {
    return _then(_$CreateFollowUpRequestDtoImpl(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int,
      recordDate: null == recordDate
          ? _value.recordDate
          : recordDate // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      surah: freezed == surah
          ? _value.surah
          : surah // ignore: cast_nullable_to_non_nullable
              as String?,
      fromSurah: freezed == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      toSurah: freezed == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromAyah: freezed == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      toAyah: freezed == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      pagesCount: freezed == pagesCount
          ? _value.pagesCount
          : pagesCount // ignore: cast_nullable_to_non_nullable
              as double?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int?,
      matnId: freezed == matnId
          ? _value.matnId
          : matnId // ignore: cast_nullable_to_non_nullable
              as int?,
      matnName: freezed == matnName
          ? _value.matnName
          : matnName // ignore: cast_nullable_to_non_nullable
              as String?,
      matnStatus: freezed == matnStatus
          ? _value.matnStatus
          : matnStatus // ignore: cast_nullable_to_non_nullable
              as String?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      idempotencyKey: freezed == idempotencyKey
          ? _value.idempotencyKey
          : idempotencyKey // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateFollowUpRequestDtoImpl implements _CreateFollowUpRequestDto {
  const _$CreateFollowUpRequestDtoImpl(
      {required this.studentId,
      required this.circleId,
      required this.recordDate,
      required this.type,
      this.status,
      this.surah,
      this.fromSurah,
      this.toSurah,
      this.fromAyah,
      this.toAyah,
      this.pagesCount,
      this.rating,
      this.matnId,
      this.matnName,
      this.matnStatus,
      this.notes,
      this.idempotencyKey});

  factory _$CreateFollowUpRequestDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$CreateFollowUpRequestDtoImplFromJson(json);

  @override
  final int studentId;
  @override
  final int circleId;
  @override
  final String recordDate;
// YYYY-MM-DD
  @override
  final String type;
// RECITE, REVIEW, BOTH
  @override
  final String? status;
// DRAFT, FINAL (default FINAL usually if not draft)
  @override
  final String? surah;
  @override
  final int? fromSurah;
  @override
  final int? toSurah;
  @override
  final int? fromAyah;
  @override
  final int? toAyah;
  @override
  final double? pagesCount;
  @override
  final int? rating;
  @override
  final int? matnId;
  @override
  final String? matnName;
  @override
  final String? matnStatus;
  @override
  final String? notes;
  @override
  final String? idempotencyKey;

  @override
  String toString() {
    return 'CreateFollowUpRequestDto(studentId: $studentId, circleId: $circleId, recordDate: $recordDate, type: $type, status: $status, surah: $surah, fromSurah: $fromSurah, toSurah: $toSurah, fromAyah: $fromAyah, toAyah: $toAyah, pagesCount: $pagesCount, rating: $rating, matnId: $matnId, matnName: $matnName, matnStatus: $matnStatus, notes: $notes, idempotencyKey: $idempotencyKey)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateFollowUpRequestDtoImpl &&
            (identical(other.studentId, studentId) ||
                other.studentId == studentId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.recordDate, recordDate) ||
                other.recordDate == recordDate) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.surah, surah) || other.surah == surah) &&
            (identical(other.fromSurah, fromSurah) ||
                other.fromSurah == fromSurah) &&
            (identical(other.toSurah, toSurah) || other.toSurah == toSurah) &&
            (identical(other.fromAyah, fromAyah) ||
                other.fromAyah == fromAyah) &&
            (identical(other.toAyah, toAyah) || other.toAyah == toAyah) &&
            (identical(other.pagesCount, pagesCount) ||
                other.pagesCount == pagesCount) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.matnId, matnId) || other.matnId == matnId) &&
            (identical(other.matnName, matnName) ||
                other.matnName == matnName) &&
            (identical(other.matnStatus, matnStatus) ||
                other.matnStatus == matnStatus) &&
            (identical(other.notes, notes) || other.notes == notes) &&
            (identical(other.idempotencyKey, idempotencyKey) ||
                other.idempotencyKey == idempotencyKey));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      studentId,
      circleId,
      recordDate,
      type,
      status,
      surah,
      fromSurah,
      toSurah,
      fromAyah,
      toAyah,
      pagesCount,
      rating,
      matnId,
      matnName,
      matnStatus,
      notes,
      idempotencyKey);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateFollowUpRequestDtoImplCopyWith<_$CreateFollowUpRequestDtoImpl>
      get copyWith => __$$CreateFollowUpRequestDtoImplCopyWithImpl<
          _$CreateFollowUpRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateFollowUpRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _CreateFollowUpRequestDto implements CreateFollowUpRequestDto {
  const factory _CreateFollowUpRequestDto(
      {required final int studentId,
      required final int circleId,
      required final String recordDate,
      required final String type,
      final String? status,
      final String? surah,
      final int? fromSurah,
      final int? toSurah,
      final int? fromAyah,
      final int? toAyah,
      final double? pagesCount,
      final int? rating,
      final int? matnId,
      final String? matnName,
      final String? matnStatus,
      final String? notes,
      final String? idempotencyKey}) = _$CreateFollowUpRequestDtoImpl;

  factory _CreateFollowUpRequestDto.fromJson(Map<String, dynamic> json) =
      _$CreateFollowUpRequestDtoImpl.fromJson;

  @override
  int get studentId;
  @override
  int get circleId;
  @override
  String get recordDate;
  @override // YYYY-MM-DD
  String get type;
  @override // RECITE, REVIEW, BOTH
  String? get status;
  @override // DRAFT, FINAL (default FINAL usually if not draft)
  String? get surah;
  @override
  int? get fromSurah;
  @override
  int? get toSurah;
  @override
  int? get fromAyah;
  @override
  int? get toAyah;
  @override
  double? get pagesCount;
  @override
  int? get rating;
  @override
  int? get matnId;
  @override
  String? get matnName;
  @override
  String? get matnStatus;
  @override
  String? get notes;
  @override
  String? get idempotencyKey;
  @override
  @JsonKey(ignore: true)
  _$$CreateFollowUpRequestDtoImplCopyWith<_$CreateFollowUpRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

UpdateFollowUpRequestDto _$UpdateFollowUpRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _UpdateFollowUpRequestDto.fromJson(json);
}

/// @nodoc
mixin _$UpdateFollowUpRequestDto {
  String? get recordDate => throw _privateConstructorUsedError;
  String? get type => throw _privateConstructorUsedError;
  String? get surah => throw _privateConstructorUsedError;
  int? get fromSurah => throw _privateConstructorUsedError;
  int? get toSurah => throw _privateConstructorUsedError;
  int? get fromAyah => throw _privateConstructorUsedError;
  int? get toAyah => throw _privateConstructorUsedError;
  double? get pagesCount => throw _privateConstructorUsedError;
  int? get rating => throw _privateConstructorUsedError;
  int? get matnId => throw _privateConstructorUsedError;
  String? get matnName => throw _privateConstructorUsedError;
  String? get matnStatus => throw _privateConstructorUsedError;
  String? get notes => throw _privateConstructorUsedError;
  int? get lockVersion => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $UpdateFollowUpRequestDtoCopyWith<UpdateFollowUpRequestDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UpdateFollowUpRequestDtoCopyWith<$Res> {
  factory $UpdateFollowUpRequestDtoCopyWith(UpdateFollowUpRequestDto value,
          $Res Function(UpdateFollowUpRequestDto) then) =
      _$UpdateFollowUpRequestDtoCopyWithImpl<$Res, UpdateFollowUpRequestDto>;
  @useResult
  $Res call(
      {String? recordDate,
      String? type,
      String? surah,
      int? fromSurah,
      int? toSurah,
      int? fromAyah,
      int? toAyah,
      double? pagesCount,
      int? rating,
      int? matnId,
      String? matnName,
      String? matnStatus,
      String? notes,
      int? lockVersion});
}

/// @nodoc
class _$UpdateFollowUpRequestDtoCopyWithImpl<$Res,
        $Val extends UpdateFollowUpRequestDto>
    implements $UpdateFollowUpRequestDtoCopyWith<$Res> {
  _$UpdateFollowUpRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? recordDate = freezed,
    Object? type = freezed,
    Object? surah = freezed,
    Object? fromSurah = freezed,
    Object? toSurah = freezed,
    Object? fromAyah = freezed,
    Object? toAyah = freezed,
    Object? pagesCount = freezed,
    Object? rating = freezed,
    Object? matnId = freezed,
    Object? matnName = freezed,
    Object? matnStatus = freezed,
    Object? notes = freezed,
    Object? lockVersion = freezed,
  }) {
    return _then(_value.copyWith(
      recordDate: freezed == recordDate
          ? _value.recordDate
          : recordDate // ignore: cast_nullable_to_non_nullable
              as String?,
      type: freezed == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      surah: freezed == surah
          ? _value.surah
          : surah // ignore: cast_nullable_to_non_nullable
              as String?,
      fromSurah: freezed == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      toSurah: freezed == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromAyah: freezed == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      toAyah: freezed == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      pagesCount: freezed == pagesCount
          ? _value.pagesCount
          : pagesCount // ignore: cast_nullable_to_non_nullable
              as double?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int?,
      matnId: freezed == matnId
          ? _value.matnId
          : matnId // ignore: cast_nullable_to_non_nullable
              as int?,
      matnName: freezed == matnName
          ? _value.matnName
          : matnName // ignore: cast_nullable_to_non_nullable
              as String?,
      matnStatus: freezed == matnStatus
          ? _value.matnStatus
          : matnStatus // ignore: cast_nullable_to_non_nullable
              as String?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UpdateFollowUpRequestDtoImplCopyWith<$Res>
    implements $UpdateFollowUpRequestDtoCopyWith<$Res> {
  factory _$$UpdateFollowUpRequestDtoImplCopyWith(
          _$UpdateFollowUpRequestDtoImpl value,
          $Res Function(_$UpdateFollowUpRequestDtoImpl) then) =
      __$$UpdateFollowUpRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String? recordDate,
      String? type,
      String? surah,
      int? fromSurah,
      int? toSurah,
      int? fromAyah,
      int? toAyah,
      double? pagesCount,
      int? rating,
      int? matnId,
      String? matnName,
      String? matnStatus,
      String? notes,
      int? lockVersion});
}

/// @nodoc
class __$$UpdateFollowUpRequestDtoImplCopyWithImpl<$Res>
    extends _$UpdateFollowUpRequestDtoCopyWithImpl<$Res,
        _$UpdateFollowUpRequestDtoImpl>
    implements _$$UpdateFollowUpRequestDtoImplCopyWith<$Res> {
  __$$UpdateFollowUpRequestDtoImplCopyWithImpl(
      _$UpdateFollowUpRequestDtoImpl _value,
      $Res Function(_$UpdateFollowUpRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? recordDate = freezed,
    Object? type = freezed,
    Object? surah = freezed,
    Object? fromSurah = freezed,
    Object? toSurah = freezed,
    Object? fromAyah = freezed,
    Object? toAyah = freezed,
    Object? pagesCount = freezed,
    Object? rating = freezed,
    Object? matnId = freezed,
    Object? matnName = freezed,
    Object? matnStatus = freezed,
    Object? notes = freezed,
    Object? lockVersion = freezed,
  }) {
    return _then(_$UpdateFollowUpRequestDtoImpl(
      recordDate: freezed == recordDate
          ? _value.recordDate
          : recordDate // ignore: cast_nullable_to_non_nullable
              as String?,
      type: freezed == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as String?,
      surah: freezed == surah
          ? _value.surah
          : surah // ignore: cast_nullable_to_non_nullable
              as String?,
      fromSurah: freezed == fromSurah
          ? _value.fromSurah
          : fromSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      toSurah: freezed == toSurah
          ? _value.toSurah
          : toSurah // ignore: cast_nullable_to_non_nullable
              as int?,
      fromAyah: freezed == fromAyah
          ? _value.fromAyah
          : fromAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      toAyah: freezed == toAyah
          ? _value.toAyah
          : toAyah // ignore: cast_nullable_to_non_nullable
              as int?,
      pagesCount: freezed == pagesCount
          ? _value.pagesCount
          : pagesCount // ignore: cast_nullable_to_non_nullable
              as double?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as int?,
      matnId: freezed == matnId
          ? _value.matnId
          : matnId // ignore: cast_nullable_to_non_nullable
              as int?,
      matnName: freezed == matnName
          ? _value.matnName
          : matnName // ignore: cast_nullable_to_non_nullable
              as String?,
      matnStatus: freezed == matnStatus
          ? _value.matnStatus
          : matnStatus // ignore: cast_nullable_to_non_nullable
              as String?,
      notes: freezed == notes
          ? _value.notes
          : notes // ignore: cast_nullable_to_non_nullable
              as String?,
      lockVersion: freezed == lockVersion
          ? _value.lockVersion
          : lockVersion // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UpdateFollowUpRequestDtoImpl implements _UpdateFollowUpRequestDto {
  const _$UpdateFollowUpRequestDtoImpl(
      {this.recordDate,
      this.type,
      this.surah,
      this.fromSurah,
      this.toSurah,
      this.fromAyah,
      this.toAyah,
      this.pagesCount,
      this.rating,
      this.matnId,
      this.matnName,
      this.matnStatus,
      this.notes,
      this.lockVersion});

  factory _$UpdateFollowUpRequestDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$UpdateFollowUpRequestDtoImplFromJson(json);

  @override
  final String? recordDate;
  @override
  final String? type;
  @override
  final String? surah;
  @override
  final int? fromSurah;
  @override
  final int? toSurah;
  @override
  final int? fromAyah;
  @override
  final int? toAyah;
  @override
  final double? pagesCount;
  @override
  final int? rating;
  @override
  final int? matnId;
  @override
  final String? matnName;
  @override
  final String? matnStatus;
  @override
  final String? notes;
  @override
  final int? lockVersion;

  @override
  String toString() {
    return 'UpdateFollowUpRequestDto(recordDate: $recordDate, type: $type, surah: $surah, fromSurah: $fromSurah, toSurah: $toSurah, fromAyah: $fromAyah, toAyah: $toAyah, pagesCount: $pagesCount, rating: $rating, matnId: $matnId, matnName: $matnName, matnStatus: $matnStatus, notes: $notes, lockVersion: $lockVersion)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UpdateFollowUpRequestDtoImpl &&
            (identical(other.recordDate, recordDate) ||
                other.recordDate == recordDate) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.surah, surah) || other.surah == surah) &&
            (identical(other.fromSurah, fromSurah) ||
                other.fromSurah == fromSurah) &&
            (identical(other.toSurah, toSurah) || other.toSurah == toSurah) &&
            (identical(other.fromAyah, fromAyah) ||
                other.fromAyah == fromAyah) &&
            (identical(other.toAyah, toAyah) || other.toAyah == toAyah) &&
            (identical(other.pagesCount, pagesCount) ||
                other.pagesCount == pagesCount) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.matnId, matnId) || other.matnId == matnId) &&
            (identical(other.matnName, matnName) ||
                other.matnName == matnName) &&
            (identical(other.matnStatus, matnStatus) ||
                other.matnStatus == matnStatus) &&
            (identical(other.notes, notes) || other.notes == notes) &&
            (identical(other.lockVersion, lockVersion) ||
                other.lockVersion == lockVersion));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      recordDate,
      type,
      surah,
      fromSurah,
      toSurah,
      fromAyah,
      toAyah,
      pagesCount,
      rating,
      matnId,
      matnName,
      matnStatus,
      notes,
      lockVersion);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UpdateFollowUpRequestDtoImplCopyWith<_$UpdateFollowUpRequestDtoImpl>
      get copyWith => __$$UpdateFollowUpRequestDtoImplCopyWithImpl<
          _$UpdateFollowUpRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UpdateFollowUpRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _UpdateFollowUpRequestDto implements UpdateFollowUpRequestDto {
  const factory _UpdateFollowUpRequestDto(
      {final String? recordDate,
      final String? type,
      final String? surah,
      final int? fromSurah,
      final int? toSurah,
      final int? fromAyah,
      final int? toAyah,
      final double? pagesCount,
      final int? rating,
      final int? matnId,
      final String? matnName,
      final String? matnStatus,
      final String? notes,
      final int? lockVersion}) = _$UpdateFollowUpRequestDtoImpl;

  factory _UpdateFollowUpRequestDto.fromJson(Map<String, dynamic> json) =
      _$UpdateFollowUpRequestDtoImpl.fromJson;

  @override
  String? get recordDate;
  @override
  String? get type;
  @override
  String? get surah;
  @override
  int? get fromSurah;
  @override
  int? get toSurah;
  @override
  int? get fromAyah;
  @override
  int? get toAyah;
  @override
  double? get pagesCount;
  @override
  int? get rating;
  @override
  int? get matnId;
  @override
  String? get matnName;
  @override
  String? get matnStatus;
  @override
  String? get notes;
  @override
  int? get lockVersion;
  @override
  @JsonKey(ignore: true)
  _$$UpdateFollowUpRequestDtoImplCopyWith<_$UpdateFollowUpRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}

ListFollowUpsRequestDto _$ListFollowUpsRequestDtoFromJson(
    Map<String, dynamic> json) {
  return _ListFollowUpsRequestDto.fromJson(json);
}

/// @nodoc
mixin _$ListFollowUpsRequestDto {
  int? get centerId => throw _privateConstructorUsedError;
  int? get circleId => throw _privateConstructorUsedError;
  int? get studentId => throw _privateConstructorUsedError;
  String? get from => throw _privateConstructorUsedError;
  String? get to => throw _privateConstructorUsedError;
  String? get status => throw _privateConstructorUsedError;
  int? get page => throw _privateConstructorUsedError;
  int? get pageSize => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ListFollowUpsRequestDtoCopyWith<ListFollowUpsRequestDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ListFollowUpsRequestDtoCopyWith<$Res> {
  factory $ListFollowUpsRequestDtoCopyWith(ListFollowUpsRequestDto value,
          $Res Function(ListFollowUpsRequestDto) then) =
      _$ListFollowUpsRequestDtoCopyWithImpl<$Res, ListFollowUpsRequestDto>;
  @useResult
  $Res call(
      {int? centerId,
      int? circleId,
      int? studentId,
      String? from,
      String? to,
      String? status,
      int? page,
      int? pageSize});
}

/// @nodoc
class _$ListFollowUpsRequestDtoCopyWithImpl<$Res,
        $Val extends ListFollowUpsRequestDto>
    implements $ListFollowUpsRequestDtoCopyWith<$Res> {
  _$ListFollowUpsRequestDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? studentId = freezed,
    Object? from = freezed,
    Object? to = freezed,
    Object? status = freezed,
    Object? page = freezed,
    Object? pageSize = freezed,
  }) {
    return _then(_value.copyWith(
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      studentId: freezed == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int?,
      from: freezed == from
          ? _value.from
          : from // ignore: cast_nullable_to_non_nullable
              as String?,
      to: freezed == to
          ? _value.to
          : to // ignore: cast_nullable_to_non_nullable
              as String?,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      page: freezed == page
          ? _value.page
          : page // ignore: cast_nullable_to_non_nullable
              as int?,
      pageSize: freezed == pageSize
          ? _value.pageSize
          : pageSize // ignore: cast_nullable_to_non_nullable
              as int?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ListFollowUpsRequestDtoImplCopyWith<$Res>
    implements $ListFollowUpsRequestDtoCopyWith<$Res> {
  factory _$$ListFollowUpsRequestDtoImplCopyWith(
          _$ListFollowUpsRequestDtoImpl value,
          $Res Function(_$ListFollowUpsRequestDtoImpl) then) =
      __$$ListFollowUpsRequestDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int? centerId,
      int? circleId,
      int? studentId,
      String? from,
      String? to,
      String? status,
      int? page,
      int? pageSize});
}

/// @nodoc
class __$$ListFollowUpsRequestDtoImplCopyWithImpl<$Res>
    extends _$ListFollowUpsRequestDtoCopyWithImpl<$Res,
        _$ListFollowUpsRequestDtoImpl>
    implements _$$ListFollowUpsRequestDtoImplCopyWith<$Res> {
  __$$ListFollowUpsRequestDtoImplCopyWithImpl(
      _$ListFollowUpsRequestDtoImpl _value,
      $Res Function(_$ListFollowUpsRequestDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? centerId = freezed,
    Object? circleId = freezed,
    Object? studentId = freezed,
    Object? from = freezed,
    Object? to = freezed,
    Object? status = freezed,
    Object? page = freezed,
    Object? pageSize = freezed,
  }) {
    return _then(_$ListFollowUpsRequestDtoImpl(
      centerId: freezed == centerId
          ? _value.centerId
          : centerId // ignore: cast_nullable_to_non_nullable
              as int?,
      circleId: freezed == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as int?,
      studentId: freezed == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as int?,
      from: freezed == from
          ? _value.from
          : from // ignore: cast_nullable_to_non_nullable
              as String?,
      to: freezed == to
          ? _value.to
          : to // ignore: cast_nullable_to_non_nullable
              as String?,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      page: freezed == page
          ? _value.page
          : page // ignore: cast_nullable_to_non_nullable
              as int?,
      pageSize: freezed == pageSize
          ? _value.pageSize
          : pageSize // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ListFollowUpsRequestDtoImpl implements _ListFollowUpsRequestDto {
  const _$ListFollowUpsRequestDtoImpl(
      {this.centerId,
      this.circleId,
      this.studentId,
      this.from,
      this.to,
      this.status,
      this.page,
      this.pageSize});

  factory _$ListFollowUpsRequestDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$ListFollowUpsRequestDtoImplFromJson(json);

  @override
  final int? centerId;
  @override
  final int? circleId;
  @override
  final int? studentId;
  @override
  final String? from;
  @override
  final String? to;
  @override
  final String? status;
  @override
  final int? page;
  @override
  final int? pageSize;

  @override
  String toString() {
    return 'ListFollowUpsRequestDto(centerId: $centerId, circleId: $circleId, studentId: $studentId, from: $from, to: $to, status: $status, page: $page, pageSize: $pageSize)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ListFollowUpsRequestDtoImpl &&
            (identical(other.centerId, centerId) ||
                other.centerId == centerId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.studentId, studentId) ||
                other.studentId == studentId) &&
            (identical(other.from, from) || other.from == from) &&
            (identical(other.to, to) || other.to == to) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.page, page) || other.page == page) &&
            (identical(other.pageSize, pageSize) ||
                other.pageSize == pageSize));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, centerId, circleId, studentId,
      from, to, status, page, pageSize);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ListFollowUpsRequestDtoImplCopyWith<_$ListFollowUpsRequestDtoImpl>
      get copyWith => __$$ListFollowUpsRequestDtoImplCopyWithImpl<
          _$ListFollowUpsRequestDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ListFollowUpsRequestDtoImplToJson(
      this,
    );
  }
}

abstract class _ListFollowUpsRequestDto implements ListFollowUpsRequestDto {
  const factory _ListFollowUpsRequestDto(
      {final int? centerId,
      final int? circleId,
      final int? studentId,
      final String? from,
      final String? to,
      final String? status,
      final int? page,
      final int? pageSize}) = _$ListFollowUpsRequestDtoImpl;

  factory _ListFollowUpsRequestDto.fromJson(Map<String, dynamic> json) =
      _$ListFollowUpsRequestDtoImpl.fromJson;

  @override
  int? get centerId;
  @override
  int? get circleId;
  @override
  int? get studentId;
  @override
  String? get from;
  @override
  String? get to;
  @override
  String? get status;
  @override
  int? get page;
  @override
  int? get pageSize;
  @override
  @JsonKey(ignore: true)
  _$$ListFollowUpsRequestDtoImplCopyWith<_$ListFollowUpsRequestDtoImpl>
      get copyWith => throw _privateConstructorUsedError;
}
