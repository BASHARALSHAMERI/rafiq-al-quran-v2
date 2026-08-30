import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student/student_dashboard_provider.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/data_parsing_helper.dart';
import '../shared/widgets/enterprise_card.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/section_header.dart';
import '../shared/widgets/skeleton_loader.dart';
import '../shared/widgets/standard_app_bar.dart';

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});

  @override
  ConsumerState<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends ConsumerState<ProgressScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(studentDashboardProvider.notifier).loadProfile(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(studentDashboardProvider);

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(title: 'تقدمي'),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(StudentDashboardState state) {
    if (state.isLoading) {
      return ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: const [
          SkeletonMetricCard(),
          SizedBox(height: AppSpacing.sm),
          SkeletonMetricCard(),
          SizedBox(height: AppSpacing.lg),
          SkeletonCardLoader(),
          SkeletonCardLoader(),
        ],
      );
    }

    if (state.error != null) {
      return PageStateView.error(
        title: 'تعذر تحميل التقدم',
        message: state.error!,
        actionLabel: 'إعادة المحاولة',
        onAction: () =>
            ref.read(studentDashboardProvider.notifier).loadProfile(),
      );
    }

    final data = state.profileData;
    if (data == null) {
      return const PageStateView.empty(
        title: 'لا توجد بيانات',
        message: 'لم يتم العثور على بيانات تقدم مرتبطة بهذا الحساب.',
      );
    }

    final metrics = data['metrics'] as Map<String, dynamic>? ?? {};
    final profile = data['studentProfile'] as Map<String, dynamic>? ?? {};
    final followUps = (data['followUpsAsStudent'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);

    final attendancePercentage = DataParsingHelper.readString(metrics['attendancePercentage'], fallback: '-');
    final totalMemorizedPages = _sumMemorizedPages(followUps);
    final weekPages = _sumPagesForLastDays(followUps, 7);
    final averageScore = _avgRatingLabel(followUps);
    final currentJuz = DataParsingHelper.readString(profile['currentJuz'], fallback: '-');
    final studentName = profile['fullName']?.toString() ?? 'الطالب';
    final weeklyActivity = _buildWeekActivity(followUps);
    final milestones = _buildMilestones(followUps, currentJuz);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.md,
        AppSpacing.md,
        64,
      ),
      children: [
        _ModernProfileHeader(
          name: studentName,
          role: 'طالب قرآن',
          grade: averageScore,
        ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, end: 0),
        const SizedBox(height: AppSpacing.lg),
        
        const SectionHeader(title: 'إحصائيات الأداء'),
        const SizedBox(height: AppSpacing.sm),
        _MetricsGrid(
          attendance: attendancePercentage,
          totalMemorized: totalMemorizedPages,
          currentJuz: currentJuz,
          weekPages: weekPages,
        ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.05, end: 0),
        
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'نشاط الأسبوع'),
        const SizedBox(height: AppSpacing.sm),
        _WeeklyActivityCard(items: weeklyActivity)
            .animate()
            .fadeIn(delay: 250.ms),
            
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'سجل الإنجازات'),
        const SizedBox(height: AppSpacing.sm),
        if (milestones.isEmpty)
          const EnterpriseCard(
            child: Center(child: Text('لا توجد إنجازات مسجلة بعد')),
          )
        else
          ...milestones.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: _MilestoneCard(item: item),
            ),
          ),
      ],
    );
  }

  int _sumMemorizedPages(List<Map<String, dynamic>> followUps) {
    return followUps
        .where((item) => _isMemorization(item['type']))
        .fold<int>(0, (sum, item) => sum + (DataParsingHelper.readInt(item['pagesCount']) ?? 0));
  }

  int _sumPagesForLastDays(List<Map<String, dynamic>> followUps, int days) {
    final now = DateTime.now();
    final from = DateTime(now.year, now.month, now.day)
        .subtract(Duration(days: days - 1));

    return followUps.where((item) {
      final date = _asDate(item['recordDate']);
      return date != null && !date.isBefore(from);
    }).fold<int>(0, (sum, item) => sum + (DataParsingHelper.readInt(item['pagesCount']) ?? 0));
  }

  String _avgRatingLabel(List<Map<String, dynamic>> followUps) {
    final scores = followUps
        .map((item) => DataParsingHelper.ratingToScore(item['rating']))
        .where((score) => score > 0)
        .toList(growable: false);

    if (scores.isEmpty) {
      return '-';
    }

    final total = scores.fold<int>(0, (sum, score) => sum + score);
    final average = total / scores.length;
    return average.toStringAsFixed(1);
  }

  List<_WeekActivityItem> _buildWeekActivity(
      List<Map<String, dynamic>> followUps) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final startOfWeek = today.subtract(Duration(days: today.weekday % 7));

    return List.generate(7, (index) {
      final day = startOfWeek.add(Duration(days: index));
      final count = followUps.where((item) {
        final date = _asDate(item['recordDate']);
        if (date == null) return false;
        return date.year == day.year &&
            date.month == day.month &&
            date.day == day.day;
      }).length;

      return _WeekActivityItem(
        dayLabel: _weekdayLabel(day.weekday),
        count: count,
      );
    });
  }

  List<_MilestoneItem> _buildMilestones(
    List<Map<String, dynamic>> followUps,
    String currentJuz,
  ) {
    final items = <_MilestoneItem>[];

    if (currentJuz != '-' && currentJuz != '0') {
      items.add(
        _MilestoneItem(
          title: 'الجزء الحالي',
          subtitle: 'أنت الآن في الجزء $currentJuz',
          done: false,
        ),
      );
    }

    final completedMatn = followUps
        .where(
          (item) =>
              _isMatn(item['type']) &&
              (item['matnStatus']?.toString().toUpperCase() == 'COMPLETED'),
        )
        .take(2);

    for (final matn in completedMatn) {
      items.add(
        _MilestoneItem(
          title: (matn['matnName']?.toString().trim().isNotEmpty ?? false)
              ? matn['matnName'].toString()
              : 'متن مكتمل',
          subtitle: 'اكتمل بتاريخ ${_formatDate(_asDate(matn['recordDate']))}',
          done: true,
        ),
      );
    }

    final memorizationWins =
        followUps.where((item) => _isMemorization(item['type'])).take(2);
    for (final item in memorizationWins) {
      final surah = item['surah']?.toString() ?? 'سورة غير محددة';
      final fromAyah = DataParsingHelper.readInt(item['fromAyah']);
      final toAyah = DataParsingHelper.readInt(item['toAyah']);
      final range = (fromAyah != null && toAyah != null)
          ? 'الآيات $fromAyah-$toAyah'
          : '';
      items.add(
        _MilestoneItem(
          title: 'إنجاز في $surah',
          subtitle: '${_formatDate(_asDate(item['recordDate']))} $range'.trim(),
          done: true,
        ),
      );
    }

    return items.take(5).toList(growable: false);
  }

  bool _isMemorization(dynamic type) {
    final value = type?.toString().toUpperCase() ?? '';
    return value == 'NEW_MEMORIZATION' || value == 'HIFZ';
  }

  bool _isMatn(dynamic type) {
    return (type?.toString().toUpperCase() ?? '') == 'MATN';
  }

  String _weekdayLabel(int weekday) {
    switch (weekday) {
      case DateTime.sunday:
        return 'أحد';
      case DateTime.monday:
        return 'إثنين';
      case DateTime.tuesday:
        return 'ثلاثاء';
      case DateTime.wednesday:
        return 'أربعاء';
      case DateTime.thursday:
        return 'خميس';
      case DateTime.friday:
        return 'جمعة';
      case DateTime.saturday:
        return 'سبت';
      default:
        return '-';
    }
  }

  DateTime? _asDate(dynamic value) {
    if (value is DateTime) return value;
    if (value is String && value.trim().isNotEmpty) {
      return DateTime.tryParse(value)?.toLocal();
    }
    return null;
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'بدون تاريخ';
    return DateFormat('d MMMM y', 'ar').format(date);
  }
}

class _ModernProfileHeader extends StatelessWidget {
  final String name;
  final String role;
  final String grade;

  const _ModernProfileHeader({
    required this.name,
    required this.role,
    required this.grade,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: context.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: primary.withValues(alpha: 0.3), width: 2),
            ),
            child: CircleAvatar(
              radius: 28,
              backgroundColor: primary.withValues(alpha: isDark ? 0.20 : 0.10),
              child: Text(
                name.isNotEmpty ? name[0] : 'ط',
                style: TextStyle(
                  color: primary,
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: 0.7,
                    minHeight: 4,
                    backgroundColor: primary.withValues(alpha: 0.12),
                    color: primary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'المستوى 5 • طالب مثابر',
                  style: TextStyle(
                    fontSize: 11,
                    color: context.textSecondaryColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: custom.success.withValues(alpha: isDark ? 0.20 : 0.10),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: custom.success.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                Text(
                  grade,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: custom.success,
                  ),
                ),
                Text(
                  'التقييم',
                  style: TextStyle(fontSize: 10, color: custom.success, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  final String attendance;
  final int totalMemorized;
  final String currentJuz;
  final int weekPages;

  const _MetricsGrid({
    required this.attendance,
    required this.totalMemorized,
    required this.currentJuz,
    required this.weekPages,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - (AppSpacing.xs * 2)) / 3;
        
        return Wrap(
          spacing: AppSpacing.xs,
          runSpacing: AppSpacing.xs,
          children: [
            _CompactStatCard(
              width: itemWidth,
              title: 'المحفوظ',
              value: totalMemorized > 0 ? '$totalMemorized' : currentJuz,
              unit: totalMemorized > 0 ? 'صفحة' : 'جزء',
              icon: Icons.auto_stories_rounded,
              color: primary,
            ),
            _CompactStatCard(
              width: itemWidth,
              title: 'الحضور',
              value: attendance,
              unit: '%',
              icon: Icons.event_available_rounded,
              color: custom.info,
            ),
            _CompactStatCard(
              width: itemWidth,
              title: 'الأسبوع',
              value: '$weekPages',
              unit: 'صفحة',
              icon: Icons.show_chart_rounded,
              color: custom.warning,
            ),
          ],
        );
      },
    );
  }
}

class _CompactStatCard extends StatelessWidget {
  final double width;
  final String title;
  final String value;
  final String unit;
  final IconData icon;
  final Color color;

  const _CompactStatCard({
    required this.width,
    required this.title,
    required this.value,
    required this.unit,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: context.isDark ? 0.20 : 0.10),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: color,
                  height: 1,
                ),
              ),
              const SizedBox(width: 2),
              Text(
                unit,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: color.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _WeeklyActivityCard extends StatelessWidget {
  final List<_WeekActivityItem> items;

  const _WeeklyActivityCard({required this.items});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final maxCount = items.fold<int>(
      0,
      (maxValue, item) => item.count > maxValue ? item.count : maxValue,
    );

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'تسميعات هذا الأسبوع',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  color: context.textPrimaryColor,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: context.surfaceColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.borderColor),
                ),
                child: Text(
                  '${items.fold<int>(0, (sum, item) => sum + item.count)} سجل',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: context.textSecondaryColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: items.map((item) {
              final ratio = maxCount <= 0
                  ? 0.1
                  : (item.count / maxCount).clamp(0.1, 1.0);
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Column(
                    children: [
                      Container(
                        height: 70,
                        alignment: Alignment.bottomCenter,
                        decoration: BoxDecoration(
                          color: context.surfaceColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 400),
                          curve: Curves.easeOutCubic,
                          height: 70 * ratio,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                primary,
                                primary.withValues(alpha: 0.7),
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item.dayLabel,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: context.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _MilestoneCard extends StatelessWidget {
  final _MilestoneItem item;

  const _MilestoneCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;
    final accent = item.done ? custom.success : primary;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: context.isDark ? 0.20 : 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              item.done
                  ? Icons.workspace_premium_rounded
                  : Icons.flag_rounded,
              color: accent,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: context.textPrimaryColor,
                  ),
                ),
                Text(
                  item.subtitle,
                  style: TextStyle(
                    color: context.textSecondaryColor,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (item.done)
            Icon(
              Icons.check_circle_rounded,
              color: custom.success,
              size: 16,
            ),
        ],
      ),
    );
  }
}

class _WeekActivityItem {
  final String dayLabel;
  final int count;

  const _WeekActivityItem({
    required this.dayLabel,
    required this.count,
  });
}

class _MilestoneItem {
  final String title;
  final String subtitle;
  final bool done;

  const _MilestoneItem({
    required this.title,
    required this.subtitle,
    required this.done,
  });
}
