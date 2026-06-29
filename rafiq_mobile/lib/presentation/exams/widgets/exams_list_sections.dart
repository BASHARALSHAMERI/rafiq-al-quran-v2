import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_shadows.dart';
import '../../../data/models/exam_dtos.dart';
import 'exam_shared_widgets.dart';

class ExamsContextSummaryCard extends StatelessWidget {
  final String centerName;
  final String circleName;
  final int examTemplateCount;

  const ExamsContextSummaryCard({
    super.key,
    required this.centerName,
    required this.circleName,
    required this.examTemplateCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          ExamPill(
            icon: Icons.apartment_rounded,
            text: centerName,
            color: AppColors.primaryLight,
          ),
          ExamPill(
            icon: Icons.groups_rounded,
            text: circleName,
            color: AppColors.infoLight,
          ),
          ExamPill(
            icon: Icons.publish_rounded,
            text: '$examTemplateCount قالب منشور',
            color: AppColors.secondaryLight,
          ),
        ],
      ),
    );
  }
}

class ExamsStatsGrid extends StatelessWidget {
  final int totalCount;
  final int pendingCount;
  final int inProgressCount;
  final int reviewedCount;

  const ExamsStatsGrid({
    super.key,
    required this.totalCount,
    required this.pendingCount,
    required this.inProgressCount,
    required this.reviewedCount,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.5,
      children: [
        _ExamStatCard(
          label: 'إجمالي المحاولات',
          value: totalCount.toString(),
          color: AppColors.primaryLight,
          icon: Icons.auto_stories_rounded,
        ),
        _ExamStatCard(
          label: 'مجدولة',
          value: pendingCount.toString(),
          color: AppColors.warningLight,
          icon: Icons.hourglass_top_rounded,
        ),
        _ExamStatCard(
          label: 'قيد التنفيذ',
          value: inProgressCount.toString(),
          color: AppColors.infoLight,
          icon: Icons.play_circle_outline_rounded,
        ),
        _ExamStatCard(
          label: 'مكتملة',
          value: reviewedCount.toString(),
          color: AppColors.successLight,
          icon: Icons.verified_rounded,
        ),
      ],
    );
  }
}

class NominationReviewCard extends StatelessWidget {
  final ExamNominationDto nomination;
  final bool busy;
  final VoidCallback? onApprove;
  final VoidCallback? onReturn;
  final VoidCallback? onDefer;
  final VoidCallback? onReject;

  const NominationReviewCard({
    super.key,
    required this.nomination,
    required this.busy,
    this.onApprove,
    this.onReturn,
    this.onDefer,
    this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nomination.student?.fullName ??
                          'طالب #${nomination.studentId}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      nomination.exam?.title ?? 'اختبار #${nomination.examId}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                    ),
                  ],
                ),
              ),
              ExamStatusBadge(status: nomination.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${nomination.circle?.name ?? '-'} • ${formatExamAttemptDate(nomination.proposedExamDate)}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (onApprove != null)
                FilledButton(
                  onPressed: busy ? null : onApprove,
                  child: const Text('موافقة'),
                ),
              if (onReturn != null)
                OutlinedButton(
                  onPressed: busy ? null : onReturn,
                  child: const Text('إرجاع'),
                ),
              if (onDefer != null)
                OutlinedButton(
                  onPressed: busy ? null : onDefer,
                  child: const Text('تأجيل'),
                ),
              if (onReject != null)
                OutlinedButton(
                  onPressed: busy ? null : onReject,
                  child: const Text('رفض'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class ExamAttemptCard extends StatelessWidget {
  final ExamAttemptDto attempt;
  final VoidCallback? onTapAction;

  const ExamAttemptCard({
    super.key,
    required this.attempt,
    this.onTapAction,
  });

  @override
  Widget build(BuildContext context) {
    final finalized = attempt.status == 'EVALUATED' ||
        attempt.status == 'APPROVED' ||
        attempt.status == 'PUBLISHED';
    final scoreText = attempt.totalScore == null || attempt.exam == null
        ? '—'
        : '${attempt.totalScore!.round()}/${attempt.exam!.maxScore.round()}';
    final dateText = formatExamAttemptDate(
      attempt.reviewedAt ?? attempt.updatedAt,
    );

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      attempt.student?.fullName ?? 'طالب #${attempt.studentId}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      attempt.exam?.title ?? 'اختبار #${attempt.examId}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                    ),
                  ],
                ),
              ),
              ExamStatusBadge(status: attempt.status),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ExamPill(
                icon: Icons.groups_rounded,
                text: attempt.circle?.name ?? 'الحلقة الحالية',
                color: AppColors.primaryLight,
              ),
              ExamPill(
                icon: Icons.event_note_rounded,
                text: dateText,
                color: AppColors.infoLight,
              ),
              ExamPill(
                icon: Icons.stars_rounded,
                text: finalized
                    ? (attempt.gradeLabel ?? 'بدون تقدير')
                    : 'قيد التنفيذ',
                color:
                    finalized ? AppColors.successLight : AppColors.warningLight,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'الدرجة',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        scoreText,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                      ),
                    ],
                  ),
                ),
              ),
              if (onTapAction != null) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: onTapAction,
                    style: FilledButton.styleFrom(
                      backgroundColor: finalized
                          ? AppColors.infoLight
                          : AppColors.primaryLight,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(56),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    icon: Icon(
                      finalized
                          ? Icons.visibility_outlined
                          : Icons.play_circle_outline_rounded,
                      size: 20,
                    ),
                    label: Text(
                      finalized ? 'عرض النتيجة' : 'إجراء الاختبار',
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class ExamsContextMissingCard extends StatelessWidget {
  final VoidCallback onRetry;

  const ExamsContextMissingCard({
    super.key,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.account_tree_outlined,
                color: AppColors.primaryLight,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'لا يمكن فتح سجل الاختبارات قبل تحديد المركز والحلقة',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'ارجع لاختيار السياق الحالي ثم أعد المحاولة.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondaryLight,
                  ),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('تحديث'),
            ),
          ],
        ),
      ),
    );
  }
}

class ExamsErrorStateCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ExamsErrorStateCard({
    super.key,
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: AppColors.errorLight,
            size: 40,
          ),
          const SizedBox(height: 12),
          Text(
            'تعذر تحميل سجل الاختبارات',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }
}

class ExamsEmptyAttemptsCard extends StatelessWidget {
  final bool hasPublishedExams;
  final bool hasSearchQuery;
  final VoidCallback? onNominate;

  const ExamsEmptyAttemptsCard({
    super.key,
    required this.hasPublishedExams,
    required this.hasSearchQuery,
    this.onNominate,
  });

  @override
  Widget build(BuildContext context) {
    final description = hasSearchQuery
        ? 'لا توجد نتائج مطابقة لعبارة البحث الحالية.'
        : hasPublishedExams
            ? (onNominate != null ? 'ابدأ بترشيح طالب لاختبار منشور من التطبيق.' : 'لا توجد اختبارات منشورة ضمن الحلقة الحالية.')
            : 'لا توجد محاولات أو اختبارات منشورة حالياً.';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_stories_outlined,
              size: 36,
              color: AppColors.primaryLight,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'لا توجد محاولات بعد',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondaryLight,
                ),
          ),
          if (onNominate != null) ...[
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: onNominate,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primaryLight,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
              label: const Text('ترشيح طالب'),
            ),
          ],
        ],
      ),
    );
  }
}

List<ExamAttemptDto> filterExamAttempts(
  List<ExamAttemptDto> attempts,
  String query,
) {
  if (query.trim().isEmpty) {
    return attempts;
  }

  final normalizedQuery = query.toLowerCase();
  return attempts.where((attempt) {
    final haystack = [
      attempt.student?.fullName,
      attempt.exam?.title,
      attempt.circle?.name,
      attempt.gradeLabel,
      examStatusLabel(attempt.status),
    ].whereType<String>().join(' ').toLowerCase();

    return haystack.contains(normalizedQuery);
  }).toList(growable: false);
}

List<ExamNominationDto> filterNominations(
  List<ExamNominationDto> nominations,
  String query,
) {
  if (query.trim().isEmpty) {
    return nominations;
  }

  final normalizedQuery = query.toLowerCase();
  return nominations.where((nomination) {
    final haystack = [
      nomination.student?.fullName,
      nomination.exam?.title,
      nomination.circle?.name,
      nomination.status,
    ].whereType<String>().join(' ').toLowerCase();

    return haystack.contains(normalizedQuery);
  }).toList(growable: false);
}

String formatExamAttemptDate(String? value) {
  if (value == null || value.trim().isEmpty) {
    return '—';
  }

  try {
    return DateFormat('d MMM y', 'ar').format(DateTime.parse(value));
  } catch (_) {
    return '—';
  }
}

class _ExamStatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _ExamStatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
