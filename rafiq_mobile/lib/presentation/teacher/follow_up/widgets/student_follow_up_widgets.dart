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
  final IconData icon;
  final String title;
  final String description;
  final Widget child;

  const FollowUpSectionShell({
    super.key,
    required this.color,
    required this.icon,
    required this.title,
    required this.description,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
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
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      description,
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
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
