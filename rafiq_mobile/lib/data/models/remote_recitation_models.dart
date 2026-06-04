enum RemoteRecitationBookingStatusDto {
  requested('REQUESTED'),
  approved('APPROVED'),
  rejected('REJECTED'),
  cancelled('CANCELLED'),
  completed('COMPLETED');

  final String apiValue;
  const RemoteRecitationBookingStatusDto(this.apiValue);

  static RemoteRecitationBookingStatusDto fromJson(dynamic value) {
    final normalized = (value?.toString() ?? '').trim().toUpperCase();
    return values.firstWhere(
      (item) => item.apiValue == normalized,
      orElse: () => RemoteRecitationBookingStatusDto.requested,
    );
  }
}

class RemoteRecitationSettingsDto {
  final int? id;
  final int circleId;
  final int centerId;
  final bool isEnabled;
  final int slotDurationMinutes;
  final int bookingLeadHours;
  final int cancellationWindowHours;
  final int maxAdvanceDays;

  const RemoteRecitationSettingsDto({
    required this.id,
    required this.circleId,
    required this.centerId,
    required this.isEnabled,
    required this.slotDurationMinutes,
    required this.bookingLeadHours,
    required this.cancellationWindowHours,
    required this.maxAdvanceDays,
  });

  factory RemoteRecitationSettingsDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationSettingsDto(
      id: _asInt(json['id']),
      circleId: _asInt(json['circleId']) ?? 0,
      centerId: _asInt(json['centerId']) ?? 0,
      isEnabled: _asBool(json['isEnabled']),
      slotDurationMinutes: _asInt(json['slotDurationMinutes']) ?? 30,
      bookingLeadHours: _asInt(json['bookingLeadHours']) ?? 2,
      cancellationWindowHours: _asInt(json['cancellationWindowHours']) ?? 2,
      maxAdvanceDays: _asInt(json['maxAdvanceDays']) ?? 21,
    );
  }
}

class RemoteRecitationUserRefDto {
  final int id;
  final String fullName;

  const RemoteRecitationUserRefDto({
    required this.id,
    required this.fullName,
  });

  factory RemoteRecitationUserRefDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationUserRefDto(
      id: _asInt(json['id']) ?? 0,
      fullName: _asString(json['fullName']),
    );
  }
}

class RemoteRecitationCenterRefDto {
  final int id;
  final String name;
  final String timezone;
  final bool isActive;

  const RemoteRecitationCenterRefDto({
    required this.id,
    required this.name,
    required this.timezone,
    required this.isActive,
  });

  factory RemoteRecitationCenterRefDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationCenterRefDto(
      id: _asInt(json['id']) ?? 0,
      name: _asString(json['name']),
      timezone: _asString(json['timezone'], fallback: 'Asia/Aden'),
      isActive: _asBool(json['isActive'], fallback: true),
    );
  }
}

class RemoteRecitationCircleRefDto {
  final int id;
  final String name;
  final bool isActive;
  final int teacherId;
  final RemoteRecitationCenterRefDto center;

  const RemoteRecitationCircleRefDto({
    required this.id,
    required this.name,
    required this.isActive,
    required this.teacherId,
    required this.center,
  });

  factory RemoteRecitationCircleRefDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationCircleRefDto(
      id: _asInt(json['id']) ?? 0,
      name: _asString(json['name']),
      isActive: _asBool(json['isActive'], fallback: true),
      teacherId: _asInt(json['teacherId']) ?? 0,
      center: RemoteRecitationCenterRefDto.fromJson(_asMap(json['center'])),
    );
  }
}

class RemoteRecitationSlotDto {
  final int id;
  final int centerId;
  final int circleId;
  final int teacherId;
  final DateTime startsAt;
  final DateTime endsAt;
  final String? joinUrl;
  final String? providerHost;
  final String? note;
  final bool isActive;
  final int lockVersion;
  final RemoteRecitationUserRefDto teacher;
  final RemoteRecitationCircleRefDto circle;

  const RemoteRecitationSlotDto({
    required this.id,
    required this.centerId,
    required this.circleId,
    required this.teacherId,
    required this.startsAt,
    required this.endsAt,
    required this.joinUrl,
    required this.providerHost,
    required this.note,
    required this.isActive,
    required this.lockVersion,
    required this.teacher,
    required this.circle,
  });

  factory RemoteRecitationSlotDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationSlotDto(
      id: _asInt(json['id']) ?? 0,
      centerId: _asInt(json['centerId']) ?? 0,
      circleId: _asInt(json['circleId']) ?? 0,
      teacherId: _asInt(json['teacherId']) ?? 0,
      startsAt: _asDateTime(json['startsAt']) ?? DateTime.now(),
      endsAt: _asDateTime(json['endsAt']) ?? DateTime.now(),
      joinUrl: _asNullableString(json['joinUrl']),
      providerHost: _asNullableString(json['providerHost']),
      note: _asNullableString(json['note']),
      isActive: _asBool(json['isActive'], fallback: true),
      lockVersion: _asInt(json['lockVersion']) ?? 0,
      teacher: RemoteRecitationUserRefDto.fromJson(_asMap(json['teacher'])),
      circle: RemoteRecitationCircleRefDto.fromJson(_asMap(json['circle'])),
    );
  }
}

class RemoteRecitationFollowUpDto {
  final int id;
  final String recordDate;
  final String type;
  final String status;
  final String? surah;
  final int? fromSurah;
  final int? fromAyah;
  final int? toSurah;
  final int? toAyah;
  final int? rating;
  final String? matnName;
  final String? matnStatus;
  final String? notes;

  const RemoteRecitationFollowUpDto({
    required this.id,
    required this.recordDate,
    required this.type,
    required this.status,
    required this.surah,
    required this.fromSurah,
    required this.fromAyah,
    required this.toSurah,
    required this.toAyah,
    required this.rating,
    required this.matnName,
    required this.matnStatus,
    required this.notes,
  });

  factory RemoteRecitationFollowUpDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationFollowUpDto(
      id: _asInt(json['id']) ?? 0,
      recordDate: _asString(json['recordDate']),
      type: _asString(json['type']),
      status: _asString(json['status']),
      surah: _asNullableString(json['surah']),
      fromSurah: _asInt(json['fromSurah']),
      fromAyah: _asInt(json['fromAyah']),
      toSurah: _asInt(json['toSurah']),
      toAyah: _asInt(json['toAyah']),
      rating: _asInt(json['rating']),
      matnName: _asNullableString(json['matnName']),
      matnStatus: _asNullableString(json['matnStatus']),
      notes: _asNullableString(json['notes']),
    );
  }
}

class RemoteRecitationBookingDto {
  final int id;
  final int centerId;
  final int circleId;
  final int slotId;
  final int studentId;
  final int teacherId;
  final RemoteRecitationBookingStatusDto status;
  final DateTime requestedAt;
  final DateTime? reviewedAt;
  final String? reviewNote;
  final DateTime? cancelledAt;
  final String? cancellationReason;
  final DateTime? completedAt;
  final int? followUpRecordId;
  final int lockVersion;
  final RemoteRecitationUserRefDto student;
  final RemoteRecitationUserRefDto teacher;
  final RemoteRecitationCircleRefDto circle;
  final RemoteRecitationSlotDto slot;
  final RemoteRecitationFollowUpDto? followUpRecord;

  const RemoteRecitationBookingDto({
    required this.id,
    required this.centerId,
    required this.circleId,
    required this.slotId,
    required this.studentId,
    required this.teacherId,
    required this.status,
    required this.requestedAt,
    required this.reviewedAt,
    required this.reviewNote,
    required this.cancelledAt,
    required this.cancellationReason,
    required this.completedAt,
    required this.followUpRecordId,
    required this.lockVersion,
    required this.student,
    required this.teacher,
    required this.circle,
    required this.slot,
    required this.followUpRecord,
  });

  factory RemoteRecitationBookingDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationBookingDto(
      id: _asInt(json['id']) ?? 0,
      centerId: _asInt(json['centerId']) ?? 0,
      circleId: _asInt(json['circleId']) ?? 0,
      slotId: _asInt(json['slotId']) ?? 0,
      studentId: _asInt(json['studentId']) ?? 0,
      teacherId: _asInt(json['teacherId']) ?? 0,
      status: RemoteRecitationBookingStatusDto.fromJson(json['status']),
      requestedAt: _asDateTime(json['requestedAt']) ?? DateTime.now(),
      reviewedAt: _asDateTime(json['reviewedAt']),
      reviewNote: _asNullableString(json['reviewNote']),
      cancelledAt: _asDateTime(json['cancelledAt']),
      cancellationReason: _asNullableString(json['cancellationReason']),
      completedAt: _asDateTime(json['completedAt']),
      followUpRecordId: _asInt(json['followUpRecordId']),
      lockVersion: _asInt(json['lockVersion']) ?? 0,
      student: RemoteRecitationUserRefDto.fromJson(_asMap(json['student'])),
      teacher: RemoteRecitationUserRefDto.fromJson(_asMap(json['teacher'])),
      circle: RemoteRecitationCircleRefDto.fromJson(_asMap(json['circle'])),
      slot: RemoteRecitationSlotDto.fromJson(_asMap(json['slot'])),
      followUpRecord: json['followUpRecord'] == null
          ? null
          : RemoteRecitationFollowUpDto.fromJson(
              _asMap(json['followUpRecord']),
            ),
    );
  }
}

class RemoteRecitationSlotsPageDto {
  final List<RemoteRecitationSlotDto> data;
  final int page;
  final int pageSize;
  final int total;

  const RemoteRecitationSlotsPageDto({
    required this.data,
    required this.page,
    required this.pageSize,
    required this.total,
  });

  factory RemoteRecitationSlotsPageDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationSlotsPageDto(
      data: _asList(json['data'])
          .map((item) => RemoteRecitationSlotDto.fromJson(_asMap(item)))
          .toList(growable: false),
      page: _asInt(json['page']) ?? 1,
      pageSize: _asInt(json['pageSize']) ?? 20,
      total: _asInt(json['total']) ?? 0,
    );
  }
}

class RemoteRecitationBookingsPageDto {
  final List<RemoteRecitationBookingDto> data;
  final int page;
  final int pageSize;
  final int total;

  const RemoteRecitationBookingsPageDto({
    required this.data,
    required this.page,
    required this.pageSize,
    required this.total,
  });

  factory RemoteRecitationBookingsPageDto.fromJson(Map<String, dynamic> json) {
    return RemoteRecitationBookingsPageDto(
      data: _asList(json['data'])
          .map((item) => RemoteRecitationBookingDto.fromJson(_asMap(item)))
          .toList(growable: false),
      page: _asInt(json['page']) ?? 1,
      pageSize: _asInt(json['pageSize']) ?? 20,
      total: _asInt(json['total']) ?? 0,
    );
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  return const <String, dynamic>{};
}

List<dynamic> _asList(dynamic value) {
  if (value is List) {
    return value;
  }
  return const <dynamic>[];
}

String _asString(dynamic value, {String fallback = ''}) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

String? _asNullableString(dynamic value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}

int? _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '');
}

bool _asBool(dynamic value, {bool fallback = false}) {
  if (value is bool) return value;
  final normalized = (value?.toString() ?? '').trim().toLowerCase();
  if (normalized == 'true') return true;
  if (normalized == 'false') return false;
  return fallback;
}

DateTime? _asDateTime(dynamic value) {
  final raw = value?.toString();
  if (raw == null || raw.trim().isEmpty) {
    return null;
  }
  return DateTime.tryParse(raw);
}
