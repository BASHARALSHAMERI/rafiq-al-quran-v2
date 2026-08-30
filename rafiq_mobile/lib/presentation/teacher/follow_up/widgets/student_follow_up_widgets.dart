import 'package:flutter/material.dart';

import '../../../../core/constants/app_radius.dart';
import '../../../../core/constants/quran_data.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/entities/student_profile.dart';

enum FollowUpSessionSection { memorization, review, matn }

class StudentFollowUpLastRecords extends StatelessWidget {
  final List<FollowUpRecord> records;

  const StudentFollowUpLastRecords({
    super.key,
    required this.records,
  });

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;

    FollowUpRecord? latestOf(String type) {
      for (final record in records) {
        if (record.type == type) {
          return record;
        }
      }
      return null;
    }

    final memorization = latestOf('NEW_MEMORIZATION');
    final review = latestOf('REVIEW');
    final matn = latestOf('MATN');

    String formatRange(FollowUpRecord? record) {
      if (record == null) {
        return 'لم يسجل بعد';
      }
      if (record.surah == null) {
        return record.matnName ?? 'مسجل';
      }
      if (record.fromAyah != null && record.toAyah != null) {
        return '${record.surah} (${record.fromAyah}-${record.toAyah})';
      }
      return record.surah!;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'تاريخ آخر متابعة للطالب',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 14,
            color: context.textPrimaryColor,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _LastRecordCard(
                title: 'آخر حفظ',
                value: formatRange(memorization),
                color: primary,
                icon: Icons.menu_book_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _LastRecordCard(
                title: 'آخر مراجعة',
                value: formatRange(review),
                color: custom.info,
                icon: Icons.autorenew_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _LastRecordCard(
                title: 'آخر متن',
                value: matn?.matnName ?? 'لم يسجل بعد',
                color: custom.success,
                icon: Icons.bookmark_added_rounded,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class FollowUpNoticeBanner extends StatelessWidget {
  final Color color;
  final String title;
  final String message;
  final Widget? action;

  const FollowUpNoticeBanner({
    super.key,
    required this.color,
    required this.title,
    required this.message,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.16 : 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: color.withValues(alpha: isDark ? 0.28 : 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
          if (message.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              message,
              style: TextStyle(
                color: context.textPrimaryColor,
                height: 1.5,
                fontSize: 13,
              ),
            ),
          ],
          if (action != null) ...[
            const SizedBox(height: 12),
            action!,
          ],
        ],
      ),
    );
  }
}

class FollowUpHorizontalStepper extends StatelessWidget {
  final FollowUpSessionSection activeSection;
  final Map<FollowUpSessionSection, bool> saved;
  final Map<FollowUpSessionSection, List<String>> issues;
  final ValueChanged<FollowUpSessionSection> onSelect;

  const FollowUpHorizontalStepper({
    super.key,
    required this.activeSection,
    required this.saved,
    required this.issues,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;

    final steps = [
      (
        section: FollowUpSessionSection.memorization,
        label: 'الحفظ',
        icon: Icons.menu_book_rounded,
        color: primary,
      ),
      (
        section: FollowUpSessionSection.review,
        label: 'المراجعة',
        icon: Icons.autorenew_rounded,
        color: custom.info,
      ),
      (
        section: FollowUpSessionSection.matn,
        label: 'المتون',
        icon: Icons.bookmark_added_rounded,
        color: custom.success,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        children: steps.map((step) {
          final isActive = step.section == activeSection;
          final isSaved = saved[step.section] == true;
          final hasIssue = (issues[step.section] ?? []).isNotEmpty;
          final statusIcon = hasIssue
              ? Icons.error_rounded
              : isSaved
                  ? Icons.check_circle_rounded
                  : step.icon;
          final statusColor = hasIssue
              ? Theme.of(context).colorScheme.error
              : isSaved
                  ? custom.success
                  : step.color;

          return Expanded(
            child: GestureDetector(
              onTap: () => onSelect(step.section),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  color: isActive ? step.color : Colors.transparent,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      statusIcon,
                      size: 22,
                      color: isActive ? Colors.white : statusColor,
                    ),
                    const SizedBox(height: 5),
                    Text(
                      step.label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: isActive
                            ? Colors.white
                            : context.textSecondaryColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(growable: false),
      ),
    );
  }
}

class FollowUpSectionShell extends StatelessWidget {
  final Color color;
  final IconData? icon;
  final String? title;
  final String? description;
  final Widget child;

  const FollowUpSectionShell({
    super.key,
    required this.color,
    this.icon,
    this.title,
    this.description,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final showHeader = icon != null || title != null || description != null;
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (showHeader) ...[
            Row(
              children: [
                if (icon != null)
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: isDark ? 0.20 : 0.10),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: color.withValues(alpha: isDark ? 0.30 : 0.15)),
                    ),
                    child: Icon(icon!, size: 20, color: color),
                  ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (title != null)
                        Text(
                          title!,
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: context.textPrimaryColor,
                          ),
                        ),
                      if (description != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          description!,
                          style: TextStyle(
                            color: context.textSecondaryColor,
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
          ],
          child,
        ],
      ),
    );
  }
}

class FollowUpFieldGroupLabel extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const FollowUpFieldGroupLabel({
    super.key,
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 15, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 13,
            color: color,
          ),
        ),
      ],
    );
  }
}

class FollowUpSurahDropdown extends StatelessWidget {
  final String label;
  final QuranSurah? selected;
  final ValueChanged<QuranSurah?> onChanged;
  final int? minSurahNumber;
  final Color accent;

  const FollowUpSurahDropdown({
    super.key,
    required this.label,
    required this.selected,
    required this.onChanged,
    required this.accent,
    this.minSurahNumber,
  });

  @override
  Widget build(BuildContext context) {
    final minimumSurahNumber = minSurahNumber;
    final surahs = minimumSurahNumber == null
        ? QuranData.surahs
        : QuranData.surahs
            .where((item) => item.number >= minimumSurahNumber)
            .toList(growable: false);
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: context.textSecondaryColor,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<int>(
          key: ValueKey('$label-${selected?.number}-$minSurahNumber'),
          initialValue: selected?.number,
          isExpanded: true,
          dropdownColor: context.cardColor,
          icon: Icon(
            Icons.keyboard_arrow_down_rounded,
            color: context.textSecondaryColor,
          ),
          decoration: followUpFieldDecoration(context, accent),
          items: surahs
              .map(
                (item) => DropdownMenuItem<int>(
                  value: item.number,
                  child: Center(
                    child: Text(
                      item.name,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: context.textPrimaryColor,
                      ),
                    ),
                  ),
                ),
              )
              .toList(growable: false),
          onChanged: (value) =>
              onChanged(value == null ? null : QuranData.findByNumber(value)),
        ),
      ],
    );
  }
}

class FollowUpNotesField extends StatelessWidget {
  final String hint;
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final int minLines;
  final int maxLines;

  const FollowUpNotesField({
    super.key,
    required this.hint,
    required this.controller,
    required this.onChanged,
    this.minLines = 2,
    this.maxLines = 4,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      minLines: minLines,
      maxLines: maxLines,
      onChanged: onChanged,
      style: TextStyle(color: context.textPrimaryColor),
      decoration: followUpFieldDecoration(context, Theme.of(context).colorScheme.primary).copyWith(
        hintText: hint,
        alignLabelWithHint: true,
      ),
    );
  }
}

class FollowUpRatingBox extends StatelessWidget {
  final int rating;
  final Color accent;
  final ValueChanged<int> onChanged;

  const FollowUpRatingBox({
    super.key,
    required this.rating,
    required this.accent,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    const labels = ['ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'];
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: isDark ? 0.16 : 0.05),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: accent.withValues(alpha: isDark ? 0.25 : 0.15)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              final value = index + 1;
              return GestureDetector(
                onTap: () => onChanged(value),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    value <= rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: value <= rating
                        ? context.customColors.warning
                        : context.borderColor,
                    size: 36,
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: Text(
              labels[rating - 1],
              key: ValueKey(rating),
              style: TextStyle(
                color: accent,
                fontWeight: FontWeight.w800,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class FollowUpInfoBox extends StatelessWidget {
  final Color color;
  final String title;
  final String value;

  const FollowUpInfoBox({
    super.key,
    required this.color,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.16 : 0.06),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                color: context.textSecondaryColor,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w900,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

class FollowUpAyahInput extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final int? maxAyah;
  final Color accent;
  final ValueChanged<String>? onChanged;

  const FollowUpAyahInput({
    super.key,
    required this.label,
    required this.controller,
    required this.accent,
    this.maxAyah,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: context.textSecondaryColor,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 15,
            color: context.textPrimaryColor,
          ),
          decoration: followUpFieldDecoration(context, accent),
          onChanged: (value) {
            final parsed = int.tryParse(value);
            if (parsed != null && parsed < 1) {
              controller.text = '1';
            } else if (maxAyah != null && parsed != null && parsed > maxAyah!) {
              controller.text = '$maxAyah';
            }
            controller.selection = TextSelection.fromPosition(
              TextPosition(offset: controller.text.length),
            );
            onChanged?.call(controller.text);
          },
        ),
      ],
    );
  }
}

class FollowUpStatusChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const FollowUpStatusChip({
    super.key,
    required this.label,
    required this.icon,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? color : context.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: selected ? color : context.borderColor,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? Colors.white : context.textSecondaryColor,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: selected ? Colors.white : context.textSecondaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

InputDecoration followUpFieldDecoration(BuildContext context, Color focusColor) {
  final theme = Theme.of(context);
  final isDark = context.isDark;

  return InputDecoration(
    filled: true,
    fillColor: isDark ? theme.colorScheme.surfaceContainerHighest : const Color(0xFFFBFBFA),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: context.borderColor),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: context.borderColor),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: focusColor, width: 1.5),
    ),
    hintStyle: TextStyle(
      color: context.textSecondaryColor,
      fontSize: 14,
    ),
    labelStyle: TextStyle(
      color: focusColor.withValues(alpha: 0.7),
      fontSize: 14,
      fontWeight: FontWeight.w600,
    ),
  );
}

class _LastRecordCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;
  final IconData icon;

  const _LastRecordCard({
    required this.title,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: color.withValues(alpha: isDark ? 0.25 : 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: context.textPrimaryColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class AchievementMiniCard extends StatelessWidget {
  final String title;
  final FollowUpRecord? record;
  final IconData icon;

  const AchievementMiniCard({
    super.key,
    required this.title,
    required this.record,
    required this.icon,
  });

  String _formatRecordRange(FollowUpRecord? record) {
    if (record == null) {
      return 'لم يسجل بعد';
    }
    if (record.surah == null) {
      return record.matnName ?? 'مسجل';
    }
    if (record.fromAyah != null && record.toAyah != null) {
      return '${record.surah} (${record.fromAyah}-${record.toAyah})';
    }
    return record.surah!;
  }

  void _showAchievementDetailsBottomSheet(BuildContext context) {
    if (record == null) return;

    final formattedDate = record!.recordDate.toIso8601String().split('T').first;
    final ratingVal = record!.rating ?? 0;
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final custom = context.customColors;
    final isDark = context.isDark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: context.surfaceColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.borderColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: Icon(icon, color: primary, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: context.textSecondaryColor,
                          ),
                        ),
                        Text(
                          _formatRecordRange(record),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: context.textPrimaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Divider(color: context.borderColor, height: 1),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'تاريخ التسجيل:',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: context.textSecondaryColor,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? theme.colorScheme.surfaceContainerHighest : AppColors.surfaceVariantLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      formattedDate,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: context.textPrimaryColor,
                      ),
                    ),
                  ),
                ],
              ),
              if (record!.type != 'MATN' && ratingVal > 0) ...[
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'التقييم:',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: context.textSecondaryColor,
                      ),
                    ),
                    Row(
                      children: List.generate(5, (index) {
                        return Icon(
                          index < ratingVal ? Icons.star_rounded : Icons.star_border_rounded,
                          color: index < ratingVal ? custom.warning : context.borderColor,
                          size: 22,
                        );
                      }),
                    ),
                  ],
                ),
              ],
              if (record!.type == 'MATN' && record!.matnStatus != null) ...[
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'حالة الإتقان:',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: context.textSecondaryColor,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: (record!.matnStatus == 'COMPLETED'
                                ? custom.success
                                : custom.warning)
                            .withValues(alpha: isDark ? 0.20 : 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        record!.matnStatus == 'COMPLETED' ? 'متقن' : 'يحتاج متابعة',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          color: record!.matnStatus == 'COMPLETED'
                              ? custom.success
                              : custom.warning,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              if (record!.teacherName != null) ...[
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'بواسطة المعلم:',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: context.textSecondaryColor,
                      ),
                    ),
                    Text(
                      record!.teacherName!,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: context.textPrimaryColor,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 18),
              Text(
                'ملاحظات وتوجيهات المعلم:',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  color: context.textPrimaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? theme.colorScheme.surfaceContainerHighest : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: context.borderColor),
                ),
                child: Text(
                  record!.notes ?? 'لا توجد ملاحظات مسجلة.',
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.5,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimaryColor,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final value = _formatRecordRange(record);

    return InteractiveCardWrapper(
      onTap: () => _showAchievementDetailsBottomSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: context.borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 13, color: primary),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      color: context.textSecondaryColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12,
                color: context.textPrimaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PlanProgressMiniCard extends StatelessWidget {
  final String title;
  final String rangeText;
  final double executed;
  final double target;
  final double rate;
  final IconData icon;

  const PlanProgressMiniCard({
    super.key,
    required this.title,
    required this.rangeText,
    required this.executed,
    required this.target,
    required this.rate,
    required this.icon,
  });

  void _showPlanDetailsBottomSheet(BuildContext context) {
    final safeRate = rate.isNaN || rate.isInfinite ? 0.0 : rate;
    final clampedRate = safeRate > 1.0 ? safeRate / 100.0 : safeRate;
    final displayPercent = (clampedRate * 100).round().clamp(0, 100);

    final safeExecuted = executed.isNaN || executed.isInfinite ? 0.0 : executed;
    final safeTarget = target.isNaN || target.isInfinite ? 0.0 : target;
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final isDark = context.isDark;

    String motivationMessage = 'لم يتم تسجيل أي صفحات من الخطة بعد. فلنبدأ بهمة ونشاط! 💪';
    if (displayPercent >= 100) {
      motivationMessage = 'ممتاز! تم إنجاز الخطة الشهرية بالكامل 🥳';
    } else if (displayPercent >= 50) {
      motivationMessage = 'رائع! استمر في التقدم والمتابعة لتحقيق الهدف 👏';
    } else if (displayPercent > 0) {
      motivationMessage = 'بداية جيدة! خطوة بخطوة نحو تحقيق خطتك 🎯';
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: context.surfaceColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.borderColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: Icon(icon, color: primary, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: primary,
                          ),
                        ),
                        Text(
                          rangeText,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: context.textPrimaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Divider(color: context.borderColor, height: 1),
              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  SizedBox(
                    width: 90,
                    height: 90,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 80,
                          height: 80,
                          child: CircularProgressIndicator(
                            value: clampedRate.clamp(0.0, 1.0),
                            strokeWidth: 8,
                            backgroundColor: primary.withValues(alpha: 0.12),
                            valueColor: AlwaysStoppedAnimation<Color>(primary),
                          ),
                        ),
                        Text(
                          '$displayPercent%',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: primary,
                          ),
                        ),
                      ],
                    ),
                  ),

                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDetailRow(context, 'المنجز:', '${safeExecuted.toStringAsFixed(1)} صفحة'),
                      const SizedBox(height: 10),
                      _buildDetailRow(context, 'المستهدف:', '${safeTarget.toStringAsFixed(1)} صفحة'),
                      const SizedBox(height: 10),
                      _buildDetailRow(context, 'المتبقي:', '${(safeTarget - safeExecuted).clamp(0.0, double.infinity).toStringAsFixed(1)} صفحة'),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: primary.withValues(alpha: isDark ? 0.16 : 0.08),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: primary.withValues(alpha: isDark ? 0.25 : 0.15)),
                ),
                child: Text(
                  motivationMessage,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w800,
                    color: context.textPrimaryColor,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value) {
    return Row(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: context.textSecondaryColor,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: context.textPrimaryColor,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final isDark = context.isDark;
    final safeRate = rate.isNaN || rate.isInfinite ? 0.0 : rate;
    final clampedRate = safeRate > 1.0 ? safeRate / 100.0 : safeRate;

    final safeExecuted = executed.isNaN || executed.isInfinite ? 0.0 : executed;
    final safeTarget = target.isNaN || target.isInfinite ? 0.0 : target;

    return InteractiveCardWrapper(
      onTap: () => _showPlanDetailsBottomSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: primary.withValues(alpha: isDark ? 0.16 : 0.08),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: primary.withValues(alpha: isDark ? 0.25 : 0.20)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 13, color: primary),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      color: primary,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0.0, end: clampedRate),
                  duration: const Duration(milliseconds: 650),
                  curve: Curves.easeOut,
                  builder: (context, animValue, child) {
                    final displayPercent = (animValue * 100).round().clamp(0, 100);
                    return Text(
                      '$displayPercent%',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                        color: primary,
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              rangeText,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12,
                color: context.textPrimaryColor,
              ),
            ),
            const SizedBox(height: 6),
            TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0.0, end: clampedRate),
              duration: const Duration(milliseconds: 650),
              curve: Curves.easeOut,
              builder: (context, animValue, child) {
                return ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: animValue.clamp(0.0, 1.0),
                    backgroundColor: primary.withValues(alpha: 0.15),
                    valueColor: AlwaysStoppedAnimation<Color>(primary),
                    minHeight: 3.5,
                  ),
                );
              },
            ),
            const SizedBox(height: 4),
            Text(
              '${safeExecuted.toStringAsFixed(1)} / ${safeTarget.toStringAsFixed(1)} ص',
              style: TextStyle(
                color: context.textSecondaryColor,
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class InteractiveCardWrapper extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;

  const InteractiveCardWrapper({
    super.key,
    required this.child,
    required this.onTap,
  });

  @override
  State<InteractiveCardWrapper> createState() => _InteractiveCardWrapperState();
}

class _InteractiveCardWrapperState extends State<InteractiveCardWrapper>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 90),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.child,
      ),
    );
  }
}
