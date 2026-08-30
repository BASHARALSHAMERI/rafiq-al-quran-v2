import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student/student_dashboard_provider.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/data_parsing_helper.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/section_header.dart';
import '../shared/widgets/standard_app_bar.dart';

enum _FollowUpKind { memorization, review, matn }

class _RecordEntry {
  final int id;
  final DateTime? date;
  final _FollowUpKind kind;
  final String title;
  final String subtitle;
  final double pages;
  final int rating;
  final String? notes;

  const _RecordEntry({
    required this.id,
    required this.date,
    required this.kind,
    required this.title,
    required this.subtitle,
    required this.pages,
    required this.rating,
    this.notes,
  });
}

class _DailyPerformanceSummary {
  final _FollowUpKind kind;
  final int sessions;
  final double pages;
  final double averageRating;

  const _DailyPerformanceSummary({
    required this.kind,
    required this.sessions,
    required this.pages,
    required this.averageRating,
  });
}

class MemorizationLogScreen extends ConsumerStatefulWidget {
  const MemorizationLogScreen({super.key});

  @override
  ConsumerState<MemorizationLogScreen> createState() =>
      _MemorizationLogScreenState();
}

class _MemorizationLogScreenState extends ConsumerState<MemorizationLogScreen> {
  _FollowUpKind _selectedKind = _FollowUpKind.memorization;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(studentDashboardProvider.notifier).loadProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(studentDashboardProvider);

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(title: 'الحفظ والمراجعة'),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(StudentDashboardState state) {
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    if (state.isLoading) {
      return const PageStateView.loading();
    }

    if (state.error != null) {
      return PageStateView.error(
        title: 'تعذر تحميل سجل التسميع',
        message: state.error!,
        actionLabel: 'إعادة المحاولة',
        onAction: () =>
            ref.read(studentDashboardProvider.notifier).loadProfile(),
      );
    }

    final logs =
        state.profileData?['followUpsAsStudent'] as List<dynamic>? ?? const [];
    final records = _mapRecords(logs);

    if (records.isEmpty) {
      return const PageStateView.empty(
        title: 'لا توجد سجلات حتى الآن',
        message: 'سيظهر هنا أداء الطالب اليومي في الحفظ والمراجعة والمتون.',
      );
    }

    final daily = _buildDailySummaries(records);
    final selectedRecords = records
        .where((item) => item.kind == _selectedKind)
        .toList(growable: false);

    final memorizationCount =
        records.where((item) => item.kind == _FollowUpKind.memorization).length;
    final reviewCount =
        records.where((item) => item.kind == _FollowUpKind.review).length;
    final matnCount =
        records.where((item) => item.kind == _FollowUpKind.matn).length;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.md,
        AppSpacing.md,
        42,
      ),
      children: [
        _LogHeroCard(
          totalSessions: records.length,
          todaySessions: daily.fold<int>(0, (sum, item) => sum + item.sessions),
        ).animate().fadeIn(duration: 250.ms),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'الأداء اليومي'),
        const SizedBox(height: AppSpacing.sm),
        _DailySummaryGrid(items: daily)
            .animate()
            .fadeIn(delay: 80.ms)
            .slideY(begin: 0.03, end: 0),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'سجل التسميع'),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Expanded(
              child: _CountCard(
                label: 'حفظ',
                count: memorizationCount,
                color: primary,
                icon: Icons.menu_book_rounded,
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: _CountCard(
                label: 'مراجعة',
                count: reviewCount,
                color: custom.info,
                icon: Icons.refresh_rounded,
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: _CountCard(
                label: 'متون',
                count: matnCount,
                color: custom.warning,
                icon: Icons.auto_stories_rounded,
              ),
            ),
          ],
        ).animate().fadeIn(delay: 120.ms),
        const SizedBox(height: AppSpacing.md),
        _TypeSegment(
          selected: _selectedKind,
          onSelected: (kind) => setState(() => _selectedKind = kind),
        ),
        const SizedBox(height: AppSpacing.md),
        if (selectedRecords.isEmpty)
          AppCard(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'لا توجد سجلات في هذا القسم حالياً.',
                  style: TextStyle(color: context.textSecondaryColor, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          )
        else
          ...selectedRecords.map(
            (record) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _RecordCard(record: record),
            ),
          ),
      ],
    );
  }

  List<_RecordEntry> _mapRecords(List<dynamic> logs) {
    final records = <_RecordEntry>[];

    for (final item in logs) {
      if (item is! Map) {
        continue;
      }

      final map = Map<String, dynamic>.from(item);
      final kind = _normalizeKind(map['type']);
      if (kind == null) {
        continue;
      }

      final date = _asDate(map['recordDate']);
      final pages = DataParsingHelper.asDouble(map['pagesCount']) ?? 0;
      final rating = DataParsingHelper.ratingToScore(map['rating']?.toString());
      final notes = map['notes']?.toString().trim();

      String title;
      String subtitle;

      if (kind == _FollowUpKind.matn) {
        title = DataParsingHelper.readString(map['matnName'], fallback: 'متن');
        subtitle = _matnStatusLabel(map['matnStatus']);
      } else {
        title = DataParsingHelper.readString(map['surah'], fallback: 'سورة غير محددة');
        final fromAyah = DataParsingHelper.readInt(map['fromAyah']);
        final toAyah = DataParsingHelper.readInt(map['toAyah']);
        if (fromAyah != null && toAyah != null) {
          subtitle = 'الآيات $fromAyah - $toAyah';
        } else if (fromAyah != null) {
          subtitle = 'من الآية $fromAyah';
        } else if (toAyah != null) {
          subtitle = 'حتى الآية $toAyah';
        } else {
          subtitle = 'بدون نطاق آيات';
        }
      }

      records.add(
        _RecordEntry(
          id: DataParsingHelper.readInt(map['id']) ?? 0,
          date: date,
          kind: kind,
          title: title,
          subtitle: subtitle,
          pages: pages,
          rating: rating,
          notes: notes == null || notes.isEmpty ? null : notes,
        ),
      );
    }

    records.sort((a, b) {
      if (a.date == null && b.date == null) {
        return b.id.compareTo(a.id);
      }
      if (a.date == null) {
        return 1;
      }
      if (b.date == null) {
        return -1;
      }
      return b.date!.compareTo(a.date!);
    });

    return records;
  }

  List<_DailyPerformanceSummary> _buildDailySummaries(
      List<_RecordEntry> records) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    return _FollowUpKind.values.map((kind) {
      final items = records.where((item) {
        if (item.kind != kind || item.date == null) {
          return false;
        }
        final date = item.date!;
        return date.year == today.year &&
            date.month == today.month &&
            date.day == today.day;
      }).toList(growable: false);

      final ratings = items
          .map((item) => item.rating)
          .where((rating) => rating > 0)
          .toList();
      final avg = ratings.isEmpty
          ? 0.0
          : ratings.reduce((a, b) => a + b) / ratings.length;

      return _DailyPerformanceSummary(
        kind: kind,
        sessions: items.length,
        pages: items.fold<double>(0, (sum, item) => sum + item.pages),
        averageRating: avg,
      );
    }).toList(growable: false);
  }

  _FollowUpKind? _normalizeKind(dynamic raw) {
    final value = raw?.toString().trim().toUpperCase() ?? '';
    switch (value) {
      case 'NEW_MEMORIZATION':
      case 'HIFZ':
        return _FollowUpKind.memorization;
      case 'REVIEW':
      case 'MURAAJAAH':
        return _FollowUpKind.review;
      case 'MATN':
        return _FollowUpKind.matn;
      default:
        return null;
    }
  }

  String _matnStatusLabel(dynamic raw) {
    switch ((raw?.toString().trim().toUpperCase() ?? '')) {
      case 'COMPLETED':
        return 'مكتمل';
      case 'PENDING':
        return 'قيد المتابعة';
      case 'FAILED':
        return 'يحتاج مراجعة';
      default:
        return 'حالة غير محددة';
    }
  }

  DateTime? _asDate(dynamic value) {
    if (value is DateTime) {
      return value;
    }
    if (value is String && value.trim().isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}

class _LogHeroCard extends StatelessWidget {
  final int totalSessions;
  final int todaySessions;

  const _LogHeroCard({
    required this.totalSessions,
    required this.todaySessions,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F766E), Color(0xFF115E59)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.fact_check_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ملخص سجل الطالب',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'إجمالي السجلات: $totalSessions • جلسات اليوم: $todaySessions',
                  style: const TextStyle(
                    color: Color(0xFFE5F7EE),
                    fontWeight: FontWeight.w600,
                    height: 1.3,
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

class _DailySummaryGrid extends StatelessWidget {
  final List<_DailyPerformanceSummary> items;

  const _DailySummaryGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = (constraints.maxWidth - (AppSpacing.xs * 2)) / 3;

        return Wrap(
          spacing: AppSpacing.xs,
          runSpacing: AppSpacing.xs,
          children: items
              .map(
                (item) => SizedBox(
                  width: cardWidth,
                  child: _DailySummaryCard(item: item),
                ),
              )
              .toList(growable: false),
        );
      },
    );
  }
}

class _DailySummaryCard extends StatelessWidget {
  final _DailyPerformanceSummary item;

  const _DailySummaryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    final (label, icon, color) = switch (item.kind) {
      _FollowUpKind.memorization => (
          'الحفظ',
          Icons.menu_book_rounded,
          primary,
        ),
      _FollowUpKind.review => (
          'المراجعة',
          Icons.refresh_rounded,
          custom.info,
        ),
      _FollowUpKind.matn => (
          'المتون',
          Icons.auto_stories_rounded,
          custom.warning,
        ),
    };

    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    color: context.textPrimaryColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${item.sessions}',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 20,
              color: color,
              height: 1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            item.pages > 0
                ? '${item.pages.toStringAsFixed(1)} صفحة'
                : 'بدون صفحات',
            style: TextStyle(
              fontSize: 11,
              color: context.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            item.averageRating > 0
                ? 'تقييم ${item.averageRating.toStringAsFixed(1)}'
                : 'بدون تقييم',
            style: TextStyle(
              fontSize: 10,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _CountCard extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final IconData icon;

  const _CountCard({
    required this.label,
    required this.count,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Column(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 6),
          Text(
            '$count',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              color: color,
              fontSize: 20,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: context.textSecondaryColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeSegment extends StatelessWidget {
  final _FollowUpKind selected;
  final ValueChanged<_FollowUpKind> onSelected;

  const _TypeSegment({
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Row(
        children: [
          _SegmentButton(
            title: 'الحفظ',
            selected: selected == _FollowUpKind.memorization,
            onTap: () => onSelected(_FollowUpKind.memorization),
          ),
          _SegmentButton(
            title: 'المراجعة',
            selected: selected == _FollowUpKind.review,
            onTap: () => onSelected(_FollowUpKind.review),
          ),
          _SegmentButton(
            title: 'المتون',
            selected: selected == _FollowUpKind.matn,
            onTap: () => onSelected(_FollowUpKind.matn),
          ),
        ],
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  final String title;
  final bool selected;
  final VoidCallback onTap;

  const _SegmentButton({
    required this.title,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? primary : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          alignment: Alignment.center,
          child: Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: selected ? Theme.of(context).colorScheme.onPrimary : context.textSecondaryColor,
            ),
          ),
        ),
      ),
    );
  }
}

class _RecordCard extends StatelessWidget {
  final _RecordEntry record;

  const _RecordCard({required this.record});

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('d MMMM y', 'ar');
    final primary = Theme.of(context).colorScheme.primary;
    final isDark = context.isDark;

    return AppCard(
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
                      record.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: context.textPrimaryColor,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      record.subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: context.textSecondaryColor,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _Stars(rating: record.rating),
                  const SizedBox(height: 6),
                  Text(
                    _relativeDateLabel(record.date, formatter),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: context.textSecondaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ),
            ],
          ),
          if (record.pages > 0) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                'عدد الصفحات: ${record.pages.toStringAsFixed(1)}',
                style: TextStyle(
                  color: primary,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                ),
              ),
            ),
          ],
          if (record.notes != null) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
              decoration: BoxDecoration(
                color: context.surfaceColor,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: context.borderColor),
              ),
              child: Text(
                record.notes!,
                style: TextStyle(
                  color: context.textSecondaryColor,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 200.ms).slideY(begin: 0.04, end: 0);
  }

  String _relativeDateLabel(DateTime? date, DateFormat formatter) {
    if (date == null) {
      return 'بدون تاريخ';
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);
    final diff = today.difference(target).inDays;

    if (diff == 0) {
      return 'اليوم';
    }
    if (diff == 1) {
      return 'أمس';
    }
    if (diff > 1 && diff <= 6) {
      return 'قبل $diff أيام';
    }
    return formatter.format(date);
  }
}

class _Stars extends StatelessWidget {
  final int rating;

  const _Stars({required this.rating});

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;

    if (rating <= 0) {
      return Text(
        'بدون تقييم',
        style: TextStyle(
          fontSize: 11,
          color: context.textSecondaryColor,
        ),
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final filled = index < rating;
        return Icon(
          Icons.star_rounded,
          size: 15,
          color: filled
              ? custom.warning
              : context.borderColor,
        );
      }),
    );
  }
}
