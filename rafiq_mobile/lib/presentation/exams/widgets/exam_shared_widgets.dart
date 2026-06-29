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
          color: AppColors.surfaceLight,
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
                    color: AppColors.borderLight,
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
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              subtitle,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppColors.textSecondaryLight,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
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
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondaryLight,
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
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hintText,
        filled: true,
        fillColor: Colors.white,
        prefixIcon: const Icon(Icons.search_rounded),
        suffixIcon: query.isEmpty
            ? null
            : IconButton(
                onPressed: onClear,
                icon: const Icon(Icons.close_rounded),
              ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(
            color: AppColors.primaryLight,
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
    final colors = examStatusColors(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: light ? Colors.white.withValues(alpha: 0.16) : colors.$1,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        examStatusLabel(status),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: light ? Colors.white : colors.$2,
              fontWeight: FontWeight.w700,
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
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
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.warningLight.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: AppColors.warningLight.withValues(alpha: 0.18),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: AppColors.warningLight,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textPrimaryLight,
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

(Color, Color) examStatusColors(String status) {
  switch (status) {
    case 'PUBLISHED':
      return (
        AppColors.successLight.withValues(alpha: 0.08),
        AppColors.successLight,
      );
    case 'EVALUATED':
    case 'APPROVED':
    case 'SUPERVISOR_APPROVED':
    case 'CENTER_APPROVED':
    case 'IN_PROGRESS':
      return (
        AppColors.infoLight.withValues(alpha: 0.08),
        AppColors.infoLight,
      );
    case 'SCHEDULED':
    case 'SUBMITTED':
    case 'RETURNED':
    case 'DEFERRED':
      return (
        AppColors.warningLight.withValues(alpha: 0.08),
        AppColors.warningLight,
      );
    case 'REJECTED':
    case 'CANCELLED':
      return (
        AppColors.errorLight.withValues(alpha: 0.08),
        AppColors.errorLight,
      );
    default:
      return (AppColors.borderLight, AppColors.textSecondaryLight);
  }
}

InputDecoration examInputDecoration(
  String hintText, {
  String? helperText,
}) {
  return InputDecoration(
    hintText: hintText,
    helperText: helperText,
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: AppColors.borderLight),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: AppColors.borderLight),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: AppColors.primaryLight, width: 1.4),
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
