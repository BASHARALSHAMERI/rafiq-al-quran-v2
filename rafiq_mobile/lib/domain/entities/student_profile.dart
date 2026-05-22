class StudentProfile {
  final int id;
  final String fullName;
  final String email;
  final String? avatarUrl;
  final String? phone;
  final String? gender;
  final String? nickname;
  final String? nationalId;
  final String? level;
  final int memorizedJuzz;
  final int attendancePercentage;
  final int? recentRating;
  final List<FollowUpRecord> recentFollowUps;

  StudentProfile({
    required this.id,
    required this.fullName,
    required this.email,
    this.avatarUrl,
    this.phone,
    this.gender,
    this.nickname,
    this.nationalId,
    this.level,
    required this.memorizedJuzz,
    required this.attendancePercentage,
    this.recentRating,
    required this.recentFollowUps,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> json) {
    return StudentProfile(
      id: _readInt(json['id']),
      fullName: (json['fullName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      avatarUrl: json['profile']?['avatarUrl']?.toString(),
      phone: json['profile']?['phone']?.toString(),
      gender: json['profile']?['gender']?.toString(),
      nickname: json['studentProfile']?['nickname']?.toString(),
      nationalId: json['studentProfile']?['nationalId']?.toString(),
      level: json['studentProfile']?['level']?.toString(),
      memorizedJuzz: _readInt(json['metrics']?['memorizedJuzz']),
      attendancePercentage:
          _readInt(json['metrics']?['attendancePercentage'], fallback: 100),
      recentRating: json['metrics']?['recentRating'] == null
          ? null
          : _readInt(json['metrics']?['recentRating']),
      recentFollowUps: (json['followUpsAsStudent'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(FollowUpRecord.fromJson)
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'profile': {
        'avatarUrl': avatarUrl,
        'phone': phone,
        'gender': gender,
      },
      'studentProfile': {
        'nickname': nickname,
        'nationalId': nationalId,
        'level': level,
      },
      'metrics': {
        'memorizedJuzz': memorizedJuzz,
        'attendancePercentage': attendancePercentage,
        'recentRating': recentRating,
      },
      'followUpsAsStudent':
          recentFollowUps.map((record) => record.toJson()).toList(),
    };
  }
}

class FollowUpRecord {
  final int id;
  final DateTime recordDate;
  final String type;
  final String? surah;
  final int? fromAyah;
  final int? toAyah;
  final double? pagesCount;
  final int? rating;
  final String? matnName;
  final String? matnStatus;
  final String? notes;
  final String? teacherName;

  FollowUpRecord({
    required this.id,
    required this.recordDate,
    required this.type,
    this.surah,
    this.fromAyah,
    this.toAyah,
    this.pagesCount,
    this.rating,
    this.matnName,
    this.matnStatus,
    this.notes,
    this.teacherName,
  });

  factory FollowUpRecord.fromJson(Map<String, dynamic> json) {
    return FollowUpRecord(
      id: _readInt(json['id']),
      recordDate: DateTime.parse((json['recordDate'] ?? '').toString()),
      type: (json['type'] ?? '').toString(),
      surah: json['surah']?.toString(),
      fromAyah: _nullableInt(json['fromAyah']),
      toAyah: _nullableInt(json['toAyah']),
      pagesCount: json['pagesCount'] != null
          ? double.parse(json['pagesCount'].toString())
          : null,
      rating: _nullableInt(json['rating']),
      matnName: json['matnName']?.toString(),
      matnStatus: json['matnStatus']?.toString(),
      notes: json['notes']?.toString(),
      teacherName: json['teacher']?['fullName']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'recordDate': recordDate.toIso8601String(),
      'type': type,
      'surah': surah,
      'fromAyah': fromAyah,
      'toAyah': toAyah,
      'pagesCount': pagesCount,
      'rating': rating,
      'matnName': matnName,
      'matnStatus': matnStatus,
      'notes': notes,
      'teacher': teacherName == null ? null : {'fullName': teacherName},
    };
  }
}

int _readInt(dynamic value, {int fallback = 0}) {
  return int.tryParse('$value') ?? fallback;
}

int? _nullableInt(dynamic value) {
  final parsed = int.tryParse('$value');
  return parsed;
}
