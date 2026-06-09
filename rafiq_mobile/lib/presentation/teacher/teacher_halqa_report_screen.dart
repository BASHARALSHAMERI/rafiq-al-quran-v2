import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_providers.dart';
import '../../application/context/context_controller.dart';
import '../../application/teacher/teacher_panel_providers.dart';
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
                  color: const Color(0xFFE0E0E0),
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

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
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
            color: AppColors.primaryLight,
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
    targetCircleId = int.tryParse(selectedCircleId ?? '');
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
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '$year',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondaryLight,
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
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE8EAE0)),
        ),
        child: Icon(icon, size: 20, color: AppColors.textPrimaryLight),
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
    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  circleName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'المعلم: $teacherName · $studentsCount طالب',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondaryLight,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.groups_outlined,
              color: AppColors.primaryLight,
              size: 26,
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
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: isExporting ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryLight,
          foregroundColor: Colors.white,
          disabledBackgroundColor:
              AppColors.primaryLight.withValues(alpha: 0.6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
        ),
        icon: isExporting
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : const Icon(Icons.download_rounded, size: 20),
        label: Text(
          isExporting ? 'جار تجهيز التقرير...' : 'تصدير / مشاركة',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 16,
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
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w900,
        color: AppColors.textPrimaryLight,
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

  Color get _gradeColor {
    switch (grade.trim()) {
      case 'ممتاز':
        return const Color(0xFF16A34A);
      case 'جيد جداً':
        return const Color(0xFF2563EB);
      case 'جيد':
        return const Color(0xFF16A34A);
      case 'مقبول':
        return const Color(0xFFD97706);
      default:
        return AppColors.primaryLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          const Text(
            'التقييم العام للحلقة',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            grade,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: _gradeColor,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${completionRate.toStringAsFixed(0)}% نسبة الإنجاز الكلي',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondaryLight,
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
          iconColor: const Color(0xFF22C55E),
          iconBg: const Color(0xFFDCFCE7),
        ),
        _MetricCard(
          label: 'عدد الطلاب',
          value: '${_asInt(summary['totalStudents'])}',
          icon: Icons.groups_outlined,
          iconColor: const Color(0xFF0EA5E9),
          iconBg: const Color(0xFFE0F2FE),
        ),
        _MetricCard(
          label: 'صفحات المراجعة',
          value: _asDouble(summary['reviewPages']).toStringAsFixed(0),
          icon: Icons.star_border_rounded,
          iconColor: const Color(0xFFF59E0B),
          iconBg: const Color(0xFFFEF3C7),
        ),
        _MetricCard(
          label: 'صفحات الحفظ',
          value: _asDouble(summary['memorizationPages']).toStringAsFixed(0),
          icon: Icons.menu_book_outlined,
          iconColor: const Color(0xFF3B82F6),
          iconBg: const Color(0xFFDBEAFE),
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
  final Color iconBg;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
  });

  @override
  Widget build(BuildContext context) {
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
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    height: 1,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
              ),
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 20, color: iconColor),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondaryLight,
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
    return Row(
      children: [
        Expanded(
          child: _HighlightCard(
            title: 'أفضل طالب في الحفظ',
            name: _asMap(summary['bestStudent'])['name']?.toString() ?? '-',
            icon: Icons.workspace_premium_rounded,
            iconColor: const Color(0xFFF59E0B),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _HighlightCard(
            title: 'الأكثر التزاماً',
            name: _asMap(summary['mostImproved'])['name']?.toString() ?? '-',
            icon: Icons.trending_up_rounded,
            iconColor: const Color(0xFF22C55E),
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
          Icon(icon, color: iconColor, size: 26),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondaryLight,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            name,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
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
    final tone = _levelTone(levelName);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Dome / blob shape
        Container(
          width: 72,
          height: 44,
          decoration: BoxDecoration(
            color: tone.color,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(36),
              topRight: Radius.circular(36),
              bottomLeft: Radius.circular(8),
              bottomRight: Radius.circular(8),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          '$count',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: tone.textColor,
            height: 1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          levelName,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.textSecondaryLight,
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE8EAE0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        decoration: const InputDecoration(
          hintText: 'ابحث عن طالب...',
          hintStyle: TextStyle(
            color: AppColors.textSecondaryLight,
            fontWeight: FontWeight.w500,
          ),
          prefixIcon:
              Icon(Icons.search_rounded, color: AppColors.textSecondaryLight),
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(vertical: 14),
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

    return AppCard(
      onTap: () =>
          context.push(RouteNames.teacherStudentReport(_asInt(student['id']))),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header Row ──
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Text(
                  name.trim().isNotEmpty ? name.trim()[0] : 'ط',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primaryLight,
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
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    if (lastMemorized.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        lastMemorized,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondaryLight,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // Grade badge
              if (gradeLabel.isNotEmpty) _GradeBadge(label: gradeLabel),
              const SizedBox(width: 6),
              // Trend icon
              Icon(
                trend >= 0
                    ? Icons.trending_up_rounded
                    : Icons.trending_down_rounded,
                color: trend >= 0
                    ? const Color(0xFF22C55E)
                    : const Color(0xFFEF4444),
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 14),

          // ── Four Stats Row ──
          Row(
            children: [
              _StudentStat(
                icon: Icons.calendar_today_outlined,
                label: 'الحضور',
                value: '${attendanceRate.toStringAsFixed(0)}%',
                iconColor: const Color(0xFF22C55E),
              ),
              const _StatDivider(),
              _StudentStat(
                icon: Icons.menu_book_outlined,
                label: 'الحفظ',
                value:
                    '${hifzPages.toStringAsFixed(0)}/${hifzTarget.toStringAsFixed(0)}',
                iconColor: const Color(0xFF3B82F6),
              ),
              const _StatDivider(),
              _StudentStat(
                icon: Icons.autorenew_rounded,
                label: 'المراجعة',
                value:
                    '${reviewPages.toStringAsFixed(0)}/${reviewTarget.toStringAsFixed(0)}',
                iconColor: const Color(0xFF8B5CF6),
              ),
              const _StatDivider(),
              _RatingStat(rating: averageRating),
            ],
          ),
          const SizedBox(height: 12),

          // ── Progress Bar ──
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: completionRate,
              minHeight: 5,
              backgroundColor: const Color(0xFFE8EAE0),
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.primaryLight,
              ),
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
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              height: 1,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondaryLight,
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
    final normalizedRating =
        (rating <= 5 ? rating : rating / 20).clamp(0.0, 5.0);
    final fullStars = normalizedRating.round().clamp(0, 5);

    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.star_border_rounded,
            size: 15,
            color: Color(0xFFF59E0B),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              5,
              (i) => Icon(
                i < fullStars ? Icons.star_rounded : Icons.star_outline_rounded,
                size: 10,
                color: const Color(0xFFF59E0B),
              ),
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'التقدير',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondaryLight,
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
      height: 32,
      margin: const EdgeInsets.symmetric(horizontal: 2),
      color: const Color(0xFFE8EAE0),
    );
  }
}

class _GradeBadge extends StatelessWidget {
  final String label;

  const _GradeBadge({required this.label});

  Color get _color {
    switch (label.trim()) {
      case 'ممتاز':
        return const Color(0xFF16A34A);
      case 'جيد جداً':
        return const Color(0xFF2563EB);
      case 'جيد':
        return const Color(0xFF16A34A);
      case 'مقبول':
        return const Color(0xFFD97706);
      default:
        return AppColors.primaryLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: _color,
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
    return Row(
      children: [
        Expanded(
          child: _PlanStatusCard(
            count: pendingCount,
            label: 'في الانتظار',
            valueColor: const Color(0xFFD97706),
            bgColor: const Color(0xFFFEF9EC),
            borderColor: const Color(0xFFFDE68A),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _PlanStatusCard(
            count: approvedCount,
            label: 'خطة معتمدة',
            valueColor: const Color(0xFF16A34A),
            bgColor: const Color(0xFFF0FDF4),
            borderColor: const Color(0xFFBBF7D0),
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
  final Color bgColor;
  final Color borderColor;

  const _PlanStatusCard({
    required this.count,
    required this.label,
    required this.valueColor,
    required this.bgColor,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Text(
            '$count',
            style: TextStyle(
              fontSize: 34,
              fontWeight: FontWeight.w900,
              color: valueColor,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondaryLight,
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
  final Color bg;

  const _ActivityTypeMeta({
    required this.icon,
    required this.color,
    required this.bg,
  });
}

const Map<String, _ActivityTypeMeta> _kActivityMeta = {
  'تجويد': _ActivityTypeMeta(
    icon: Icons.menu_book_outlined,
    color: Color(0xFF2563EB),
    bg: Color(0xFFDBEAFE),
  ),
  'TAJWEED': _ActivityTypeMeta(
    icon: Icons.menu_book_outlined,
    color: Color(0xFF2563EB),
    bg: Color(0xFFDBEAFE),
  ),
  'محاضرة': _ActivityTypeMeta(
    icon: Icons.school_outlined,
    color: Color(0xFF7C3AED),
    bg: Color(0xFFEDE9FE),
  ),
  'LECTURE': _ActivityTypeMeta(
    icon: Icons.school_outlined,
    color: Color(0xFF7C3AED),
    bg: Color(0xFFEDE9FE),
  ),
  'تفسير': _ActivityTypeMeta(
    icon: Icons.auto_stories_outlined,
    color: Color(0xFF16A34A),
    bg: Color(0xFFDCFCE7),
  ),
  'TAFSIR': _ActivityTypeMeta(
    icon: Icons.auto_stories_outlined,
    color: Color(0xFF16A34A),
    bg: Color(0xFFDCFCE7),
  ),
  'مسابقة قرآنية': _ActivityTypeMeta(
    icon: Icons.emoji_events_outlined,
    color: Color(0xFFD97706),
    bg: Color(0xFFFEF3C7),
  ),
  'COMPETITION': _ActivityTypeMeta(
    icon: Icons.emoji_events_outlined,
    color: Color(0xFFD97706),
    bg: Color(0xFFFEF3C7),
  ),
  'رحلة': _ActivityTypeMeta(
    icon: Icons.directions_bus_outlined,
    color: Color(0xFF0284C7),
    bg: Color(0xFFE0F2FE),
  ),
  'TRIP': _ActivityTypeMeta(
    icon: Icons.directions_bus_outlined,
    color: Color(0xFF0284C7),
    bg: Color(0xFFE0F2FE),
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
        const _ActivityTypeMeta(
          icon: Icons.event_outlined,
          color: AppColors.primaryLight,
          bg: Color(0xFFDCFCE7),
        );
    final participants = _asInt(activity['participantsCount']);
    final notes = activity['notes']?.toString() ?? '';

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Activity type icon
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: meta.bg,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(meta.icon, color: meta.color, size: 22),
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity['title']?.toString() ?? 'نشاط جماعي',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                    color: AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 5),
                Row(
                  children: [
                    Text(
                      dateLabel,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                    const Text(
                      '  ·  ',
                      style: TextStyle(color: AppColors.textSecondaryLight),
                    ),
                    Text(
                      '$participants حاضر',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
                if (notes.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    notes,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondaryLight,
                      height: 1.4,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Type badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: meta.bg,
              borderRadius: BorderRadius.circular(8),
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

// ═══════════════════════════════════════════════════════════
// EXPORT SHEET TILE
// ═══════════════════════════════════════════════════════════

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
      leading: Icon(icon, color: AppColors.primaryLight),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      onTap: onTap,
    );
  }
}

// ═══════════════════════════════════════════════════════════
// LEVEL TONE HELPER
// ═══════════════════════════════════════════════════════════

class _LevelTone {
  final Color color;
  final Color textColor;

  const _LevelTone({required this.color, required this.textColor});
}

_LevelTone _levelTone(String level) {
  switch (level.trim()) {
    case 'مبتدئ':
    case 'BEGINNER':
      return const _LevelTone(
        color: Color(0xFFF59E0B),
        textColor: Color(0xFFF59E0B),
      );
    case 'متوسط':
    case 'INTERMEDIATE':
      return const _LevelTone(
        color: Color(0xFF60A5FA),
        textColor: Color(0xFF2563EB),
      );
    case 'متقدم':
    case 'ADVANCED':
      return const _LevelTone(
        color: Color(0xFF4ADE80),
        textColor: Color(0xFF16A34A),
      );
    default:
      return const _LevelTone(
        color: AppColors.primaryLight,
        textColor: AppColors.primaryLight,
      );
  }
}

// ═══════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════

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
