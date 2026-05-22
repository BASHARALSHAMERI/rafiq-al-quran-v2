import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/parent/parent_dashboard_provider.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_gradients.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/page_state_view.dart';
import '../../core/utils/data_parsing_helper.dart';

class ChildrenListScreen extends ConsumerStatefulWidget {
  const ChildrenListScreen({super.key});

  @override
  ConsumerState<ChildrenListScreen> createState() => _ChildrenListScreenState();
}

class _ChildrenListScreenState extends ConsumerState<ChildrenListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(parentDashboardProvider.notifier).loadChildren();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(parentDashboardProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F8F5),
        appBar: AppBar(
          title: const Text('الأبناء'),
          centerTitle: false,
        ),
        body: _buildBody(theme, state),
      ),
    );
  }

  Widget _buildBody(ThemeData theme, ParentDashboardState state) {
    if (state.isLoading && state.parentData == null) {
      return const PageStateView.loading(
        title: 'جارٍ تحميل قائمة الأبناء',
        message: 'يتم الآن استرجاع بيانات الأبناء من الخادم.',
      );
    }

    if (state.error != null && state.parentData == null) {
      return PageStateView.error(
        title: 'تعذر تحميل الأبناء',
        message: state.error!,
        actionLabel: 'إعادة المحاولة',
        onAction: () =>
            ref.read(parentDashboardProvider.notifier).loadChildren(),
      );
    }

    final parentLinks = DataParsingHelper.asMapList(state.parentData?['parentLinks']);
    if (parentLinks.isEmpty) {
      return const PageStateView.empty(
        title: 'لا يوجد أبناء',
        message: 'لم يتم العثور على أي أبناء مسجلين بهذا الحساب.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: parentLinks.length,
      itemBuilder: (context, index) {
        final link = parentLinks[index];
        final studentId = DataParsingHelper.readInt(link['studentId']) ?? 0;
        final student = DataParsingHelper.asMap(link['student']);
        final profileData = state.childrenProfiles[studentId];
        final studentName = DataParsingHelper.readString(student['fullName'], fallback: 'الابن');

        final enrollments = DataParsingHelper.asMapList(profileData?['studentEnrollments']);
        final firstEnrollment = enrollments.isNotEmpty
            ? enrollments.first
            : const <String, dynamic>{};
        final firstCircle = DataParsingHelper.asMap(firstEnrollment['circle']);
        final centerMap = DataParsingHelper.asMap(firstCircle['center']);

        final halqa =
            DataParsingHelper.readString(firstCircle['name'], fallback: 'غير مسجل في حلقة');
        final center = DataParsingHelper.readString(centerMap['name'], fallback: 'لا يوجد مركز');
        final metrics = DataParsingHelper.asMap(profileData?['metrics']);
        final currentJuzz = DataParsingHelper.readInt(metrics['memorizedJuzz']) ?? 0;
        final rating = DataParsingHelper.ratingLabel(metrics['recentRating']);
        final attendance = '${metrics['attendancePercentage'] ?? 0}%';
        final leadingLetter =
            studentName.trim().isEmpty ? 'ا' : studentName.characters.first;

        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: AppCard(
            onTap: () => context
                .push(RouteNames.parentChildDetail(studentId.toString())),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: AppGradients.deepPrimary,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        leadingLetter,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            studentName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$center • $halqa',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    profileData == null
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(
                            Icons.chevron_left_rounded,
                            color: AppColors.textSecondaryLight,
                          ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final itemWidth =
                        (constraints.maxWidth - (AppSpacing.sm * 2)) / 3;
                    return Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: [
                        SizedBox(
                          width: itemWidth,
                          child: _MetricBadge(
                            label: 'الحضور',
                            value: attendance,
                            icon: Icons.check_circle_rounded,
                            color: AppColors.successLight,
                          ),
                        ),
                        SizedBox(
                          width: itemWidth,
                          child: _MetricBadge(
                            label: 'الجزء الحالي',
                            value: currentJuzz > 0 ? '$currentJuzz' : '-',
                            icon: Icons.menu_book_rounded,
                            color: AppColors.primaryLight,
                          ),
                        ),
                        SizedBox(
                          width: itemWidth,
                          child: _MetricBadge(
                            label: 'التقييم',
                            value: rating,
                            icon: Icons.star_rounded,
                            color: DataParsingHelper.ratingColor(metrics['recentRating']),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: (index * 80).ms)
              .slideY(begin: 0.06, end: 0),
        );
      },
    );
  }

}

class _MetricBadge extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _MetricBadge({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: AppSpacing.xs),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
