// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'attendance_dtos.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

StudentDto _$StudentDtoFromJson(Map<String, dynamic> json) {
  return _StudentDto.fromJson(json);
}

/// @nodoc
mixin _$StudentDto {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get enrollmentId => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $StudentDtoCopyWith<StudentDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $StudentDtoCopyWith<$Res> {
  factory $StudentDtoCopyWith(
          StudentDto value, $Res Function(StudentDto) then) =
      _$StudentDtoCopyWithImpl<$Res, StudentDto>;
  @useResult
  $Res call({String id, String name, String enrollmentId});
}

/// @nodoc
class _$StudentDtoCopyWithImpl<$Res, $Val extends StudentDto>
    implements $StudentDtoCopyWith<$Res> {
  _$StudentDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? enrollmentId = null,
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
      enrollmentId: null == enrollmentId
          ? _value.enrollmentId
          : enrollmentId // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$StudentDtoImplCopyWith<$Res>
    implements $StudentDtoCopyWith<$Res> {
  factory _$$StudentDtoImplCopyWith(
          _$StudentDtoImpl value, $Res Function(_$StudentDtoImpl) then) =
      __$$StudentDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String enrollmentId});
}

/// @nodoc
class __$$StudentDtoImplCopyWithImpl<$Res>
    extends _$StudentDtoCopyWithImpl<$Res, _$StudentDtoImpl>
    implements _$$StudentDtoImplCopyWith<$Res> {
  __$$StudentDtoImplCopyWithImpl(
      _$StudentDtoImpl _value, $Res Function(_$StudentDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? enrollmentId = null,
  }) {
    return _then(_$StudentDtoImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      enrollmentId: null == enrollmentId
          ? _value.enrollmentId
          : enrollmentId // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$StudentDtoImpl implements _StudentDto {
  const _$StudentDtoImpl(
      {required this.id, required this.name, required this.enrollmentId});

  factory _$StudentDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$StudentDtoImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String enrollmentId;

  @override
  String toString() {
    return 'StudentDto(id: $id, name: $name, enrollmentId: $enrollmentId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StudentDtoImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.enrollmentId, enrollmentId) ||
                other.enrollmentId == enrollmentId));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, enrollmentId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$StudentDtoImplCopyWith<_$StudentDtoImpl> get copyWith =>
      __$$StudentDtoImplCopyWithImpl<_$StudentDtoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$StudentDtoImplToJson(
      this,
    );
  }
}

abstract class _StudentDto implements StudentDto {
  const factory _StudentDto(
      {required final String id,
      required final String name,
      required final String enrollmentId}) = _$StudentDtoImpl;

  factory _StudentDto.fromJson(Map<String, dynamic> json) =
      _$StudentDtoImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get enrollmentId;
  @override
  @JsonKey(ignore: true)
  _$$StudentDtoImplCopyWith<_$StudentDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AttendanceRecordDto _$AttendanceRecordDtoFromJson(Map<String, dynamic> json) {
  return _AttendanceRecordDto.fromJson(json);
}

/// @nodoc
mixin _$AttendanceRecordDto {
  String get studentId => throw _privateConstructorUsedError;
  String get circleId => throw _privateConstructorUsedError;
  String get date =>
      throw _privateConstructorUsedError; // ISO Format YYYY-MM-DD
  String get status => throw _privateConstructorUsedError;
  String? get note => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AttendanceRecordDtoCopyWith<AttendanceRecordDto> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AttendanceRecordDtoCopyWith<$Res> {
  factory $AttendanceRecordDtoCopyWith(
          AttendanceRecordDto value, $Res Function(AttendanceRecordDto) then) =
      _$AttendanceRecordDtoCopyWithImpl<$Res, AttendanceRecordDto>;
  @useResult
  $Res call(
      {String studentId,
      String circleId,
      String date,
      String status,
      String? note});
}

/// @nodoc
class _$AttendanceRecordDtoCopyWithImpl<$Res, $Val extends AttendanceRecordDto>
    implements $AttendanceRecordDtoCopyWith<$Res> {
  _$AttendanceRecordDtoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? circleId = null,
    Object? date = null,
    Object? status = null,
    Object? note = freezed,
  }) {
    return _then(_value.copyWith(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as String,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AttendanceRecordDtoImplCopyWith<$Res>
    implements $AttendanceRecordDtoCopyWith<$Res> {
  factory _$$AttendanceRecordDtoImplCopyWith(_$AttendanceRecordDtoImpl value,
          $Res Function(_$AttendanceRecordDtoImpl) then) =
      __$$AttendanceRecordDtoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String studentId,
      String circleId,
      String date,
      String status,
      String? note});
}

/// @nodoc
class __$$AttendanceRecordDtoImplCopyWithImpl<$Res>
    extends _$AttendanceRecordDtoCopyWithImpl<$Res, _$AttendanceRecordDtoImpl>
    implements _$$AttendanceRecordDtoImplCopyWith<$Res> {
  __$$AttendanceRecordDtoImplCopyWithImpl(_$AttendanceRecordDtoImpl _value,
      $Res Function(_$AttendanceRecordDtoImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? studentId = null,
    Object? circleId = null,
    Object? date = null,
    Object? status = null,
    Object? note = freezed,
  }) {
    return _then(_$AttendanceRecordDtoImpl(
      studentId: null == studentId
          ? _value.studentId
          : studentId // ignore: cast_nullable_to_non_nullable
              as String,
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AttendanceRecordDtoImpl implements _AttendanceRecordDto {
  const _$AttendanceRecordDtoImpl(
      {required this.studentId,
      required this.circleId,
      required this.date,
      required this.status,
      this.note});

  factory _$AttendanceRecordDtoImpl.fromJson(Map<String, dynamic> json) =>
      _$$AttendanceRecordDtoImplFromJson(json);

  @override
  final String studentId;
  @override
  final String circleId;
  @override
  final String date;
// ISO Format YYYY-MM-DD
  @override
  final String status;
  @override
  final String? note;

  @override
  String toString() {
    return 'AttendanceRecordDto(studentId: $studentId, circleId: $circleId, date: $date, status: $status, note: $note)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AttendanceRecordDtoImpl &&
            (identical(other.studentId, studentId) ||
                other.studentId == studentId) &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.note, note) || other.note == note));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode =>
      Object.hash(runtimeType, studentId, circleId, date, status, note);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AttendanceRecordDtoImplCopyWith<_$AttendanceRecordDtoImpl> get copyWith =>
      __$$AttendanceRecordDtoImplCopyWithImpl<_$AttendanceRecordDtoImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AttendanceRecordDtoImplToJson(
      this,
    );
  }
}

abstract class _AttendanceRecordDto implements AttendanceRecordDto {
  const factory _AttendanceRecordDto(
      {required final String studentId,
      required final String circleId,
      required final String date,
      required final String status,
      final String? note}) = _$AttendanceRecordDtoImpl;

  factory _AttendanceRecordDto.fromJson(Map<String, dynamic> json) =
      _$AttendanceRecordDtoImpl.fromJson;

  @override
  String get studentId;
  @override
  String get circleId;
  @override
  String get date;
  @override // ISO Format YYYY-MM-DD
  String get status;
  @override
  String? get note;
  @override
  @JsonKey(ignore: true)
  _$$AttendanceRecordDtoImplCopyWith<_$AttendanceRecordDtoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

BulkAttendanceRequest _$BulkAttendanceRequestFromJson(
    Map<String, dynamic> json) {
  return _BulkAttendanceRequest.fromJson(json);
}

/// @nodoc
mixin _$BulkAttendanceRequest {
  String get circleId => throw _privateConstructorUsedError;
  String get date => throw _privateConstructorUsedError;
  List<AttendanceRecordDto> get records => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $BulkAttendanceRequestCopyWith<BulkAttendanceRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BulkAttendanceRequestCopyWith<$Res> {
  factory $BulkAttendanceRequestCopyWith(BulkAttendanceRequest value,
          $Res Function(BulkAttendanceRequest) then) =
      _$BulkAttendanceRequestCopyWithImpl<$Res, BulkAttendanceRequest>;
  @useResult
  $Res call({String circleId, String date, List<AttendanceRecordDto> records});
}

/// @nodoc
class _$BulkAttendanceRequestCopyWithImpl<$Res,
        $Val extends BulkAttendanceRequest>
    implements $BulkAttendanceRequestCopyWith<$Res> {
  _$BulkAttendanceRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? circleId = null,
    Object? date = null,
    Object? records = null,
  }) {
    return _then(_value.copyWith(
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      records: null == records
          ? _value.records
          : records // ignore: cast_nullable_to_non_nullable
              as List<AttendanceRecordDto>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BulkAttendanceRequestImplCopyWith<$Res>
    implements $BulkAttendanceRequestCopyWith<$Res> {
  factory _$$BulkAttendanceRequestImplCopyWith(
          _$BulkAttendanceRequestImpl value,
          $Res Function(_$BulkAttendanceRequestImpl) then) =
      __$$BulkAttendanceRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String circleId, String date, List<AttendanceRecordDto> records});
}

/// @nodoc
class __$$BulkAttendanceRequestImplCopyWithImpl<$Res>
    extends _$BulkAttendanceRequestCopyWithImpl<$Res,
        _$BulkAttendanceRequestImpl>
    implements _$$BulkAttendanceRequestImplCopyWith<$Res> {
  __$$BulkAttendanceRequestImplCopyWithImpl(_$BulkAttendanceRequestImpl _value,
      $Res Function(_$BulkAttendanceRequestImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? circleId = null,
    Object? date = null,
    Object? records = null,
  }) {
    return _then(_$BulkAttendanceRequestImpl(
      circleId: null == circleId
          ? _value.circleId
          : circleId // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      records: null == records
          ? _value._records
          : records // ignore: cast_nullable_to_non_nullable
              as List<AttendanceRecordDto>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BulkAttendanceRequestImpl implements _BulkAttendanceRequest {
  const _$BulkAttendanceRequestImpl(
      {required this.circleId,
      required this.date,
      required final List<AttendanceRecordDto> records})
      : _records = records;

  factory _$BulkAttendanceRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$BulkAttendanceRequestImplFromJson(json);

  @override
  final String circleId;
  @override
  final String date;
  final List<AttendanceRecordDto> _records;
  @override
  List<AttendanceRecordDto> get records {
    if (_records is EqualUnmodifiableListView) return _records;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_records);
  }

  @override
  String toString() {
    return 'BulkAttendanceRequest(circleId: $circleId, date: $date, records: $records)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BulkAttendanceRequestImpl &&
            (identical(other.circleId, circleId) ||
                other.circleId == circleId) &&
            (identical(other.date, date) || other.date == date) &&
            const DeepCollectionEquality().equals(other._records, _records));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, circleId, date,
      const DeepCollectionEquality().hash(_records));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$BulkAttendanceRequestImplCopyWith<_$BulkAttendanceRequestImpl>
      get copyWith => __$$BulkAttendanceRequestImplCopyWithImpl<
          _$BulkAttendanceRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BulkAttendanceRequestImplToJson(
      this,
    );
  }
}

abstract class _BulkAttendanceRequest implements BulkAttendanceRequest {
  const factory _BulkAttendanceRequest(
          {required final String circleId,
          required final String date,
          required final List<AttendanceRecordDto> records}) =
      _$BulkAttendanceRequestImpl;

  factory _BulkAttendanceRequest.fromJson(Map<String, dynamic> json) =
      _$BulkAttendanceRequestImpl.fromJson;

  @override
  String get circleId;
  @override
  String get date;
  @override
  List<AttendanceRecordDto> get records;
  @override
  @JsonKey(ignore: true)
  _$$BulkAttendanceRequestImplCopyWith<_$BulkAttendanceRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}
