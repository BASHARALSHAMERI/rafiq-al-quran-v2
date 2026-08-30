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
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: context.borderColor),
        boxShadow: AppShadows.xs,
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          ExamPill(
            icon: Icons.apartment_rounded,
            text: centerName,
            color: primary,
          ),
          ExamPill(
            icon: Icons.groups_rounded,
            text: circleName,
            color: custom.info,
          ),
          ExamPill(
            icon: Icons.publish_rounded,
            text: '$examTemplateCount قالب منشور',
            color: custom.accent,
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
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

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
          color: primary,
          icon: Icons.auto_stories_rounded,
        ),
        _ExamStatCard(
          label: 'مجدولة',
          value: pendingCount.toString(),
          color: custom.warning,
          icon: Icons.hourglass_top_rounded,
        ),
        _ExamStatCard(
          label: 'قيد التنفيذ',
          value: inProgressCount.toString(),
          color: custom.info,
          icon: Icons.play_circle_outline_rounded,
        ),
        _ExamStatCard(
          label: 'مكتملة',
          value: reviewedCount.toString(),
          color: custom.success,
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
        color: context.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.borderColor),
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
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        color: context.textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      nomination.exam?.title ?? 'اختبار #${nomination.examId}',
                      style: TextStyle(
                        color: context.textSecondaryColor,
                        fontSize: 12,
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
            style: TextStyle(
              color: context.textSecondaryColor,
              fontSize: 11,
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
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: context.borderColor),
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
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        color: context.textPrimaryColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      attempt.exam?.title ?? 'اختبار #${attempt.examId}',
                      style: TextStyle(
                        color: context.textSecondaryColor,
                        fontSize: 13,
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
                color: primary,
              ),
              ExamPill(
                icon: Icons.event_note_rounded,
                text: dateText,
                color: custom.info,
              ),
              ExamPill(
                icon: Icons.stars_rounded,
                text: finalized
                    ? (attempt.gradeLabel ?? 'بدون تقدير')
                    : 'قيد التنفيذ',
                color:
                    finalized ? custom.success : custom.warning,
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
                    color: context.surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'الدرجة',
                        style: TextStyle(
                          color: context.textSecondaryColor,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        scoreText,
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          color: context.textPrimaryColor,
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
                          ? custom.info
                          : primary,
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
    final primary = Theme.of(context).colorScheme.primary;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: primary.withValues(alpha: context.isDark ? 0.20 : 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.account_tree_outlined,
                color: primary,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'لا يمكن فتح سجل الاختبارات قبل تحديد المركز والحلقة',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: context.textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'ارجع لاختيار السياق الحالي ثم أعد المحاولة.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.textSecondaryColor,
                fontSize: 13,
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
        color: context.cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        children: [
          Icon(
            Icons.error_outline_rounded,
            color: Theme.of(context).colorScheme.error,
            size: 40,
          ),
          const SizedBox(height: 12),
          Text(
            'تعذر تحميل سجل الاختبارات',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 15,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: context.textSecondaryColor,
              fontSize: 13,
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
    final primary = Theme.of(context).colorScheme.primary;

    final description = hasSearchQuery
        ? 'لا توجد نتائج مطابقة لعبارة البحث الحالية.'
        : hasPublishedExams
            ? (onNominate != null ? 'ابدأ بترشيح طالب لاختبار منشور من التطبيق.' : 'لا توجد اختبارات منشورة ضمن الحلقة الحالية.')
            : 'لا توجد محاولات أو اختبارات منشورة حالياً.';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: primary.withValues(alpha: context.isDark ? 0.20 : 0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.auto_stories_outlined,
              size: 36,
              color: primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'لا توجد محاولات بعد',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 16,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: context.textSecondaryColor,
              fontSize: 13,
            ),
          ),
          if (onNominate != null) ...[
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: onNominate,
              style: FilledButton.styleFrom(
                backgroundColor: primary,
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
        color: context.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.borderColor),
        boxShadow: AppShadows.xs,
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: context.isDark ? 0.20 : 0.08),
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
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: TextStyle(
                    color: context.textSecondaryColor,
                    fontSize: 11,
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
