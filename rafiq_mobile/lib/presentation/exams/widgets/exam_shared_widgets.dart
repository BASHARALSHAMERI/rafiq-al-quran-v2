import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/exam_dtos.dart';

const surahNames = <String>[
  'الفاتحة',
  'البقرة',
  'آل عمران',
  'النساء',
  'المائدة',
  'الأنعام',
  'الأعراف',
  'الأنفال',
  'التوبة',
  'يونس',
  'هود',
  'يوسف',
  'الرعد',
  'إبراهيم',
  'الحجر',
  'النحل',
  'الإسراء',
  'الكهف',
  'مريم',
  'طه',
  'الأنبياء',
  'الحج',
  'المؤمنون',
  'النور',
  'الفرقان',
  'الشعراء',
  'النمل',
  'القصص',
  'العنكبوت',
  'الروم',
  'لقمان',
  'السجدة',
  'الأحزاب',
  'سبأ',
  'فاطر',
  'يس',
  'الصافات',
  'ص',
  'الزمر',
  'غافر',
  'فصلت',
  'الشورى',
  'الزخرف',
  'الدخان',
  'الجاثية',
  'الأحقاف',
  'محمد',
  'الفتح',
  'الحجرات',
  'ق',
  'الذاريات',
  'الطور',
  'النجم',
  'القمر',
  'الرحمن',
  'الواقعة',
  'الحديد',
  'المجادلة',
  'الحشر',
  'الممتحنة',
  'الصف',
  'الجمعة',
  'المنافقون',
  'التغابن',
  'الطلاق',
  'التحريم',
  'الملك',
  'القلم',
  'الحاقة',
  'المعارج',
  'نوح',
  'الجن',
  'المزمل',
  'المدثر',
  'القيامة',
  'الإنسان',
  'المرسلات',
  'النبأ',
  'النازعات',
  'عبس',
  'التكوير',
  'الانفطار',
  'المطففين',
  'الانشقاق',
  'البروج',
  'الطارق',
  'الأعلى',
  'الغاشية',
  'الفجر',
  'البلد',
  'الشمس',
  'الليل',
  'الضحى',
  'الشرح',
  'التين',
  'العلق',
  'القدر',
  'البينة',
  'الزلزلة',
  'العاديات',
  'القارعة',
  'التكاثر',
  'العصر',
  'الهمزة',
  'الفيل',
  'قريش',
  'الماعون',
  'الكوثر',
  'الكافرون',
  'النصر',
  'المسد',
  'الإخلاص',
  'الفلق',
  'الناس',
];

String surahName(int n) {
  if (n < 1 || n > 114) return 'سورة $n';
  return 'سورة ${surahNames[n - 1]}';
}

const examStrengthSuggestions = <String>[
  'جمال الصوت',
  'حسن الأداء',
  'قوة الحفظ',
  'إتقان التجويد',
  'وضوح المخارج',
];

const examWeaknessSuggestions = <String>[
  'سرعة القراءة',
  'ضعف التجويد',
  'ضعف الحفظ',
  'كثرة التلقين',
  'اضطراب الترتيل',
];

class ExamSheetScaffold extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  final Widget bottom;

  const ExamSheetScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
    required this.bottom,
  });

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context);

    return AnimatedPadding(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      padding: EdgeInsets.only(bottom: viewInsets.bottom),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Material(
          color: context.cardColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.92,
            child: Column(
              children: [
                const SizedBox(height: 10),
                Container(
                  width: 56,
                  height: 5,
                  decoration: BoxDecoration(
                    color: context.borderColor,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    color: context.textPrimaryColor,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              subtitle,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: context.textSecondaryColor,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: Icon(Icons.close_rounded, color: context.textSecondaryColor),
                      ),
                    ],
                  ),
                ),
                Divider(height: 1, color: context.borderColor),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
                    child: child,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  child: bottom,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ExamSectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const ExamSectionHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 15,
            color: context.textPrimaryColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: context.textSecondaryColor,
          ),
        ),
      ],
    );
  }
}

class ExamSearchField extends StatelessWidget {
  final TextEditingController controller;
  final String query;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  final String hintText;

  const ExamSearchField({
    super.key,
    required this.controller,
    required this.query,
    required this.onChanged,
    required this.onClear,
    this.hintText = 'ابحث باسم الطالب أو الاختبار...',
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: TextStyle(color: context.textPrimaryColor),
      decoration: InputDecoration(
        hintText: hintText,
        filled: true,
        fillColor: context.cardColor,
        prefixIcon: Icon(Icons.search_rounded, color: context.textSecondaryColor),
        suffixIcon: query.isEmpty
            ? null
            : IconButton(
                onPressed: onClear,
                icon: Icon(Icons.close_rounded, color: context.textSecondaryColor),
              ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: context.borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: context.borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(
            color: primary,
            width: 1.4,
          ),
        ),
      ),
    );
  }
}

class ExamStatusBadge extends StatelessWidget {
  final String status;
  final bool light;

  const ExamStatusBadge({
    super.key,
    required this.status,
    this.light = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = examStatusColors(context, status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: light ? Colors.white.withValues(alpha: 0.16) : colors.$1,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        examStatusLabel(status),
        style: TextStyle(
          color: light ? Colors.white : colors.$2,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}

class ExamPill extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const ExamPill({
    super.key,
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: context.isDark ? 0.20 : 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              text,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w800,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ExamInlineWarningCard extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ExamInlineWarningCard({
    super.key,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: custom.warning.withValues(alpha: context.isDark ? 0.18 : 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: custom.warning.withValues(alpha: 0.25),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: custom.warning,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: context.textPrimaryColor,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (onRetry != null)
            TextButton(
              onPressed: onRetry,
              child: const Text('إعادة المحاولة'),
            ),
        ],
      ),
    );
  }
}

String examStatusLabel(String status) {
  switch (status) {
    case 'SUBMITTED':
      return 'مرسل';
    case 'RETURNED':
      return 'معاد';
    case 'REJECTED':
      return 'مرفوض';
    case 'DEFERRED':
      return 'مؤجل';
    case 'SUPERVISOR_APPROVED':
      return 'جاهز لمراجعة المركز';
    case 'CENTER_APPROVED':
      return 'اعتماد مركز';
    case 'SCHEDULED':
      return 'مجدول';
    case 'IN_PROGRESS':
      return 'قيد التنفيذ';
    case 'EVALUATED':
      return 'مُقيّم';
    case 'APPROVED':
      return 'معتمد';
    case 'PUBLISHED':
      return 'منشور';
    case 'CANCELLED':
      return 'ملغي';
    default:
      return status;
  }
}

(Color, Color) examStatusColors(BuildContext context, String status) {
  final custom = context.customColors;
  final isDark = context.isDark;
  final alpha = isDark ? 0.22 : 0.10;

  switch (status) {
    case 'PUBLISHED':
      return (
        custom.success.withValues(alpha: alpha),
        custom.success,
      );
    case 'EVALUATED':
    case 'APPROVED':
    case 'SUPERVISOR_APPROVED':
    case 'CENTER_APPROVED':
    case 'IN_PROGRESS':
      return (
        custom.info.withValues(alpha: alpha),
        custom.info,
      );
    case 'SCHEDULED':
    case 'SUBMITTED':
    case 'RETURNED':
    case 'DEFERRED':
      return (
        custom.warning.withValues(alpha: alpha),
        custom.warning,
      );
    case 'REJECTED':
    case 'CANCELLED':
      return (
        Theme.of(context).colorScheme.error.withValues(alpha: alpha),
        Theme.of(context).colorScheme.error,
      );
    default:
      return (context.borderColor, context.textSecondaryColor);
  }
}

InputDecoration examInputDecoration(
  BuildContext context,
  String hintText, {
  String? helperText,
}) {
  final primary = Theme.of(context).colorScheme.primary;

  return InputDecoration(
    hintText: hintText,
    helperText: helperText,
    filled: true,
    fillColor: context.cardColor,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide(color: context.borderColor),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide(color: context.borderColor),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide(color: primary, width: 1.4),
    ),
  );
}

String? trimOrNull(String value) {
  final normalized = value.trim();
  if (normalized.isEmpty) {
    return null;
  }
  return normalized;
}

List<String> splitListText(String value) {
  final items = value
      .split(RegExp(r'[،,;\n]+'))
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList(growable: false);
  final seen = <String>{};
  final normalized = <String>[];
  for (final item in items) {
    if (seen.add(item)) {
      normalized.add(item);
    }
  }
  return normalized;
}

String? normalizeListText(String value) {
  final items = splitListText(value);
  if (items.isEmpty) {
    return null;
  }
  return items.join(', ');
}

ExamCriteriaDto? resolveExamCriteria(ExamSummaryDto? exam) {
  if (exam == null) {
    return null;
  }
  if (exam.criteria != null) {
    return exam.criteria;
  }

  final memorization = (exam.maxScore * 0.7).roundToDouble();
  final tajweed = (exam.maxScore * 0.2).roundToDouble();
  final performance = exam.maxScore - memorization - tajweed;
  return ExamCriteriaDto(
    id: 0,
    memorizationScore: memorization,
    tajweedScore: tajweed,
    theoreticalTajweedScore: 0,
    performanceScore: performance < 0 ? 0 : performance,
    promptingPenalty: 1,
    remindingPenalty: 1,
    tajweedPenalty: 1,
  );
}

String initialNumericValue(double? currentValue, double? fallbackValue) {
  final value = currentValue ?? fallbackValue ?? 0;
  if (value == value.roundToDouble()) {
    return value.toInt().toString();
  }
  return value.toString();
}

double readDouble(TextEditingController controller) {
  final text = controller.text.trim();
  return double.tryParse(text) ?? 0;
}
