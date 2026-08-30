import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/constants/app_radius.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/entities/student_profile.dart';

class StudentProfileHeaderCard extends StatelessWidget {
  final StudentProfile profile;

  const StudentProfileHeaderCard({
    super.key,
    required this.profile,
  });

  String _formattedTodayDate() {
    try {
      return DateFormat('EEEE، d MMMM yyyy', 'ar').format(DateTime.now());
    } catch (_) {
      final now = DateTime.now();
      return '${now.year}-${now.month}-${now.day}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final initial = profile.fullName.trim().isEmpty
        ? '؟'
        : profile.fullName.trim().characters.first;
    final theme = Theme.of(context);
    final isDark = context.isDark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: isDark ? 0.20 : 0.12),
              borderRadius: BorderRadius.circular(AppRadius.md),
              image: profile.avatarUrl != null
                  ? DecorationImage(
                      image: NetworkImage(profile.avatarUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: profile.avatarUrl == null
                ? Center(
                    child: Text(
                      initial,
                      style: TextStyle(
                        color: isDark ? Colors.white : theme.colorScheme.primary,
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.fullName,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_month_outlined,
                      size: 14,
                      color: context.textSecondaryColor,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _formattedTodayDate(),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: context.textSecondaryColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class StudentProfileErrorState extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;

  const StudentProfileErrorState({
    super.key,
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final errorColor = theme.colorScheme.error;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: errorColor.withValues(alpha: context.isDark ? 0.18 : 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: errorColor,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'تعذر تحميل ملف الطالب',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: context.textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: context.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}
