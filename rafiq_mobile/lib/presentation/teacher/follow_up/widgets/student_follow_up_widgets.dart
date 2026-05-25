import 'package:flutter/material.dart';

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
        const Text(
          'تاريخ آخر متابعة للطالب',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 14,
            color: AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _LastRecordCard(
                title: 'آخر حفظ',
                value: formatRange(memorization),
                color: AppColors.secondaryLight,
                icon: Icons.menu_book_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _LastRecordCard(
                title: 'آخر مراجعة',
                value: formatRange(review),
                color: AppColors.infoLight,
                icon: Icons.autorenew_rounded,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _LastRecordCard(
                title: 'آخر متن',
                value: matn?.matnName ?? 'لم يسجل بعد',
                color: AppColors.successLight,
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.18)),
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
          const SizedBox(height: 6),
          Text(
            message,
            style: const TextStyle(
              color: AppColors.textPrimaryLight,
              height: 1.5,
              fontSize: 13,
            ),
          ),
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
    final steps = [
      (
        section: FollowUpSessionSection.memorization,
        label: 'الحفظ',
        icon: Icons.menu_book_rounded,
        color: AppColors.secondaryLight,
      ),
      (
        section: FollowUpSessionSection.review,
        label: 'المراجعة',
        icon: Icons.autorenew_rounded,
        color: AppColors.infoLight,
      ),
      (
        section: FollowUpSessionSection.matn,
        label: 'المتون',
        icon: Icons.bookmark_added_rounded,
        color: AppColors.successLight,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderLight),
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
              ? AppColors.errorLight
              : isSaved
                  ? AppColors.successLight
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
                  borderRadius: BorderRadius.circular(13),
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
                            : AppColors.textSecondaryLight,
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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
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
                      gradient: LinearGradient(
                        colors: [color.withValues(alpha: 0.15), color.withValues(alpha: 0.05)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: color.withValues(alpha: 0.1)),
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
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: AppColors.textPrimaryLight,
                          ),
                        ),
                      if (description != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          description!,
                          style: const TextStyle(
                            color: AppColors.textSecondaryLight,
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
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<int>(
          key: ValueKey('$label-${selected?.number}-$minSurahNumber'),
          initialValue: selected?.number,
          isExpanded: true,
          icon: const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: AppColors.textSecondaryLight,
          ),
          decoration: followUpFieldDecoration(accent),
          items: surahs
              .map(
                (item) => DropdownMenuItem<int>(
                  value: item.number,
                  child: Center(
                    child: Text(
                      item.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: AppColors.textPrimaryLight,
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
      decoration: followUpFieldDecoration(AppColors.primaryLight).copyWith(
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.2)),
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
                        ? AppColors.warningLight
                        : AppColors.borderLight,
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: AppColors.textSecondaryLight,
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
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 15,
            color: AppColors.textPrimaryLight,
          ),
          decoration: followUpFieldDecoration(accent),
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
          color: selected ? color : AppColors.cardLight,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? color : AppColors.borderLight,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? Colors.white : AppColors.textSecondaryLight,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: selected ? Colors.white : AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

InputDecoration followUpFieldDecoration(Color focusColor) {
  return InputDecoration(
    filled: true,
    fillColor: const Color(0xFFFBFBFA),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: AppColors.borderLight.withValues(alpha: 0.8)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: AppColors.borderLight.withValues(alpha: 0.8)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: focusColor, width: 1.5),
    ),
    hintStyle: const TextStyle(
      color: AppColors.textSecondaryLight,
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.15)),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
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
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimaryLight,
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

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
                    color: AppColors.borderLight,
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
                      color: const Color(0xFFEFF6F3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: const Color(0xFF568A78), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textSecondaryLight,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        Text(
                          _formatRecordRange(record),
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimaryLight,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              const Divider(color: AppColors.borderLight, height: 1),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'تاريخ التسجيل:',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.borderLight.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      formattedDate,
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: AppColors.textPrimaryLight,
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
                    const Text(
                      'التقييم:',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    Row(
                      children: List.generate(5, (index) {
                        return Icon(
                          index < ratingVal ? Icons.star_rounded : Icons.star_border_rounded,
                          color: index < ratingVal ? AppColors.warningLight : AppColors.borderLight,
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
                    const Text(
                      'حالة الإتقان:',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: record!.matnStatus == 'COMPLETED'
                            ? AppColors.successLight.withValues(alpha: 0.12)
                            : AppColors.warningLight.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: record!.matnStatus == 'COMPLETED'
                              ? AppColors.successLight
                              : AppColors.warningLight,
                          width: 1,
                        ),
                      ),
                      child: Text(
                        record!.matnStatus == 'COMPLETED' ? 'متقن' : 'يحتاج متابعة',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          color: record!.matnStatus == 'COMPLETED'
                              ? AppColors.successLight
                              : AppColors.warningLight,
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
                    const Text(
                      'بواسطة المعلم:',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    Text(
                      record!.teacherName!,
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 20),
              const Text(
                'ملاحظات وتوجيهات المعلم:',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  color: AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.borderLight.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Text(
                  record!.notes ?? 'لا توجد ملاحظات مسجلة.',
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13,
                    height: 1.5,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimaryLight,
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
    const accentColor = Color(0xFF568A78);
    final value = _formatRecordRange(record);

    return InteractiveCardWrapper(
      onTap: () => _showAchievementDetailsBottomSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.cardLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.8)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 13, color: accentColor),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      color: AppColors.textSecondaryLight,
                      fontFamily: 'Cairo',
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
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12,
                color: AppColors.textPrimaryLight,
                fontFamily: 'Cairo',
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
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
                    color: AppColors.borderLight,
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
                      color: const Color(0xFFEFF6F3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: const Color(0xFF568A78), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF3B6657),
                            fontFamily: 'Cairo',
                          ),
                        ),
                        Text(
                          rangeText,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF2C4C41),
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              const Divider(color: AppColors.borderLight, height: 1),
              const SizedBox(height: 20),

              // Progress Gauge & Numbers
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  // Circular Progress Indicator
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
                            backgroundColor: const Color(0xFF568A78).withValues(alpha: 0.12),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF568A78)),
                          ),
                        ),
                        Text(
                          '$displayPercent%',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF3B6657),
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Details
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDetailRow('المنجز:', '${safeExecuted.toStringAsFixed(1)} صفحة'),
                      const SizedBox(height: 10),
                      _buildDetailRow('المستهدف:', '${safeTarget.toStringAsFixed(1)} صفحة'),
                      const SizedBox(height: 10),
                      _buildDetailRow('المتبقي:', '${(safeTarget - safeExecuted).clamp(0.0, double.infinity).toStringAsFixed(1)} صفحة'),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Motivation box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6F3),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF568A78).withValues(alpha: 0.3)),
                ),
                child: Text(
                  motivationMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF2C4C41),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.textSecondaryLight,
            fontFamily: 'Cairo',
          ),
        ),
        const SizedBox(width: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: AppColors.textPrimaryLight,
            fontFamily: 'Cairo',
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    const accentColor = Color(0xFF568A78);
    final safeRate = rate.isNaN || rate.isInfinite ? 0.0 : rate;
    final clampedRate = safeRate > 1.0 ? safeRate / 100.0 : safeRate;

    final safeExecuted = executed.isNaN || executed.isInfinite ? 0.0 : executed;
    final safeTarget = target.isNaN || target.isInfinite ? 0.0 : target;

    return InteractiveCardWrapper(
      onTap: () => _showPlanDetailsBottomSheet(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6F3),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: accentColor.withValues(alpha: 0.5), width: 1.2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 13, color: accentColor),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      color: Color(0xFF3B6657),
                      fontFamily: 'Cairo',
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
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                        color: Color(0xFF3B6657),
                        fontFamily: 'Cairo',
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
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12,
                color: Color(0xFF2C4C41),
                fontFamily: 'Cairo',
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
                    backgroundColor: accentColor.withValues(alpha: 0.15),
                    valueColor: const AlwaysStoppedAnimation<Color>(accentColor),
                    minHeight: 3.5,
                  ),
                );
              },
            ),
            const SizedBox(height: 4),
            Text(
              '${safeExecuted.toStringAsFixed(1)} / ${safeTarget.toStringAsFixed(1)} ص',
              style: const TextStyle(
                color: Color(0xFF4A7D6C),
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                fontFamily: 'Cairo',
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
