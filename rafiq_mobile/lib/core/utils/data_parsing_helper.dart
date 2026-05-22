import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class DataParsingHelper {
  /// Safely converts dynamic value to Map<String, dynamic>
  static Map<String, dynamic> asMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return const <String, dynamic>{};
  }

  /// Safely converts dynamic value to List<Map<String, dynamic>>
  static List<Map<String, dynamic>> asMapList(dynamic value) {
    if (value is List) {
      return value
          .map((item) => item is Map ? Map<String, dynamic>.from(item) : null)
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }
    return const [];
  }

  /// Safely reads an integer from dynamic value
  static int? readInt(dynamic value) {
    if (value is int) {
      return value;
    }
    return int.tryParse('${value ?? ''}');
  }

  /// Safely reads a string from dynamic value with fallback
  static String readString(dynamic value, {String fallback = ''}) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? fallback : text;
  }

  /// Standardizes rating labels from API strings to Arabic
  static String ratingLabel(dynamic rawValue) {
    final text = readString(rawValue).toUpperCase();
    switch (text) {
      case 'EXCELLENT':
      case 'ممتاز':
        return 'ممتاز';
      case 'V_GOOD':
      case 'جيد جداً':
      case 'جيد جدا':
        return 'جيد جداً';
      case 'GOOD':
      case 'جيد':
        return 'جيد';
      case 'ACCEPTABLE':
      case 'مقبول':
        return 'مقبول';
      case 'POOR':
      case 'ضعيف':
        return 'ضعيف';
      default:
        return 'غير محدد';
    }
  }

  /// Converts rating label or API string to integer (1-5)
  static int ratingToScore(dynamic rawValue) {
    final text = readString(rawValue).toUpperCase();
    switch (text) {
      case 'EXCELLENT':
      case 'ممتاز':
        return 5;
      case 'V_GOOD':
      case 'جيد جداً':
      case 'جيد جدا':
        return 4;
      case 'GOOD':
      case 'جيد':
        return 3;
      case 'ACCEPTABLE':
      case 'مقبول':
        return 2;
      case 'POOR':
      case 'ضعيف':
        return 1;
      default:
        return 0;
    }
  }

  /// Safely converts dynamic value to double
  static double? asDouble(dynamic value) {
    if (value is double) {
      return value;
    }
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse('${value ?? ''}');
  }

  /// Standardizes rating colors based on label
  static Color ratingColor(dynamic rawValue) {
    final label = ratingLabel(rawValue);
    switch (label) {
      case 'ممتاز':
        return AppColors.successLight;
      case 'جيد جداً':
        return AppColors.primaryLight;
      case 'جيد':
        return AppColors.infoLight;
      case 'مقبول':
        return AppColors.warningLight;
      case 'ضعيف':
        return AppColors.errorLight;
      default:
        return AppColors.textSecondaryLight;
    }
  }

  /// Standardizes attendance status labels
  static String attendanceStatusLabel(dynamic rawValue) {
    final text = readString(rawValue).toUpperCase();
    switch (text) {
      case 'PRESENT':
      case 'حاضر':
        return 'حاضر';
      case 'ABSENT':
      case 'غائب':
        return 'غائب';
      case 'LATE':
      case 'متأخر':
        return 'متأخر';
      default:
        return 'غير محدد';
    }
  }

  /// Standardizes attendance status colors
  static Color attendanceStatusColor(dynamic rawValue) {
    final label = attendanceStatusLabel(rawValue);
    switch (label) {
      case 'حاضر':
        return AppColors.successLight;
      case 'غائب':
        return AppColors.errorLight;
      case 'متأخر':
        return AppColors.warningLight;
      default:
        return AppColors.textSecondaryLight;
    }
  }

  /// Standardizes follow-up type labels (Memorization, Review, etc.)
  static String followUpTypeLabel(dynamic rawValue) {
    final text = readString(rawValue).toUpperCase();
    switch (text) {
      case 'NEW_MEMORIZATION':
      case 'MEMORIZATION':
      case 'حفظ':
        return 'حفظ';
      case 'REVIEW':
      case 'مراجعة':
        return 'مراجعة';
      default:
        return 'متن';
    }
  }

  /// Standardizes follow-up type colors
  static Color followUpTypeColor(dynamic rawValue) {
    final label = followUpTypeLabel(rawValue);
    switch (label) {
      case 'حفظ':
        return AppColors.primaryLight;
      case 'مراجعة':
        return AppColors.infoLight;
      default:
        return AppColors.warningLight;
    }
  }

  /// Converts numeric rating (0-100) to stars count (1-5)
  static int ratingToStars(dynamic rawValue) {
    final rating = readInt(rawValue) ?? 0;
    if (rating <= 0) return 0;
    return ((rating / 20).ceil()).clamp(1, 5);
  }

  /// Standardizes student level labels
  static String? studentLevelLabel(String? level) {
    final raw = level?.trim().toUpperCase();
    if (raw == null || raw.isEmpty) return null;
    switch (raw) {
      case 'BEGINNER':
        return 'مبتدئ';
      case 'INTERMEDIATE':
        return 'متوسط';
      case 'ADVANCED':
        return 'متقدم';
      default:
        return raw;
    }
  }

  /// Standardizes student level colors
  static Color studentLevelColor(String? levelLabel) {
    switch (levelLabel) {
      case 'مبتدئ':
        return AppColors.warningLight;
      case 'متوسط':
        return AppColors.infoLight;
      case 'متقدم':
        return AppColors.successLight;
      default:
        return AppColors.primaryLight;
    }
  }

  /// Formats a follow-up record into a readable detail string (Surah/Ayahs or Matn or Notes)
  static String formatFollowUpDetail({
    String? surah,
    int? fromAyah,
    int? toAyah,
    String? matnName,
    String? notes,
  }) {
    if (surah != null && surah.isNotEmpty) {
      if (fromAyah != null && toAyah != null) {
        return '$surah ($fromAyah-$toAyah)';
      }
      return surah;
    }

    if (matnName != null && matnName.isNotEmpty) {
      return matnName;
    }

    if (notes != null && notes.isNotEmpty) {
      return notes.length > 30 ? '${notes.substring(0, 27)}...' : notes;
    }

    return 'سجل متابعة';
  }

  /// Helper for Map-based follow-up formatting
  static String formatFollowUpMap(Map<String, dynamic> item) {
    return formatFollowUpDetail(
      surah: readString(item['surah']),
      fromAyah: readInt(item['fromAyah']),
      toAyah: readInt(item['toAyah']),
      matnName: readString(item['matnName']),
      notes: readString(item['notes']),
    );
  }

  /// Standardizes student status labels
  static String studentStatusLabel(String? status) {
    final raw = status?.trim().toUpperCase();
    switch (raw) {
      case 'REGULAR':
        return 'منتظم';
      case 'GRADUATED':
        return 'متخرج';
      case 'DROPPED':
        return 'منقطع';
      default:
        return 'غير محدد';
    }
  }

  /// Standardizes student status colors
  static Color studentStatusColor(String? status) {
    final raw = status?.trim().toUpperCase();
    switch (raw) {
      case 'REGULAR':
        return AppColors.successLight;
      case 'GRADUATED':
        return AppColors.primaryLight;
      case 'DROPPED':
        return AppColors.errorLight;
      default:
        return AppColors.warningLight;
    }
  }
}
