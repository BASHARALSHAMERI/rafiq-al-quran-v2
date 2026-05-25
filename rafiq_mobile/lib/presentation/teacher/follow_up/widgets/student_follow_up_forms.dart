import 'package:flutter/material.dart';

import '../../../../core/constants/quran_data.dart';
import '../../../../core/theme/app_colors.dart';
import 'student_follow_up_widgets.dart';

class MemorizationSectionForm extends StatelessWidget {
  final QuranSurah? fromSurah;
  final QuranSurah? toSurah;
  final TextEditingController fromAyahController;
  final TextEditingController toAyahController;
  final TextEditingController notesController;
  final int rating;
  final ValueChanged<QuranSurah?> onFromSurahChanged;
  final ValueChanged<QuranSurah?> onToSurahChanged;
  final ValueChanged<String> onNotesChanged;
  final ValueChanged<int> onRatingChanged;
  final String estimatedPages;
  final Widget actions;
  final Widget? header;

  const MemorizationSectionForm({
    super.key,
    required this.fromSurah,
    required this.toSurah,
    required this.fromAyahController,
    required this.toAyahController,
    required this.notesController,
    required this.rating,
    required this.onFromSurahChanged,
    required this.onToSurahChanged,
    required this.onNotesChanged,
    required this.onRatingChanged,
    required this.estimatedPages,
    required this.actions,
    this.header,
  });

  @override
  Widget build(BuildContext context) {
    return FollowUpSectionShell(
      color: AppColors.secondaryLight,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (header != null) ...[
            header!,
            const SizedBox(height: 16),
          ],
          const FollowUpFieldGroupLabel(
            label: 'نطاق الحفظ',
            icon: Icons.straighten_rounded,
            color: AppColors.secondaryLight,
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: FollowUpSurahDropdown(
                  label: 'من سورة',
                  selected: fromSurah,
                  onChanged: onFromSurahChanged,
                  accent: AppColors.secondaryLight,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FollowUpAyahInput(
                  label: 'من آية',
                  controller: fromAyahController,
                  maxAyah: fromSurah?.ayahCount,
                  accent: AppColors.secondaryLight,
                  onChanged: onNotesChanged,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: FollowUpSurahDropdown(
                  label: 'إلى سورة',
                  selected: toSurah,
                  onChanged: onToSurahChanged,
                  accent: AppColors.secondaryLight,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FollowUpAyahInput(
                  label: 'إلى آية',
                  controller: toAyahController,
                  maxAyah: toSurah?.ayahCount,
                  accent: AppColors.secondaryLight,
                  onChanged: onNotesChanged,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          FollowUpInfoBox(
            color: AppColors.secondaryLight,
            title: 'الصفحات التقريبية',
            value: '$estimatedPages صفحة',
          ),
          const SizedBox(height: 18),
          const FollowUpFieldGroupLabel(
            label: 'التقييم',
            icon: Icons.star_rounded,
            color: AppColors.secondaryLight,
          ),
          const SizedBox(height: 10),
          FollowUpRatingBox(
            rating: rating,
            accent: AppColors.secondaryLight,
            onChanged: onRatingChanged,
          ),
          const SizedBox(height: 18),
          const FollowUpFieldGroupLabel(
            label: 'ملاحظات المعلم',
            icon: Icons.edit_note_rounded,
            color: AppColors.secondaryLight,
          ),
          const SizedBox(height: 10),
          FollowUpNotesField(
            hint: 'مثال: يحتاج تثبيت آخر الآيات أو ضبط المخارج.',
            controller: notesController,
            onChanged: onNotesChanged,
          ),
          const SizedBox(height: 22),
          actions,
        ],
      ),
    );
  }
}

class ReviewSectionForm extends StatelessWidget {
  final QuranSurah? fromSurah;
  final QuranSurah? toSurah;
  final TextEditingController fromAyahController;
  final TextEditingController toAyahController;
  final TextEditingController notesController;
  final int rating;
  final ValueChanged<QuranSurah?> onFromSurahChanged;
  final ValueChanged<QuranSurah?> onToSurahChanged;
  final ValueChanged<String> onNotesChanged;
  final ValueChanged<int> onRatingChanged;
  final String estimatedPages;
  final Widget actions;
  final Widget? header;

  const ReviewSectionForm({
    super.key,
    required this.fromSurah,
    required this.toSurah,
    required this.fromAyahController,
    required this.toAyahController,
    required this.notesController,
    required this.rating,
    required this.onFromSurahChanged,
    required this.onToSurahChanged,
    required this.onNotesChanged,
    required this.onRatingChanged,
    required this.estimatedPages,
    required this.actions,
    this.header,
  });

  @override
  Widget build(BuildContext context) {
    return FollowUpSectionShell(
      color: AppColors.infoLight,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (header != null) ...[
            header!,
            const SizedBox(height: 16),
          ],
          const FollowUpFieldGroupLabel(
            label: 'نطاق المراجعة',
            icon: Icons.straighten_rounded,
            color: AppColors.infoLight,
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: FollowUpSurahDropdown(
                  label: 'من سورة',
                  selected: fromSurah,
                  onChanged: onFromSurahChanged,
                  accent: AppColors.infoLight,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FollowUpAyahInput(
                  label: 'من آية',
                  controller: fromAyahController,
                  maxAyah: fromSurah?.ayahCount,
                  accent: AppColors.infoLight,
                  onChanged: onNotesChanged,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: FollowUpSurahDropdown(
                  label: 'إلى سورة',
                  selected: toSurah,
                  onChanged: onToSurahChanged,
                  accent: AppColors.infoLight,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FollowUpAyahInput(
                  label: 'إلى آية',
                  controller: toAyahController,
                  maxAyah: toSurah?.ayahCount,
                  accent: AppColors.infoLight,
                  onChanged: onNotesChanged,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          FollowUpInfoBox(
            color: AppColors.infoLight,
            title: 'الصفحات التقريبية',
            value: '$estimatedPages صفحة',
          ),
          const SizedBox(height: 18),
          const FollowUpFieldGroupLabel(
            label: 'تقييم المراجعة',
            icon: Icons.star_rounded,
            color: AppColors.infoLight,
          ),
          const SizedBox(height: 10),
          FollowUpRatingBox(
            rating: rating,
            accent: AppColors.infoLight,
            onChanged: onRatingChanged,
          ),
          const SizedBox(height: 18),
          const FollowUpFieldGroupLabel(
            label: 'ملاحظات المراجعة',
            icon: Icons.edit_note_rounded,
            color: AppColors.infoLight,
          ),
          const SizedBox(height: 10),
          FollowUpNotesField(
            hint: 'مثال: الخلل في الربط بين أول الصفحة وآخرها.',
            controller: notesController,
            onChanged: onNotesChanged,
          ),
          const SizedBox(height: 22),
          actions,
        ],
      ),
    );
  }
}

class MatnSectionForm extends StatelessWidget {
  final String selectedMatn;
  final TextEditingController lessonController;
  final TextEditingController notesController;
  final String matnStatus;
  final ValueChanged<String> onMatnChanged;
  final ValueChanged<String> onLessonChanged;
  final ValueChanged<String> onNotesChanged;
  final VoidCallback onCompletedSelected;
  final VoidCallback onPendingSelected;
  final Widget actions;
  final Widget? header;

  const MatnSectionForm({
    super.key,
    required this.selectedMatn,
    required this.lessonController,
    required this.notesController,
    required this.matnStatus,
    required this.onMatnChanged,
    required this.onLessonChanged,
    required this.onNotesChanged,
    required this.onCompletedSelected,
    required this.onPendingSelected,
    required this.actions,
    this.header,
  });

  @override
  Widget build(BuildContext context) {
    return FollowUpSectionShell(
      color: AppColors.successLight,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (header != null) ...[
            header!,
            const SizedBox(height: 16),
          ],
          const FollowUpFieldGroupLabel(
            label: 'اسم المتن',
            icon: Icons.library_books_rounded,
            color: AppColors.successLight,
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            key: ValueKey(selectedMatn),
            initialValue: selectedMatn,
            decoration: followUpFieldDecoration(AppColors.successLight)
                .copyWith(labelText: 'اختر المتن'),
            items: const [
              'تحفة الأطفال',
              'الآجرومية',
              'متن الجزرية',
            ]
                .map(
                  (item) => DropdownMenuItem<String>(
                    value: item,
                    child: Text(item),
                  ),
                )
                .toList(growable: false),
            onChanged: (value) {
              if (value != null) {
                onMatnChanged(value);
              }
            },
          ),
          const SizedBox(height: 14),
          const FollowUpFieldGroupLabel(
            label: 'الدرس أو الأبيات',
            icon: Icons.format_list_numbered_rounded,
            color: AppColors.successLight,
          ),
          const SizedBox(height: 10),
          FollowUpNotesField(
            hint: 'مثال: من البيت 1 إلى 10.',
            controller: lessonController,
            minLines: 1,
            maxLines: 2,
            onChanged: onLessonChanged,
          ),
          const SizedBox(height: 18),
          const FollowUpFieldGroupLabel(
            label: 'حالة الإتقان',
            icon: Icons.flag_rounded,
            color: AppColors.successLight,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: FollowUpStatusChip(
                  label: 'متقن',
                  icon: Icons.check_circle_rounded,
                  selected: matnStatus == 'COMPLETED',
                  color: AppColors.successLight,
                  onTap: onCompletedSelected,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FollowUpStatusChip(
                  label: 'يحتاج متابعة',
                  icon: Icons.pending_rounded,
                  selected: matnStatus == 'PENDING',
                  color: AppColors.warningLight,
                  onTap: onPendingSelected,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const FollowUpFieldGroupLabel(
            label: 'ملاحظات المعلم',
            icon: Icons.edit_note_rounded,
            color: AppColors.successLight,
          ),
          const SizedBox(height: 10),
          FollowUpNotesField(
            hint: 'مثال: يحتاج إعادة البيتين الأخيرين مع الضبط.',
            controller: notesController,
            onChanged: onNotesChanged,
          ),
          const SizedBox(height: 22),
          actions,
        ],
      ),
    );
  }
}
