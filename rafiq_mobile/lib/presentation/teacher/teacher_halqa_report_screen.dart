import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_providers.dart';
import '../../application/context/context_controller.dart';
import '../../application/teacher/teacher_panel_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_snack_bar.dart';
import '../../core/utils/period_label_formatter.dart';
import '../../core/utils/report_export_helper.dart';
import '../../data/models/teacher_panel_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/states/app_error_state.dart';
import '../shared/states/app_loading_state.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/standard_app_bar.dart';

class TeacherHalqaReportScreen extends ConsumerStatefulWidget {
  final int? halqaId;

  const TeacherHalqaReportScreen({super.key, this.halqaId});

  @override
  ConsumerState<TeacherHalqaReportScreen> createState() =>
      _TeacherHalqaReportScreenState();
}

class _TeacherHalqaReportScreenState
    extends ConsumerState<TeacherHalqaReportScreen> {
  YearMonth _period = currentYearMonth();
  final _searchController = TextEditingController();
  bool _isExporting = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    final arg = (
      explicitHalqaId: widget.halqaId,
      month: _period.month,
      year: _period.year,
    );
    ref.invalidate(_halqaMonthlyReportProvider(arg));
    await ref.read(_halqaMonthlyReportProvider(arg).future);
  }

  void _changeMonth(int offset) {
    final nextDate = DateTime(_period.year, _period.month + offset, 1);
    setState(() {
      _period = (month: nextDate.month, year: nextDate.year);
    });
  }

  Future<void> _handleExport({
    required String format,
    required bool shareAfterDownload,
  }) async {
    setState(() => _isExporting = true);
    try {
      final export = await ref
          .read(teacherPanelRemoteDataSourceProvider)
          .exportTeacherHalqaMonthlyReport(
            circleId: widget.halqaId,
            month: _period.month,
            year: _period.year,
            format: format,
          );
      final dio = ref.read(apiClientProvider);
      final filePath = await downloadReportFile(
        dio: dio,
        downloadUrl: export.downloadUrl,
        fileName: export.name,
      );
      if (shareAfterDownload) {
        await shareDownloadedReport(filePath, text: export.name);
      } else {
        await openDownloadedReport(filePath);
      }
      if (!mounted) return;
      AppSnackBar.success(
        context,
        shareAfterDownload ? 'تمت مشاركة التقرير.' : 'تم فتح التقرير.',
      );
    } catch (error) {
      if (!mounted) return;
      AppSnackBar.error(
        context,
        'تعذر تصدير التقرير. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _showExportSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: context.borderColor,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const ListTile(
                title: Text(
                  'تصدير / مشاركة التقرير',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                ),
              ),
              _ExportActionTile(
                title: 'فتح PDF',
                icon: Icons.picture_as_pdf_outlined,
                onTap: () {
                  Navigator.of(context).pop();
                  _handleExport(format: 'PDF', shareAfterDownload: false);
                },
              ),
              _ExportActionTile(
                title: 'مشاركة PDF',
                icon: Icons.share_outlined,
                onTap: () {
                  Navigator.of(context).pop();
                  _handleExport(format: 'PDF', shareAfterDownload: true);
                },
              ),
              _ExportActionTile(
                title: 'فتح Excel',
                icon: Icons.table_chart_outlined,
                onTap: () {
                  Navigator.of(context).pop();
                  _handleExport(format: 'XLSX', shareAfterDownload: false);
                },
              ),
              _ExportActionTile(
                title: 'مشاركة Excel',
                icon: Icons.share_outlined,
                onTap: () {
                  Navigator.of(context).pop();
                  _handleExport(format: 'XLSX', shareAfterDownload: true);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final arg = (
      explicitHalqaId: widget.halqaId,
      month: _period.month,
      year: _period.year,
    );
    final reportAsync = ref.watch(_halqaMonthlyReportProvider(arg));
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(title: 'تقرير الحلقة الشهري'),
      body: reportAsync.when(
        loading: () =>
            const AppLoadingState(message: 'جار تحميل التقرير الشهري...'),
        error: (error, _) => AppErrorState(
          title: 'تعذر تحميل التقرير الشهري',
          message: error.toString(),
          onRetry: _refresh,
        ),
        data: (report) {
          if (report == null) {
            return const AppEmptyState(
              title: 'لا توجد بيانات تقرير',
              subtitle: 'تأكد من اختيار الحلقة ثم أعد المحاولة.',
              icon: Icons.analytics_outlined,
            );
          }

          final summary = report.summary;
          final filteredStudents = report.students.where((student) {
            final name = student['name']?.toString() ?? '';
            final search = _searchController.text.trim();
            return search.isEmpty || name.contains(search);
          }).toList(growable: false);

          final pendingPlans =
              _asInt(summary['pendingPlansCount'] ?? summary['pendingPlans']);
          final approvedPlans = _asInt(summary['approvedPlansCount'] ??
              summary['approvedPlans'] ??
              summary['monthlyPlansCount']);

          return RefreshIndicator(
            onRefresh: _refresh,
            color: theme.colorScheme.primary,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 48),
              children: [
                // ── Month Selector ──
                _MonthSelector(
                  label: formatGregorianMonthLabel(
                    month: _period.month,
                    year: _period.year,
                  ),
                  year: _period.year,
                  onPrevious: () => _changeMonth(-1),
                  onNext: () => _changeMonth(1),
                ),
                const SizedBox(height: 12),

                // ── Circle Info Card ──
                _CircleInfoCard(
                  circleName: report.circle['name']?.toString() ?? 'الحلقة',
                  teacherName: report.circle['teacherName']?.toString() ?? '-',
                  studentsCount: _asInt(summary['totalStudents']),
                ),
                const SizedBox(height: 12),

                // ── Export Button ──
                _ExportButton(
                  isExporting: _isExporting,
                  onTap: _showExportSheet,
                ),
                const SizedBox(height: 24),

                // ── Section: ملخص الحلقة ──
                const _SectionTitle(title: 'ملخص الحلقة'),
                const SizedBox(height: 12),

                // ── Overall Grade Card ──
                _OverallGradeCard(
                  grade: summary['overallGrade']?.toString() ?? '-',
                  completionRate: _asDouble(summary['completionRate']),
                ),
                const SizedBox(height: 10),

                // ── 2×2 Metric Grid ──
                _MetricsGrid(summary: summary),
                const SizedBox(height: 10),

                // ── Highlight Row ──
                _HighlightRow(summary: summary),
                const SizedBox(height: 24),

                // ── Section: توزيع المستويات ──
                const _SectionTitle(title: 'توزيع المستويات'),
                const SizedBox(height: 12),

                if (report.summary['levelsDistribution'] is! List ||
                    (report.summary['levelsDistribution'] as List).isEmpty)
                  const AppEmptyState(
                    title: 'لا يوجد توزيع مستويات',
                    subtitle: 'لم تصلنا بيانات مستويات الطلاب لهذا الشهر.',
                    icon: Icons.stacked_bar_chart_outlined,
                  )
                else
                  _LevelsDistributionCard(
                    levels: _asMapList(summary['levelsDistribution']),
                  ),
                const SizedBox(height: 24),

                // ── Section: أداء الطلاب ──
                const _SectionTitle(title: 'أداء الطلاب'),
                const SizedBox(height: 12),

                // Search bar
                _SearchBar(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 12),

                if (filteredStudents.isEmpty)
                  const AppEmptyState(
                    title: 'لا توجد نتائج',
                    subtitle: 'جرّب تعديل كلمة البحث لعرض الطلاب المطابقين.',
                    icon: Icons.search_off_outlined,
                  )
                else
                  ...filteredStudents.map(
                    (student) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _StudentCard(student: student),
                    ),
                  ),

                // ── Section: حالة الخطط الشهرية (conditional) ──
                if (pendingPlans > 0 || approvedPlans > 0) ...[
                  const SizedBox(height: 24),
                  const _SectionTitle(title: 'حالة الخطط الشهرية'),
                  const SizedBox(height: 12),
                  _MonthlyPlansCard(
                    pendingCount: pendingPlans,
                    approvedCount: approvedPlans,
                  ),
                ],

                const SizedBox(height: 24),

                // ── Section: أنشطة الحلقة خلال الشهر ──
                const _SectionTitle(title: 'أنشطة الحلقة خلال الشهر'),
                const SizedBox(height: 12),

                if (report.activities.isEmpty)
                  const AppEmptyState(
                    title: 'لا توجد أنشطة لهذا الشهر',
                    subtitle: 'ستظهر الأنشطة الجماعية المنفذة في الحلقة هنا.',
                    icon: Icons.event_note_outlined,
                  )
                else
                  ...report.activities.map(
                    (activity) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _ActivityCard(activity: activity),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

final _halqaMonthlyReportProvider = FutureProvider.autoDispose.family<
    TeacherHalqaReportDto?,
    ({int? explicitHalqaId, int month, int year})>((ref, arg) async {
  int? targetCircleId = arg.explicitHalqaId;
  if (targetCircleId == null) {
    final selectedCircleId = ref.watch(
      contextControllerProvider.select((state) => state.selectedCircleId),
    );
    targetCircleId = selectedCircleId;
  }

  if (targetCircleId == null) {
    return null;
  }

  return ref
      .read(teacherPanelRemoteDataSourceProvider)
      .getTeacherHalqaMonthlyReport(
        circleId: targetCircleId,
        month: arg.month,
        year: arg.year,
      );
});

// ═══════════════════════════════════════════════════════════
// MONTH SELECTOR
// ═══════════════════════════════════════════════════════════

class _MonthSelector extends StatelessWidget {
  final String label;
  final int year;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _MonthSelector({
    required this.label,
    required this.year,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: Row(
        children: [
          _NavArrowBtn(
            icon: Icons.chevron_right_rounded,
            onTap: onPrevious,
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '$year',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: context.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
          _NavArrowBtn(
            icon: Icons.chevron_left_rounded,
            onTap: onNext,
          ),
        ],
      ),
    );
  }
}

class _NavArrowBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _NavArrowBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: context.borderColor),
        ),
        child: Icon(icon, size: 20, color: context.textPrimaryColor),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// CIRCLE INFO CARD
// ═══════════════════════════════════════════════════════════

class _CircleInfoCard extends StatelessWidget {
  final String circleName;
  final String teacherName;
  final int studentsCount;

  const _CircleInfoCard({
    required this.circleName,
    required this.teacherName,
    required this.studentsCount,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;
    final primary = theme.colorScheme.primary;

    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  circleName,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'المعلم: $teacherName · $studentsCount طالب',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: context.textSecondaryColor,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(
              Icons.groups_outlined,
              color: primary,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT BUTTON
// ═══════════════════════════════════════════════════════════

class _ExportButton extends StatelessWidget {
  final bool isExporting;
  final VoidCallback onTap;

  const _ExportButton({required this.isExporting, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton.icon(
        onPressed: isExporting ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: theme.colorScheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          elevation: 0,
        ),
        icon: isExporting
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: theme.colorScheme.onPrimary,
                ),
              )
            : const Icon(Icons.download_rounded, size: 20),
        label: Text(
          isExporting ? 'جار تجهيز التقرير...' : 'تصدير / مشاركة',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// SECTION TITLE
// ═══════════════════════════════════════════════════════════

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: context.textPrimaryColor,
        height: 1.2,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// OVERALL GRADE CARD
// ═══════════════════════════════════════════════════════════

class _OverallGradeCard extends StatelessWidget {
  final String grade;
  final double completionRate;

  const _OverallGradeCard({
    required this.grade,
    required this.completionRate,
  });

  Color _gradeColor(BuildContext context) {
    final custom = context.customColors;
    switch (grade.trim()) {
      case 'ممتاز':
      case 'جيد':
        return custom.success;
      case 'جيد جداً':
        return custom.info;
      case 'مقبول':
        return custom.warning;
      default:
        return Theme.of(context).colorScheme.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          Text(
            'التقييم العام للحلقة',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: context.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            grade,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: _gradeColor(context),
              height: 1.1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${completionRate.toStringAsFixed(0)}% نسبة الإنجاز الكلي',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 2×2 METRICS GRID
// ═══════════════════════════════════════════════════════════

class _MetricsGrid extends StatelessWidget {
  final Map<String, dynamic> summary;

  const _MetricsGrid({required this.summary});

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.55,
      children: [
        _MetricCard(
          label: 'متوسط الحضور',
          value: '${_asDouble(summary['attendanceRate']).toStringAsFixed(0)}%',
          icon: Icons.calendar_today_outlined,
          iconColor: custom.success,
        ),
        _MetricCard(
          label: 'عدد الطلاب',
          value: '${_asInt(summary['totalStudents'])}',
          icon: Icons.groups_outlined,
          iconColor: custom.info,
        ),
        _MetricCard(
          label: 'صفحات المراجعة',
          value: _asDouble(summary['reviewPages']).toStringAsFixed(0),
          icon: Icons.star_border_rounded,
          iconColor: custom.warning,
        ),
        _MetricCard(
          label: 'صفحات الحفظ',
          value: _asDouble(summary['memorizationPages']).toStringAsFixed(0),
          icon: Icons.menu_book_outlined,
          iconColor: Theme.of(context).colorScheme.primary,
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color iconColor;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Flexible(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    height: 1,
                    color: context.textPrimaryColor,
                  ),
                ),
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: isDark ? 0.20 : 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(icon, size: 18, color: iconColor),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: context.textSecondaryColor,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// HIGHLIGHT ROW
// ═══════════════════════════════════════════════════════════

class _HighlightRow extends StatelessWidget {
  final Map<String, dynamic> summary;

  const _HighlightRow({required this.summary});

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;

    return Row(
      children: [
        Expanded(
          child: _HighlightCard(
            title: 'أفضل طالب في الحفظ',
            name: _asMap(summary['bestStudent'])['name']?.toString() ?? '-',
            icon: Icons.workspace_premium_rounded,
            iconColor: custom.warning,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _HighlightCard(
            title: 'الأكثر التزاماً',
            name: _asMap(summary['mostImproved'])['name']?.toString() ?? '-',
            icon: Icons.trending_up_rounded,
            iconColor: custom.success,
          ),
        ),
      ],
    );
  }
}

class _HighlightCard extends StatelessWidget {
  final String title;
  final String name;
  final IconData icon;
  final Color iconColor;

  const _HighlightCard({
    required this.title,
    required this.name,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: context.textSecondaryColor,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            name,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: context.textPrimaryColor,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// LEVELS DISTRIBUTION CARD
// ═══════════════════════════════════════════════════════════

class _LevelsDistributionCard extends StatelessWidget {
  final List<Map<String, dynamic>> levels;

  const _LevelsDistributionCard({required this.levels});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: levels
            .map((level) => _LevelBlob(level: level))
            .toList(growable: false),
      ),
    );
  }
}

class _LevelBlob extends StatelessWidget {
  final Map<String, dynamic> level;

  const _LevelBlob({required this.level});

  @override
  Widget build(BuildContext context) {
    final levelName = level['level']?.toString() ?? '-';
    final count = _asInt(level['count']);
    final tone = _levelTone(levelName, context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 72,
          height: 44,
          decoration: BoxDecoration(
            color: tone.color.withValues(alpha: context.isDark ? 0.25 : 0.15),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(36),
              topRight: Radius.circular(36),
              bottomLeft: Radius.circular(8),
              bottomRight: Radius.circular(8),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$count',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: tone.textColor,
            height: 1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          levelName,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: context.textSecondaryColor,
          ),
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════
// SEARCH BAR
// ═══════════════════════════════════════════════════════════

class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  const _SearchBar({
    required this.controller,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        style: TextStyle(color: context.textPrimaryColor),
        decoration: InputDecoration(
          hintText: 'ابحث عن طالب...',
          hintStyle: TextStyle(
            color: context.textSecondaryColor,
            fontWeight: FontWeight.w500,
          ),
          prefixIcon:
              Icon(Icons.search_rounded, color: context.textSecondaryColor),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// STUDENT PERFORMANCE CARD
// ═══════════════════════════════════════════════════════════

class _StudentCard extends StatelessWidget {
  final Map<String, dynamic> student;

  const _StudentCard({required this.student});

  @override
  Widget build(BuildContext context) {
    final name = student['name']?.toString() ?? 'طالب';
    final attendanceRate = _asDouble(student['attendanceRate']);
    final hifzPages = _asDouble(student['hifzPages']);
    final hifzTarget =
        _asDouble(student['hifzTarget'] ?? student['hifzTargetPages'] ?? 20);
    final reviewPages = _asDouble(student['reviewPages']);
    final reviewTarget = _asDouble(
        student['reviewTarget'] ?? student['reviewTargetPages'] ?? 30);
    final averageRating = _asDouble(student['averageRating']);
    final trend = _asDouble(student['trendPagesDelta']);
    final lastMemorized = student['lastMemorized']?.toString() ?? '';
    final gradeLabel = student['grade']?.toString() ??
        student['overallGrade']?.toString() ??
        '';
    final completionRate =
        (_asDouble(student['completionRate']) / 100).clamp(0.0, 1.0);
    final isDark = context.isDark;
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;

    return AppCard(
      onTap: () =>
          context.push(RouteNames.teacherStudentReport(_asInt(student['id']))),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                alignment: Alignment.center,
                child: Text(
                  name.trim().isNotEmpty ? name.trim()[0] : 'ط',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : primary,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                        color: context.textPrimaryColor,
                      ),
                    ),
                    if (lastMemorized.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        lastMemorized,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: context.textSecondaryColor,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (gradeLabel.isNotEmpty) _GradeBadge(label: gradeLabel),
              const SizedBox(width: 6),
              Icon(
                trend >= 0
                    ? Icons.trending_up_rounded
                    : Icons.trending_down_rounded,
                color: trend >= 0 ? custom.success : Theme.of(context).colorScheme.error,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 14),

          Row(
            children: [
              _StudentStat(
                icon: Icons.calendar_today_outlined,
                label: 'الحضور',
                value: '${attendanceRate.toStringAsFixed(0)}%',
                iconColor: custom.success,
              ),
              const _StatDivider(),
              _StudentStat(
                icon: Icons.menu_book_outlined,
                label: 'الحفظ',
                value:
                    '${hifzPages.toStringAsFixed(0)}/${hifzTarget.toStringAsFixed(0)}',
                iconColor: primary,
              ),
              const _StatDivider(),
              _StudentStat(
                icon: Icons.autorenew_rounded,
                label: 'المراجعة',
                value:
                    '${reviewPages.toStringAsFixed(0)}/${reviewTarget.toStringAsFixed(0)}',
                iconColor: custom.info,
              ),
              const _StatDivider(),
              _RatingStat(rating: averageRating),
            ],
          ),
          const SizedBox(height: 12),

          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: completionRate,
              minHeight: 5,
              backgroundColor: context.borderColor,
              valueColor: AlwaysStoppedAnimation<Color>(primary),
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color iconColor;

  const _StudentStat({
    required this.icon,
    required this.label,
    required this.value,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: iconColor),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              height: 1,
              color: context.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: context.textSecondaryColor,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingStat extends StatelessWidget {
  final double rating;

  const _RatingStat({required this.rating});

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;
    final normalizedRating =
        (rating <= 5 ? rating : rating / 20).clamp(0.0, 5.0);
    final fullStars = normalizedRating.round().clamp(0, 5);

    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.star_border_rounded,
            size: 15,
            color: custom.warning,
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              5,
              (i) => Icon(
                i < fullStars ? Icons.star_rounded : Icons.star_outline_rounded,
                size: 10,
                color: custom.warning,
              ),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            'التقدير',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: context.textSecondaryColor,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  const _StatDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 30,
      margin: const EdgeInsets.symmetric(horizontal: 2),
      color: context.borderColor,
    );
  }
}

class _GradeBadge extends StatelessWidget {
  final String label;

  const _GradeBadge({required this.label});

  Color _color(BuildContext context) {
    final custom = context.customColors;
    switch (label.trim()) {
      case 'ممتاز':
      case 'جيد':
        return custom.success;
      case 'جيد جداً':
        return custom.info;
      case 'مقبول':
        return custom.warning;
      default:
        return Theme.of(context).colorScheme.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _color(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: context.isDark ? 0.20 : 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: c,
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// MONTHLY PLANS STATUS CARD
// ═══════════════════════════════════════════════════════════

class _MonthlyPlansCard extends StatelessWidget {
  final int pendingCount;
  final int approvedCount;

  const _MonthlyPlansCard({
    required this.pendingCount,
    required this.approvedCount,
  });

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;

    return Row(
      children: [
        Expanded(
          child: _PlanStatusCard(
            count: pendingCount,
            label: 'في الانتظار',
            valueColor: custom.warning,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _PlanStatusCard(
            count: approvedCount,
            label: 'خطة معتمدة',
            valueColor: custom.success,
          ),
        ),
      ],
    );
  }
}

class _PlanStatusCard extends StatelessWidget {
  final int count;
  final String label;
  final Color valueColor;

  const _PlanStatusCard({
    required this.count,
    required this.label,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      decoration: BoxDecoration(
        color: valueColor.withValues(alpha: isDark ? 0.16 : 0.08),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: valueColor.withValues(alpha: isDark ? 0.25 : 0.15)),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w900,
              color: valueColor,
              height: 1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// ACTIVITY CARD
// ═══════════════════════════════════════════════════════════

class _ActivityTypeMeta {
  final IconData icon;
  final Color color;

  const _ActivityTypeMeta({
    required this.icon,
    required this.color,
  });
}

const Map<String, _ActivityTypeMeta> _kActivityMeta = {
  'تجويد': _ActivityTypeMeta(
    icon: Icons.menu_book_outlined,
    color: Color(0xFF2563EB),
  ),
  'TAJWEED': _ActivityTypeMeta(
    icon: Icons.menu_book_outlined,
    color: Color(0xFF2563EB),
  ),
  'محاضرة': _ActivityTypeMeta(
    icon: Icons.school_outlined,
    color: Color(0xFF7C3AED),
  ),
  'LECTURE': _ActivityTypeMeta(
    icon: Icons.school_outlined,
    color: Color(0xFF7C3AED),
  ),
  'تفسير': _ActivityTypeMeta(
    icon: Icons.auto_stories_outlined,
    color: Color(0xFF16A34A),
  ),
  'TAFSIR': _ActivityTypeMeta(
    icon: Icons.auto_stories_outlined,
    color: Color(0xFF16A34A),
  ),
  'مسابقة قرآنية': _ActivityTypeMeta(
    icon: Icons.emoji_events_outlined,
    color: Color(0xFFD97706),
  ),
  'COMPETITION': _ActivityTypeMeta(
    icon: Icons.emoji_events_outlined,
    color: Color(0xFFD97706),
  ),
  'رحلة': _ActivityTypeMeta(
    icon: Icons.directions_bus_outlined,
    color: Color(0xFF0284C7),
  ),
  'TRIP': _ActivityTypeMeta(
    icon: Icons.directions_bus_outlined,
    color: Color(0xFF0284C7),
  ),
};

const _kActivityTypeLabels = {
  'TAJWEED': 'تجويد',
  'LECTURE': 'محاضرة',
  'TAFSIR': 'تفسير',
  'COMPETITION': 'مسابقة قرآنية',
  'TRIP': 'رحلة',
  'OTHER': 'أخرى',
};

class _ActivityCard extends StatelessWidget {
  final Map<String, dynamic> activity;

  const _ActivityCard({required this.activity});

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(activity['activityDate']?.toString() ?? '');
    final dateLabel =
        date == null ? '-' : formatGregorianDateLabel(date, pattern: 'd MMMM');
    final typeRaw = activity['type']?.toString() ?? '';
    final typeAr = _kActivityTypeLabels[typeRaw] ?? typeRaw;
    final metaKey = typeAr.isNotEmpty ? typeAr : typeRaw;
    final meta = _kActivityMeta[metaKey] ??
        _ActivityTypeMeta(
          icon: Icons.event_outlined,
          color: Theme.of(context).colorScheme.primary,
        );
    final participants = _asInt(activity['participantsCount']);
    final notes = activity['notes']?.toString() ?? '';
    final isDark = context.isDark;

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: meta.color.withValues(alpha: isDark ? 0.20 : 0.12),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(meta.icon, color: meta.color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity['title']?.toString() ?? 'نشاط جماعي',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      dateLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: context.textSecondaryColor,
                      ),
                    ),
                    Text(
                      '  ·  ',
                      style: TextStyle(color: context.textSecondaryColor),
                    ),
                    Text(
                      '$participants حاضر',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: context.textSecondaryColor,
                      ),
                    ),
                  ],
                ),
                if (notes.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    notes,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: context.textSecondaryColor,
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: meta.color.withValues(alpha: isDark ? 0.20 : 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              typeAr.isEmpty ? typeRaw : typeAr,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: meta.color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ExportActionTile extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const _ExportActionTile({
    required this.title,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      onTap: onTap,
    );
  }
}

class _LevelTone {
  final Color color;
  final Color textColor;

  const _LevelTone({required this.color, required this.textColor});
}

_LevelTone _levelTone(String level, BuildContext context) {
  final custom = context.customColors;
  switch (level.trim()) {
    case 'مبتدئ':
    case 'BEGINNER':
      return _LevelTone(
        color: custom.warning,
        textColor: custom.warning,
      );
    case 'متوسط':
    case 'INTERMEDIATE':
      return _LevelTone(
        color: custom.info,
        textColor: custom.info,
      );
    case 'متقدم':
    case 'ADVANCED':
      return _LevelTone(
        color: custom.success,
        textColor: custom.success,
      );
    default:
      return _LevelTone(
        color: Theme.of(context).colorScheme.primary,
        textColor: Theme.of(context).colorScheme.primary,
      );
  }
}

List<Map<String, dynamic>> _asMapList(dynamic value) {
  if (value is List) {
    return value.whereType<Map<String, dynamic>>().toList(growable: false);
  }
  return const <Map<String, dynamic>>[];
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  return const <String, dynamic>{};
}

int _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _asDouble(dynamic value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}
