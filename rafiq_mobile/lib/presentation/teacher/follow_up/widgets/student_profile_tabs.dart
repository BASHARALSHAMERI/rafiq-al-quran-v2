import 'package:flutter/material.dart';

import '../../../../core/constants/app_spacing.dart';
import '../../../../core/constants/quran_data.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_shadows.dart';
import '../../../../domain/entities/student_profile.dart';
import '../../../shared/widgets/app_card.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../application/exams/exam_controller.dart';
import '../../../exams/widgets/student_exams_view.dart';

class StudentProfileTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabController controller;

  StudentProfileTabBarDelegate({required this.controller});

  @override
  double get minExtent => 58;

  @override
  double get maxExtent => 58;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      height: 58,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        boxShadow: overlapsContent
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Container(
        height: 42,
        margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.cardLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: TabBar(
          controller: controller,
          indicator: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(9),
          ),
          indicatorSize: TabBarIndicatorSize.tab,
          indicatorPadding: const EdgeInsets.all(3),
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.textSecondaryLight,
          labelStyle: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 11.5,
          ),
          unselectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 11.5,
          ),
          dividerColor: Colors.transparent,
          splashFactory: NoSplash.splashFactory,
          overlayColor: WidgetStateProperty.all(Colors.transparent),
          tabs: const [
            Tab(text: 'المتابعة'),
            Tab(text: 'الملخص'),
            Tab(text: 'المواظبة'),
            Tab(text: 'الاختبارات'),
          ],
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant StudentProfileTabBarDelegate oldDelegate) =>
      false;
}

class StudentProfileSummaryTab extends StatelessWidget {
  final StudentProfile profile;

  const StudentProfileSummaryTab({
    super.key,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    final memorizedProgress = (profile.memorizedJuzz / 30).clamp(0.0, 1.0);
    final recentFollowUps =
        profile.recentFollowUps.take(3).toList(growable: false);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        _SectionCard(
          icon: Icons.trending_up_rounded,
          title: 'التقدم في الحفظ',
          trailing: '${profile.memorizedJuzz} / 30 جزء',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: memorizedProgress,
                  minHeight: 10,
                  color: AppColors.primaryLight,
                  backgroundColor: AppColors.borderLight,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'نسبة الإنجاز: ${(memorizedProgress * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'السجل الأخير',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: AppColors.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 10),
        if (recentFollowUps.isEmpty)
          const AppCard(
            padding: EdgeInsets.all(16),
            child: Text(
              'لا توجد سجلات متابعة متاحة حالياً',
              style: TextStyle(color: AppColors.textSecondaryLight),
            ),
          ),
        ...recentFollowUps.map((record) => _RecordTile(record: record)),
        const SizedBox(height: 20),
        _SectionCard(
          icon: Icons.person_rounded,
          title: 'المعلومات الشخصية',
          child: Column(
            children: [
              const SizedBox(height: 12),
              _InfoRow(label: 'البريد الإلكتروني', value: profile.email),
              const _InfoDivider(),
              _InfoRow(
                label: 'الهاتف',
                value: profile.phone?.trim().isNotEmpty == true
                    ? profile.phone!.trim()
                    : '-',
              ),
              const _InfoDivider(),
              _InfoRow(label: 'المستوى', value: profile.level ?? '-'),
              const _InfoDivider(),
              _InfoRow(
                label: 'رقم الهوية',
                value: profile.nationalId?.trim().isNotEmpty == true
                    ? profile.nationalId!.trim()
                    : '-',
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class StudentProfileAttendanceTab extends StatelessWidget {
  final StudentProfile profile;

  const StudentProfileAttendanceTab({
    super.key,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = profile.attendancePercentage;
    final progress = (percentage / 100).clamp(0.0, 1.0);
    final statusColor =
        percentage >= 75 ? AppColors.successLight : AppColors.warningLight;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        AppCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 100,
                    height: 100,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 10,
                      color: statusColor,
                      backgroundColor: AppColors.borderLight,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  Column(
                    children: [
                      Text(
                        '$percentage%',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 24,
                          color: statusColor,
                        ),
                      ),
                      const Text(
                        'الحضور',
                        style: TextStyle(
                          color: AppColors.textSecondaryLight,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  percentage >= 75 ? 'حضور منتظم' : 'يحتاج متابعة',
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const AppCard(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(
                Icons.info_outline_rounded,
                color: AppColors.infoLight,
                size: 20,
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'سجل الحضور التفصيلي سيظهر هنا عند ربط البيانات.',
                  style: TextStyle(
                    color: AppColors.textSecondaryLight,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class StudentProfileExamsTab extends ConsumerStatefulWidget {
  final StudentProfile profile;

  const StudentProfileExamsTab({
    super.key,
    required this.profile,
  });

  @override
  ConsumerState<StudentProfileExamsTab> createState() =>
      _StudentProfileExamsTabState();
}

class _StudentProfileExamsTabState
    extends ConsumerState<StudentProfileExamsTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(examControllerProvider.notifier).loadDashboard(
            studentId: widget.profile.id,
            includeTemplates: false,
            includeNominations: true,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    final examState = ref.watch(examControllerProvider);

    return StudentExamsPremiumView(
      examState: examState,
      onRefresh: () async {
        await ref.read(examControllerProvider.notifier).loadDashboard(
              studentId: widget.profile.id,
              includeTemplates: false,
              includeNominations: true,
            );
      },
    );
  }
}

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? trailing;
  final Widget child;

  const _SectionCard({
    required this.icon,
    required this.title,
    this.trailing,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: AppColors.primaryLight, size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                ),
              ),
              if (trailing != null) ...[
                const Spacer(),
                Text(
                  trailing!,
                  style: const TextStyle(
                    color: AppColors.primaryLight,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ],
            ],
          ),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontSize: 14,
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: AppColors.textPrimaryLight,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoDivider extends StatelessWidget {
  const _InfoDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(color: AppColors.borderLight, height: 1);
  }
}

class _RecordTile extends StatelessWidget {
  final FollowUpRecord record;

  const _RecordTile({required this.record});

  String get _title {
    if ((record.matnName ?? '').trim().isNotEmpty) {
      return record.matnName!.trim();
    }
    if ((record.surah ?? '').trim().isNotEmpty) {
      return record.surah!.trim();
    }
    switch (record.type.toUpperCase()) {
      case 'NEW_MEMORIZATION':
        return 'حفظ جديد';
      case 'REVIEW':
        return 'مراجعة';
      case 'MATN':
        return 'متن';
      default:
        return 'متابعة';
    }
  }

  String get _subtitle {
    if (record.fromAyah != null && record.toAyah != null) {
      return 'الآيات: ${record.fromAyah} - ${record.toAyah}';
    }
    if (record.pagesCount != null) {
      return 'الصفحات: ${record.pagesCount!.toStringAsFixed(1)}';
    }
    if ((record.notes ?? '').trim().isNotEmpty) {
      return record.notes!.trim();
    }
    return record.teacherName ?? 'بدون تفاصيل';
  }

  String get _grade {
    if (record.rating != null) {
      return QuranData.gradeLabel(record.rating!.clamp(1, 5));
    }
    if ((record.matnStatus ?? '').trim().isNotEmpty) {
      return record.matnStatus!.trim();
    }
    return 'بدون تقييم';
  }

  String get _date {
    final now = DateTime.now();
    final date = record.recordDate;
    if (now.year == date.year &&
        now.month == date.month &&
        now.day == date.day) {
      return 'اليوم';
    }
    final yesterday = now.subtract(const Duration(days: 1));
    if (yesterday.year == date.year &&
        yesterday.month == date.month &&
        yesterday.day == date.day) {
      return 'أمس';
    }
    return '${date.day}/${date.month}/${date.year}';
  }

  IconData get _icon {
    if (record.type.toUpperCase() == 'MATN') {
      return Icons.import_contacts_rounded;
    }
    if (record.type.toUpperCase() == 'REVIEW') {
      return Icons.autorenew_rounded;
    }
    return Icons.menu_book_rounded;
  }

  Color get _iconColor {
    if (record.type.toUpperCase() == 'REVIEW') {
      return AppColors.infoLight;
    }
    if (record.type.toUpperCase() == 'MATN') {
      return AppColors.successLight;
    }
    return AppColors.secondaryLight;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: AppShadows.xs,
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(_icon, color: _iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _subtitle,
                  style: const TextStyle(
                    color: AppColors.textSecondaryLight,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _grade,
                style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _date,
                style: const TextStyle(
                  color: AppColors.textSecondaryLight,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
