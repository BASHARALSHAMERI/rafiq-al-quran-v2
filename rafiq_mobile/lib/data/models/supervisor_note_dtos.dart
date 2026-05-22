class SupervisorNoteDto {
  final int id;
  final int organizationId;
  final int centerId;
  final int? circleId;
  final int supervisorId;
  final String? supervisorName;
  final String? circleName;
  final String category;
  final String status;
  final String? targetLabel;
  final String content;
  final Map<String, dynamic>? scores;
  final List<Map<String, dynamic>>? visitChecklist;
  final int? rating;
  final DateTime createdAt;
  final DateTime updatedAt;

  const SupervisorNoteDto({
    required this.id,
    required this.organizationId,
    required this.centerId,
    this.circleId,
    required this.supervisorId,
    this.supervisorName,
    this.circleName,
    required this.category,
    required this.status,
    this.targetLabel,
    required this.content,
    this.scores,
    this.visitChecklist,
    this.rating,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isPending => status == 'PENDING';
  bool get isResolved => status == 'RESOLVED';

  factory SupervisorNoteDto.fromJson(Map<String, dynamic> json) {
    final rawChecklist = json['visitChecklist'];
    List<Map<String, dynamic>>? checklist;
    if (rawChecklist is List) {
      checklist = rawChecklist
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }

    final rawScores = json['scores'];
    Map<String, dynamic>? scores;
    if (rawScores is Map<String, dynamic>) {
      scores = rawScores;
    }

    return SupervisorNoteDto(
      id: _asInt(json['id']),
      organizationId: _asInt(json['organizationId']),
      centerId: _asInt(json['centerId']),
      circleId: _tryInt(json['circleId']),
      supervisorId: _asInt(json['supervisorId']),
      supervisorName: _asNullableString(json['supervisorName']),
      circleName: _asNullableString(json['circleName']),
      category: (json['category'] ?? 'GENERAL').toString(),
      status: (json['status'] ?? 'PENDING').toString(),
      targetLabel: _asNullableString(json['targetLabel']),
      content: (json['content'] ?? '').toString(),
      scores: scores,
      visitChecklist: checklist,
      rating: _tryInt(json['rating']),
      createdAt: _tryDate(json['createdAt']) ?? DateTime.now(),
      updatedAt: _tryDate(json['updatedAt']) ?? DateTime.now(),
    );
  }
}

class SupervisorNotesListDto {
  final List<SupervisorNoteDto> data;
  final int page;
  final int pageSize;
  final int total;

  const SupervisorNotesListDto({
    required this.data,
    required this.page,
    required this.pageSize,
    required this.total,
  });

  factory SupervisorNotesListDto.fromJson(Map<String, dynamic> json) {
    final rawData = json['data'];
    final items = rawData is List
        ? rawData
            .whereType<Map<String, dynamic>>()
            .map(SupervisorNoteDto.fromJson)
            .toList(growable: false)
        : const <SupervisorNoteDto>[];
    return SupervisorNotesListDto(
      data: items,
      page: _asInt(json['page'], 1),
      pageSize: _asInt(json['pageSize'], items.length),
      total: _asInt(json['total'], items.length),
    );
  }
}

int _asInt(dynamic value, [int fallback = 0]) {
  if (value == null) return fallback;
  return int.tryParse('$value') ?? fallback;
}

int? _tryInt(dynamic value) {
  if (value == null) return null;
  return int.tryParse('$value');
}

DateTime? _tryDate(dynamic value) {
  final text = value?.toString().trim();
  if (text == null || text.isEmpty) return null;
  return DateTime.tryParse(text);
}

String? _asNullableString(dynamic value) {
  final text = value?.toString().trim();
  if (text == null || text.isEmpty) return null;
  return text;
}
