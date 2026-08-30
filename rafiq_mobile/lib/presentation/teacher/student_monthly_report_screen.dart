import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../application/teacher/teacher_panel_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/quran_data.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_snack_bar.dart';
import '../../core/utils/period_label_formatter.dart';
import '../../core/utils/report_export_helper.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/states/app_error_state.dart';
import '../shared/states/app_loading_state.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/standard_app_bar.dart';

class StudentMonthlyReportScreen extends ConsumerStatefulWidget {
  final int studentId;

  const StudentMonthlyReportScreen({
    super.key,
    required this.studentId,
  });

  @override
  ConsumerState<StudentMonthlyReportScreen> createState() =>
      _StudentMonthlyReportScreenState();
}

class _StudentMonthlyReportScreenState
    extends ConsumerState<StudentMonthlyReportScreen> {
  YearMonth _period = currentYearMonth();
  bool _isExporting = false;

  TeacherStudentMonthlyReportQuery get _query => (
        studentId: widget.studentId,
        month: _period.month,
        year: _period.year,
      );

  Future<void> _refresh() async {
    ref.invalidate(teacherStudentMonthlyReportProvider(_query));
    await ref.read(teacherStudentMonthlyReportProvider(_query).future);
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
          .exportStudentMonthlyReport(
            studentId: widget.studentId,
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
      if (!mounted) {
        return;
      }
      AppSnackBar.success(
        context,
        shareAfterDownload ? 'تمت مشاركة التقرير.' : 'تم فتح التقرير.',
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      AppSnackBar.error(
        context,
        'تعذر تصدير التقرير. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      if (mounted) {
        setState(() => _isExporting = false);
      }
    }
  }

  Future<void> _showExportSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const ListTile(
                title: Text(
                  'تصدير / مشاركة التقرير',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              _ExportOption(
                title: 'فتح PDF',
                icon: Icons.picture_as_pdf_outlined,
                onTap: () {
                  Navigator.of(context).pop();
                  _handleExport(format: 'PDF', shareAfterDownload: false);
                },
              ),
              _ExportOption(
                title: 'مشاركة PDF',
                icon: Icons.share_outlined,
                onTap: () {
                  Navigator.of(context).pop();
                  _handleExport(format: 'PDF', shareAfterDownload: true);
                },
              ),
              _ExportOption(
                title: 'فتح Excel',
                icon: Icons.table_chart_outlined,
                onTap: () {
                  Navigator.of(context).pop();
                  _handleExport(format: 'XLSX', shareAfterDownload: false);
                },
              ),
              _ExportOption(
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
    final reportAsync = ref.watch(teacherStudentMonthlyReportProvider(_query));
    final custom = context.customColors;
    final theme = Theme.of(context);
    final isDark = context.isDark;

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: const StandardAppBar(title: 'التقرير الشهري'),
      body: reportAsync.when(
        loading: () => const AppLoadingState(
          message: 'جار تحميل التقرير الشهري...',
        ),
        error: (error, _) => AppErrorState(
          title: 'تعذر تحميل التقرير',
          message: error.toString(),
          onRetry: _refresh,
        ),
        data: (report) {
          final student = _asMap(report['student']);
          final kpis = _asMap(report['kpis']);
          final attendance = _asMap(kpis['attendance']);
          final followUp = _asMap(kpis['followUp']);
          final exams = _asMap(kpis['exams']);
          final monthlyPlan = _asMap(report['monthlyPlan']);
          final sections = _asMap(report['sections']);
          final hifz = _asMap(sections['hifz']);
          final review = _asMap(sections['review']);
          final matn = _asMap(sections['matn']);
          final activities = _asMapList(report['activities']);
          final studentName = student['fullName']?.toString() ?? 'طالب';
          final circleName = _resolveCircleName(report);

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.md,
                48,
              ),
              children: [
                _MonthSelector(
                  label: formatGregorianMonthLabel(
                    month: _period.month,
                    year: _period.year,
                  ),
                  onPrevious: () => _changeMonth(-1),
                  onNext: () => _changeMonth(1),
                ),
                const SizedBox(height: AppSpacing.md),
                _StudentHeroCard(
                  periodTitle:
                      'تقرير ${formatGregorianMonthLabel(month: _period.month, year: _period.year)}',
                  studentName: studentName,
                  circleName: circleName,
                  monthlyGrade: kpis['monthlyGrade']?.toString() ?? '-',
                  completionRate:
                      '${_asDouble(kpis['overallCompletionRate']).toStringAsFixed(0)}%',
                  isExporting: _isExporting,
                  onExportPdf: (share) => _handleExport(format: 'PDF', shareAfterDownload: share),
                  onMoreOptions: _showExportSheet,
                ),
                const SizedBox(height: AppSpacing.lg),
                const _SectionHeader(
                  title: 'الحضور والغياب',
                  subtitle: 'قراءة شهرية واضحة لحالة التزام الطالب بالحضور.',
                ),
                const SizedBox(height: AppSpacing.md),
                AppCard(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _AttendanceStatCard(
                              label: 'إجمالي',
                              value: '${_asInt(attendance['total'])}',
                              icon: Icons.calendar_month_rounded,
                              color: context.textPrimaryColor,
                              background: isDark
                                  ? theme.colorScheme.surfaceContainerHighest
                                  : const Color(0xFFF5F4F0),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _AttendanceStatCard(
                              label: 'حاضر',
                              value: '${_asInt(attendance['present'])}',
                              icon: Icons.check_circle_outline_rounded,
                              color: custom.success,
                              background: custom.success.withValues(alpha: isDark ? 0.16 : 0.08),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _AttendanceStatCard(
                              label: 'بعذر',
                              value: '${_asInt(attendance['excused'])}',
                              icon: Icons.shield_outlined,
                              color: custom.warning,
                              background: custom.warning.withValues(alpha: isDark ? 0.16 : 0.08),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _AttendanceStatCard(
                              label: 'بدون عذر',
                              value: '${_asInt(attendance['absent'])}',
                              icon: Icons.cancel_outlined,
                              color: theme.colorScheme.error,
                              background: theme.colorScheme.error.withValues(alpha: isDark ? 0.16 : 0.08),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _ProgressLine(
                        progress: (_asDouble(attendance['presentRate']) / 100)
                            .clamp(0, 1)
                            .toDouble(),
                        label:
                            '${_asDouble(attendance['presentRate']).toStringAsFixed(0)}%',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                _PlanSectionCard(
                  title: 'الحفظ',
                  progress: _asDouble(hifz['completionRate']),
                  icon: Icons.menu_book_rounded,
                  color: theme.colorScheme.primary,
                  details: [
                    _SectionDetail(
                      label: 'الخطة الشهرية',
                      value: _planRangeLabel(_asMap(monthlyPlan['hifz'])),
                    ),
                    _SectionDetail(
                      label: 'الصفحات المستهدفة',
                      value: '${_formatNumber(hifz['plannedPages'])} صفحة',
                    ),
                    _SectionDetail(
                      label: 'آخر موضع وصل إليه',
                      value: _latestReachedLabel(_asMap(hifz['latestReached'])),
                    ),
                    _SectionDetail(
                      label: 'الصفحات المنفذة',
                      value: '${_formatNumber(hifz['executedPages'])} صفحة',
                    ),
                    _SectionDetail(
                      label: 'المتبقي',
                      value: '${_formatNumber(hifz['remainingPages'])} صفحة',
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                _PlanSectionCard(
                  title: 'المراجعة',
                  progress: _asDouble(review['completionRate']),
                  icon: Icons.autorenew_rounded,
                  color: custom.info,
                  details: [
                    _SectionDetail(
                      label: 'خطة المراجعة',
                      value: _planRangeLabel(_asMap(monthlyPlan['review'])),
                    ),
                    _SectionDetail(
                      label: 'الصفحات المستهدفة',
                      value: '${_formatNumber(review['plannedPages'])} صفحة',
                    ),
                    _SectionDetail(
                      label: 'الصفحات المنفذة',
                      value: '${_formatNumber(review['executedPages'])} صفحة',
                    ),
                    _SectionDetail(
                      label: 'المتبقي',
                      value: '${_formatNumber(review['remainingPages'])} صفحة',
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                _PlanSectionCard(
                  title: 'المتون',
                  progress: _safeProgress(
                    _asInt(matn['completedRecords']),
                    _asInt(matn['totalRecords']),
                  ),
                  icon: Icons.description_outlined,
                  color: custom.accent,
                  details: [
                    _SectionDetail(
                      label: 'إجمالي السجلات',
                      value: '${_asInt(matn['totalRecords'])}',
                    ),
                    _SectionDetail(
                      label: 'السجلات المكتملة',
                      value: '${_asInt(matn['completedRecords'])}',
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(
                        title: 'متوسط التقدير الشهري',
                        value: _asDouble(followUp['averageRating'])
                            .toStringAsFixed(1),
                        icon: Icons.star_rounded,
                        color: custom.warning,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: _MetricCard(
                        title: 'متوسط درجات الاختبارات',
                        value:
                            _asDouble(exams['averageScore']).toStringAsFixed(1),
                        icon: Icons.fact_check_outlined,
                        color: custom.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                const _SectionHeader(
                  title: 'أنشطة الحلقة خلال الشهر',
                  subtitle:
                      'تظهر هنا الأنشطة المرتبطة بالطالب خلال نفس الفترة.',
                ),
                const SizedBox(height: AppSpacing.md),
                if (activities.isEmpty)
                  const AppEmptyState(
                    title: 'لا توجد أنشطة لهذا الشهر',
                    subtitle: 'ستظهر الأنشطة المرتبطة بهذا الطالب عند توفرها.',
                    icon: Icons.event_note_outlined,
                  )
                else
                  ...activities.map(
                    (activity) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
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

class _MonthSelector extends StatelessWidget {
  final String label;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _MonthSelector({
    required this.label,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Row(
        children: [
          _MonthActionButton(
              icon: Icons.chevron_right_rounded, onTap: onPrevious),
          Expanded(
            child: Column(
              children: [
                Text(
                  'الفترة الحالية',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: context.textSecondaryColor,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                        color: context.textPrimaryColor,
                      ),
                ),
              ],
            ),
          ),
          _MonthActionButton(icon: Icons.chevron_left_rounded, onTap: onNext),
        ],
      ),
    );
  }
}

class _MonthActionButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _MonthActionButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = context.isDark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Ink(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isDark ? theme.colorScheme.surfaceContainerHighest : AppColors.surfaceVariantLight,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: context.borderColor),
        ),
        child: Icon(icon, color: context.textPrimaryColor, size: 20),
      ),
    );
  }
}

class _StudentHeroCard extends StatelessWidget {
  final String periodTitle;
  final String studentName;
  final String circleName;
  final String monthlyGrade;
  final String completionRate;
  final bool isExporting;
  final ValueChanged<bool> onExportPdf;
  final VoidCallback onMoreOptions;

  const _StudentHeroCard({
    required this.periodTitle,
    required this.studentName,
    required this.circleName,
    required this.monthlyGrade,
    required this.completionRate,
    required this.isExporting,
    required this.onExportPdf,
    required this.onMoreOptions,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final custom = context.customColors;
    final primary = theme.colorScheme.primary;
    final isDark = context.isDark;

    return AppCard(
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: context.borderColor),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: primary.withValues(alpha: isDark ? 0.35 : 0.20),
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: Text(
                    studentName.trim().isEmpty ? 'ط' : studentName.trim()[0],
                    style: TextStyle(
                      color: isDark ? Colors.white : primary,
                      fontWeight: FontWeight.w900,
                      fontSize: 22,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                studentName,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: context.textPrimaryColor,
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                '$periodTitle · $circleName',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: context.textSecondaryColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  color: custom.success.withValues(alpha: isDark ? 0.16 : 0.08),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(
                    color: custom.success.withValues(alpha: isDark ? 0.25 : 0.12),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _HeroMetric(
                        label: 'التقييم العام',
                        value: monthlyGrade,
                        color: custom.success,
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 36,
                      color: context.borderColor,
                    ),
                    Expanded(
                      child: _HeroMetric(
                        label: 'نسبة الإنجاز',
                        value: completionRate,
                        color: primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: isExporting ? null : () => onExportPdf(false),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      icon: isExporting
                          ? SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 1.5,
                                color: primary,
                              ),
                            )
                          : const Icon(Icons.download_rounded, size: 16),
                      label: const Text(
                        'تنزيل PDF',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: isExporting ? null : () => onExportPdf(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primary,
                        foregroundColor: theme.colorScheme.onPrimary,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 11),
                      ),
                      icon: const Icon(Icons.share_rounded, size: 16),
                      label: const Text(
                        'مشاركة',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: isExporting ? null : onMoreOptions,
                    style: IconButton.styleFrom(
                      backgroundColor: isDark
                          ? theme.colorScheme.surfaceContainerHighest
                          : AppColors.surfaceVariantLight,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      padding: const EdgeInsets.all(11),
                    ),
                    icon: Icon(Icons.more_horiz_rounded, size: 20, color: context.textPrimaryColor),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroMetric extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _HeroMetric({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: color,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: context.textSecondaryColor,
            fontWeight: FontWeight.w700,
            fontSize: 11,
            height: 1.2,
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const _SectionHeader({
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: context.textPrimaryColor,
                fontWeight: FontWeight.w800,
                fontSize: 15,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: context.textSecondaryColor,
                fontWeight: FontWeight.w600,
                fontSize: 12,
                height: 1.35,
              ),
        ),
      ],
    );
  }
}

class _AttendanceStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Color background;

  const _AttendanceStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: color,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: context.textSecondaryColor,
              fontWeight: FontWeight.w700,
              fontSize: 10,
              height: 1.1,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ProgressLine extends StatelessWidget {
  final double progress;
  final String label;

  const _ProgressLine({
    required this.progress,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return Column(
      children: [
        Row(
          children: [
            Text(
              'نسبة الحضور',
              style: theme.textTheme.bodyMedium?.copyWith(
                    color: context.textSecondaryColor,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const Spacer(),
            Text(
              label,
              style: TextStyle(
                color: primary,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 7,
            color: primary,
            backgroundColor: context.borderColor,
          ),
        ),
      ],
    );
  }
}

class _SectionDetail {
  final String label;
  final String value;

  const _SectionDetail({
    required this.label,
    required this.value,
  });
}

class _PlanSectionCard extends StatelessWidget {
  final String title;
  final double progress;
  final IconData icon;
  final Color color;
  final List<_SectionDetail> details;

  const _PlanSectionCard({
    required this.title,
    required this.progress,
    required this.icon,
    required this.color,
    required this.details,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: isDark ? 0.20 : 0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: context.textPrimaryColor,
                    height: 1.2,
                  ),
                ),
              ),
              Text(
                '${progress.toStringAsFixed(0)}%',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w900,
                  fontSize: 17,
                  height: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ...details.map(
            (detail) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      detail.label,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: context.textSecondaryColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            height: 1.35,
                          ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      detail.value,
                      textAlign: TextAlign.end,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: context.textPrimaryColor,
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: (progress / 100).clamp(0, 1).toDouble(),
              minHeight: 7,
              color: color,
              backgroundColor: context.borderColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return AppCard(
      child: Column(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: isDark ? 0.20 : 0.12),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: color,
              height: 1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: context.textSecondaryColor,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                  height: 1.3,
                ),
          ),
        ],
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  final Map<String, dynamic> activity;

  const _ActivityCard({required this.activity});

  @override
  Widget build(BuildContext context) {
    final rawDate = activity['activityDate']?.toString();
    final parsedDate = DateTime.tryParse(rawDate ?? '');
    final dateLabel = parsedDate == null
        ? (rawDate == null || rawDate.isEmpty ? '-' : rawDate)
        : formatGregorianDateLabel(parsedDate);
    final isDark = context.isDark;
    final primary = Theme.of(context).colorScheme.primary;

    return AppCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: primary.withValues(alpha: isDark ? 0.20 : 0.10),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(
              Icons.menu_book_rounded,
              color: primary,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity['title']?.toString() ?? 'نشاط',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: context.textPrimaryColor,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${activity['activityType'] ?? '-'} • $dateLabel',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: context.textSecondaryColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                        height: 1.35,
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

class _ExportOption extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const _ExportOption({
    required this.title,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      onTap: onTap,
    );
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _asMapList(dynamic value) {
  if (value is List) {
    return value.whereType<Map<String, dynamic>>().toList(growable: false);
  }
  return const <Map<String, dynamic>>[];
}

double _asDouble(dynamic value) {
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _asInt(dynamic value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

String _formatNumber(dynamic value) {
  final parsed = _asDouble(value);
  if (parsed == parsed.roundToDouble()) {
    return parsed.toStringAsFixed(0);
  }
  return parsed.toStringAsFixed(1);
}

String _resolveCircleName(Map<String, dynamic> report) {
  final activities = _asMapList(report['activities']);
  if (activities.isNotEmpty) {
    final circleName = activities.first['circleName']?.toString();
    if (circleName != null && circleName.isNotEmpty) {
      return circleName;
    }
  }

  final attendance = _asMapList(report['attendance']);
  if (attendance.isNotEmpty) {
    final circle = _asMap(attendance.first['circle']);
    final name = circle['name']?.toString();
    if (name != null && name.isNotEmpty) {
      return name;
    }
  }

  final followUps = _asMapList(report['followUps']);
  if (followUps.isNotEmpty) {
    final circle = _asMap(followUps.first['circle']);
    final name = circle['name']?.toString();
    if (name != null && name.isNotEmpty) {
      return name;
    }
  }

  return 'الحلقة الحالية';
}

String _planRangeLabel(Map<String, dynamic> plan) {
  if (plan.isEmpty) {
    return 'لا توجد خطة معتمدة';
  }

  final fromSurah = _asInt(plan['fromSurah']);
  final fromAyah = _asInt(plan['fromAyah']);
  final toSurah = _asInt(plan['toSurah']);
  final toAyah = _asInt(plan['toAyah']);
  if (fromSurah == 0 || fromAyah == 0 || toSurah == 0 || toAyah == 0) {
    return 'النطاق غير مكتمل';
  }

  return '${_surahName(fromSurah)} $fromAyah → ${_surahName(toSurah)} $toAyah';
}

String _latestReachedLabel(Map<String, dynamic> latestReached) {
  if (latestReached.isEmpty) {
    return 'لا يوجد';
  }
  final surah = latestReached['toSurah'] ?? latestReached['surah'];
  final ayah = latestReached['toAyah'];
  final surahNumber = _asInt(surah);
  final ayahNumber = _asInt(ayah);
  if (surahNumber == 0 || ayahNumber == 0) {
    return 'لا يوجد';
  }
  return '${_surahName(surahNumber)} - آية $ayahNumber';
}

String _surahName(int number) {
  return QuranData.findByNumber(number)?.name ?? 'سورة $number';
}

double _safeProgress(int completed, int total) {
  if (total <= 0) {
    return 0;
  }
  return (completed / total) * 100;
}
