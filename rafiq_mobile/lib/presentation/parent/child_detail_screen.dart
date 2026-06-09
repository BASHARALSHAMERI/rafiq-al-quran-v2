// ignore_for_file: prefer_const_declarations

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/parent/parent_dashboard_provider.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/standard_app_bar.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/section_header.dart';
import '../../core/utils/data_parsing_helper.dart';

class _MemRecord {
  final String date;
  final String surah;
  final String ayahs;
  final String grade;

  const _MemRecord({
    required this.date,
    required this.surah,
    required this.ayahs,
    required this.grade,
  });
}

class _AttRecord {
  final String date;
  final String status;

  const _AttRecord({
    required this.date,
    required this.status,
  });
}

class ChildDetailScreen extends ConsumerWidget {
  final String childId;

  const ChildDetailScreen({
    super.key,
    required this.childId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(parentDashboardProvider);
    final parsedId = int.tryParse(childId) ?? 0;
    final parentLinks = DataParsingHelper.asMapList(state.parentData?['parentLinks']);

    Map<String, dynamic>? link;
    for (final item in parentLinks) {
      if (DataParsingHelper.readInt(item['studentId']) == parsedId) {
        link = item;
        break;
      }
    }

    if (link == null) {
      return const Scaffold(
        backgroundColor: Color(0xFFF7F8F5),
        appBar: StandardAppBar(title: ''),
        body: PageStateView.empty(
          title: 'الابن غير موجود',
          message: 'لم يتم العثور على بيانات هذا الابن في الحساب الحالي.',
        ),
      );
    }

    final student = DataParsingHelper.asMap(link['student']);
    final name = DataParsingHelper.readString(
      student['fullName'],
      fallback: 'تفاصيل الابن',
    );
    final profile = state.childrenProfiles[parsedId];

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: StandardAppBar(title: 'متابعة $name'),
      body: profile == null
          ? const PageStateView.loading(
              title: 'جارٍ تحميل التفاصيل',
              message: 'يتم تجهيز سجل الابن الآن.',
            )
          : _buildProfileBody(context, theme, name, profile),
    );
  }

  Widget _buildProfileBody(
    BuildContext context,
    ThemeData theme,
    String name,
    Map<String, dynamic> profile,
  ) {
    final enrollments = DataParsingHelper.asMapList(profile['studentEnrollments']);
    final firstEnrollment =
        enrollments.isNotEmpty ? enrollments.first : const <String, dynamic>{};
    final firstCircle = DataParsingHelper.asMap(firstEnrollment['circle']);
    final centerMap = DataParsingHelper.asMap(firstCircle['center']);
    final halqa = DataParsingHelper.readString(firstCircle['name'], fallback: 'غير مسجل');
    final center = DataParsingHelper.readString(centerMap['name'], fallback: 'لا يوجد');

    final metrics = DataParsingHelper.asMap(profile['metrics']);
    final currentJuzz = DataParsingHelper.readInt(metrics['memorizedJuzz']) ?? 0;
    final attendanceRate = '${metrics['attendancePercentage'] ?? 0}%';
    final rating = DataParsingHelper.ratingLabel(metrics['recentRating']);
    final rank = '-';

    final followUps = DataParsingHelper.asMapList(profile['followUpsAsStudent']);
    final recentMem = followUps.take(5).map((log) {
      final dateStr = log['recordDate']?.toString();
      final dateObj = dateStr != null ? DateTime.tryParse(dateStr)?.toLocal() : null;
      final dateFormatted = dateObj != null
          ? DateFormat('yyyy-MM-dd', 'ar').format(dateObj)
          : 'اليوم';

      return _MemRecord(
        date: dateFormatted,
        surah: DataParsingHelper.readString(log['surah'], fallback: 'غير محدد'),
        ayahs: '${log['fromAyah'] ?? ''}-${log['toAyah'] ?? ''}',
        grade: DataParsingHelper.ratingLabel(log['rating']),
      );
    }).toList(growable: false);

    final attendances = DataParsingHelper.asMapList(profile['attendancesAsStudent']);
    final recentAtt = attendances.take(5).map((att) {
      final dateStr = att['date']?.toString();
      final dateObj = dateStr != null ? DateTime.tryParse(dateStr)?.toLocal() : null;
      final dateFormatted = dateObj != null
          ? DateFormat('yyyy-MM-dd', 'ar').format(dateObj)
          : 'اليوم';

      return _AttRecord(
        date: dateFormatted,
        status: DataParsingHelper.attendanceStatusLabel(att['status']),
      );
    }).toList(growable: false);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primaryLight, AppColors.primaryLight.withValues(alpha: 0.8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primaryLight.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    name.characters.first,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 28,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '$center • $halqa',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95)),
          const SizedBox(height: AppSpacing.md),
          
          // Progress Section
          AppCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'نسبة الإنجاز في الحفظ',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                    ),
                    Icon(Icons.auto_graph_rounded, color: AppColors.primaryLight, size: 20),
                  ],
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: LinearProgressIndicator(
                    value: (currentJuzz / 30).clamp(0, 1),
                    minHeight: 12,
                    backgroundColor: const Color(0xFFF1F5F9),
                    color: AppColors.primaryLight,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'أتمّ $currentJuzz من 30 جزءاً',
                      style: const TextStyle(color: AppColors.textSecondaryLight, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '${((currentJuzz / 30) * 100).toStringAsFixed(0)}%',
                      style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(delay: 50.ms),
          const SizedBox(height: AppSpacing.md),
          LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final columns = width >= 720 ? 4 : 2;
              final ratio = width >= 720 ? 1.9 : 1.7;
              return GridView.count(
                crossAxisCount: columns,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: ratio,
                children: [
                  _StatCard(
                    title: 'الجزء الحالي',
                    value: currentJuzz > 0 ? '$currentJuzz' : '-',
                    icon: Icons.menu_book_rounded,
                    color: AppColors.primaryLight,
                    iconBg: const Color(0xFFEFF6FF),
                  ),
                  _StatCard(
                    title: 'نسبة الحضور',
                    value: attendanceRate,
                    icon: Icons.check_circle_rounded,
                    color: const Color(0xFF10B981),
                    iconBg: const Color(0xFFECFDF5),
                  ),
                  _StatCard(
                    title: 'التقييم',
                    value: rating,
                    icon: Icons.star_rounded,
                    color: const Color(0xFFF59E0B),
                    iconBg: const Color(0xFFFFFBEB),
                  ),
                  _StatCard(
                    title: 'الترتيب',
                    value: rank,
                    icon: Icons.military_tech_rounded,
                    color: const Color(0xFF8B5CF6),
                    iconBg: const Color(0xFFF5F3FF),
                  ),
                ],
              );
            },
          ).animate().fadeIn(delay: 80.ms),
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'آخر الحفظ'),
          const SizedBox(height: AppSpacing.sm),
          if (recentMem.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Text(
                'لا يوجد سجل حفظ حديث.',
                style: TextStyle(color: AppColors.textSecondaryLight),
              ),
            )
          else
            ...recentMem.map((item) => _MemRecordCard(item: item)),
          const SizedBox(height: AppSpacing.lg),
          const SectionHeader(title: 'آخر الحضور'),
          const SizedBox(height: AppSpacing.sm),
          if (recentAtt.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Text(
                'لا يوجد سجل حضور حديث.',
                style: TextStyle(color: AppColors.textSecondaryLight),
              ),
            )
          else
            ...recentAtt.map((item) => _AttendanceRecordCard(item: item)),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final Color iconBg;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.iconBg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondaryLight,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _MemRecordCard extends StatelessWidget {
  final _MemRecord item;

  const _MemRecordCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final color = _recordColor(item.grade);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: const Icon(
                Icons.menu_book_rounded,
                size: 18,
                color: AppColors.primaryLight,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${item.surah} (${item.ayahs})',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.date,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xs,
                vertical: 6,
              ),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Text(
                item.grade,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _recordColor(String grade) {
    switch (grade) {
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
}

class _AttendanceRecordCard extends StatelessWidget {
  final _AttRecord item;

  const _AttendanceRecordCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(item.status);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          children: [
            const Icon(
              Icons.calendar_month_rounded,
              size: 16,
              color: AppColors.textSecondaryLight,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                item.date,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xs,
                vertical: 6,
              ),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Text(
                item.status,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String label) {
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
}
