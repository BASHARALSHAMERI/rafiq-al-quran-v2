class CorrectionItemDto {
  final int id;
  final int organizationId;
  final int centerId;
  final int circleId;
  final String targetType;
  final int targetId;
  final int requestedById;
  final String requestedByRole;
  final String reason;
  final Map<String, dynamic> proposedChanges;
  final Map<String, dynamic> currentSnapshot;
  final String status;
  final int? reviewedById;
  final String? reviewNote;
  final DateTime? reviewedAt;
  final int? appliedById;
  final DateTime? appliedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? requestedByName;
  final String? reviewedByName;

  const CorrectionItemDto({
    required this.id,
    required this.organizationId,
    required this.centerId,
    required this.circleId,
    required this.targetType,
    required this.targetId,
    required this.requestedById,
    required this.requestedByRole,
    required this.reason,
    required this.proposedChanges,
    required this.currentSnapshot,
    required this.status,
    this.reviewedById,
    this.reviewNote,
    this.reviewedAt,
    this.appliedById,
    this.appliedAt,
    required this.createdAt,
    required this.updatedAt,
    this.requestedByName,
    this.reviewedByName,
  });

  bool get isPending => status == 'PENDING';

  factory CorrectionItemDto.fromJson(Map<String, dynamic> json) {
    return CorrectionItemDto(
      id: _asInt(json['id']),
      organizationId: _asInt(json['organizationId']),
      centerId: _asInt(json['centerId']),
      circleId: _asInt(json['circleId']),
      targetType: (json['targetType'] ?? '').toString(),
      targetId: _asInt(json['targetId']),
      requestedById: _asInt(json['requestedById']),
      requestedByRole: (json['requestedByRole'] ?? '').toString(),
      reason: (json['reason'] ?? '').toString(),
      proposedChanges:
          _asMap(json['proposedChanges']) ?? const <String, dynamic>{},
      currentSnapshot:
          _asMap(json['currentSnapshot']) ?? const <String, dynamic>{},
      status: (json['status'] ?? '').toString(),
      reviewedById: _tryInt(json['reviewedById']),
      reviewNote: _asNullableString(json['reviewNote']),
      reviewedAt: _tryDate(json['reviewedAt']),
      appliedById: _tryInt(json['appliedById']),
      appliedAt: _tryDate(json['appliedAt']),
      createdAt: _tryDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _tryDate(json['updatedAt']) ?? DateTime.now(),
      requestedByName:
          _asNullableString(_asMap(json['requestedBy'])?['fullName']),
      reviewedByName:
          _asNullableString(_asMap(json['reviewedBy'])?['fullName']),
    );
  }
}

class ListCorrectionsResultDto {
  final List<CorrectionItemDto> data;
  final int page;
  final int pageSize;
  final int total;

  const ListCorrectionsResultDto({
    required this.data,
    required this.page,
    required this.pageSize,
    required this.total,
  });

  factory ListCorrectionsResultDto.fromJson(Map<String, dynamic> json) {
    final rawData = json['data'];
    final items = rawData is List
        ? rawData
            .whereType<Map<String, dynamic>>()
            .map(CorrectionItemDto.fromJson)
            .toList(growable: false)
        : const <CorrectionItemDto>[];
    return ListCorrectionsResultDto(
      data: items,
      page: _asInt(json['page'], 1),
      pageSize: _asInt(json['pageSize'], items.length),
      total: _asInt(json['total'], items.length),
    );
  }
}

int _asInt(dynamic value, [int fallback = 0]) {
  final parsed = int.tryParse('$value');
  return parsed ?? fallback;
}

int? _tryInt(dynamic value) {
  final parsed = int.tryParse('$value');
  return parsed;
}

DateTime? _tryDate(dynamic value) {
  final text = value?.toString().trim();
  if (text == null || text.isEmpty) {
    return null;
  }
  return DateTime.tryParse(text);
}

String? _asNullableString(dynamic value) {
  final text = value?.toString().trim();
  if (text == null || text.isEmpty) {
    return null;
  }
  return text;
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  return null;
}
