import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../application/auth/auth_providers.dart';
import '../../../application/context/context_controller.dart';
import '../../../application/follow_up/today_follow_ups_provider.dart';
import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/router/route_names.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/data_parsing_helper.dart';
import '../../shared/states/app_empty_state.dart';
import '../../shared/widgets/enterprise_card.dart';
import '../../shared/widgets/skeleton_loader.dart';
import '../../shared/widgets/standard_app_bar.dart';

enum StudentFollowUpStatus { pending, hifz, review, mutoon, complete }

class _StudentListItem {
  final int id;
  final String name;
  final String levelLabel;
  final String statusLabel;
  final Color statusColor;
  final String enrollmentLabel;
  final StudentFollowUpStatus followUpStatus;

  const _StudentListItem({
    required this.id,
    required this.name,
    required this.levelLabel,
    required this.statusLabel,
    required this.statusColor,
    required this.enrollmentLabel,
    this.followUpStatus = StudentFollowUpStatus.pending,
  });
}

String _errorMessage(Object error) {
  if (error is DioException) {
    final payload = error.response?.data;
    if (payload is Map<String, dynamic>) {
      final message = payload['message'] ?? payload['error'];
      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
    }
  }
  return 'تعذر تحميل بيانات الطلاب';
}

Map<String, dynamic> _followUpConfig(StudentFollowUpStatus status) {
  switch (status) {
    case StudentFollowUpStatus.pending:
      return {
        'label': 'لم تتم المتابعة',
        'icon': Icons.schedule_rounded,
        'color': AppColors.textSecondaryLight,
        'bg': const Color(0xFFF3F4F6),
      };
    case StudentFollowUpStatus.hifz:
      return {
        'label': 'تم تسجيل الحفظ',
        'icon': Icons.menu_book_outlined,
        'color': AppColors.primaryLight,
        'bg': const Color(0xFFEAF5F0),
      };
    case StudentFollowUpStatus.review:
      return {
        'label': 'تم تسجيل المراجعة',
        'icon': Icons.book_outlined,
        'color': const Color(0xFF6B4C18),
        'bg': const Color(0xFFD6A848),
      };
    case StudentFollowUpStatus.mutoon:
      return {
        'label': 'تم تسجيل المتون',
        'icon': Icons.integration_instructions_outlined,
        'color': AppColors.textPrimaryLight,
        'bg': const Color(0xFFE5E7EB),
      };
    case StudentFollowUpStatus.complete:
      return {
        'label': 'مكتمل',
        'icon': Icons.check_circle_outline_rounded,
        'color': AppColors.successLight,
        'bg': const Color(0xFFEEF9F1),
      };
  }
}

StudentFollowUpStatus _deriveFollowUpStatus(Set<String> types) {
  if (types.isEmpty) {
    return StudentFollowUpStatus.pending;
  }

  final hasHifz = types.contains('NEW_MEMORIZATION');
  final hasReview = types.contains('REVIEW');
  final hasMatn = types.contains('MATN');

  final count = (hasHifz ? 1 : 0) + (hasReview ? 1 : 0) + (hasMatn ? 1 : 0);
  if (count >= 2) {
    return StudentFollowUpStatus.complete;
  }
  if (hasHifz) {
    return StudentFollowUpStatus.hifz;
  }
  if (hasReview) {
    return StudentFollowUpStatus.review;
  }
  if (hasMatn) {
    return StudentFollowUpStatus.mutoon;
  }
  return StudentFollowUpStatus.pending;
}

final studentsDirectoryProvider =
    FutureProvider.autoDispose<List<_StudentListItem>>((ref) async {
  final contextState = ref.watch(contextControllerProvider);
  final selectedCircleId = contextState.selectedCircleId?.trim();
  final selectedCenterId = contextState.selectedCenterId?.trim();

  final query = <String, dynamic>{'role': 'STUDENT'};
  if (selectedCircleId != null && selectedCircleId.isNotEmpty) {
    query['circleId'] = selectedCircleId;
  } else if (selectedCenterId != null && selectedCenterId.isNotEmpty) {
    query['centerId'] = selectedCenterId;
  }

  final dio = ref.watch(apiClientProvider);
  final response = await dio.get('/users', queryParameters: query);
  final rows = DataParsingHelper.asMapList(
    DataParsingHelper.asMap(response.data)['data'],
  );
  if (rows.isEmpty && response.data is List) {
    // Handle cases where response.data is directly the list
    rows.addAll(DataParsingHelper.asMapList(response.data));
  }
  
  final output = <_StudentListItem>[];

  Map<int, Set<String>> todayFollowUps = const {};
  if (selectedCircleId != null && selectedCircleId.isNotEmpty) {
    final circleIdInt = int.tryParse(selectedCircleId);
    if (circleIdInt != null && circleIdInt > 0) {
      try {
        todayFollowUps =
            await ref.watch(todayFollowUpsProvider(circleIdInt).future);
      } catch (_) {
        todayFollowUps = const {};
      }
    }
  }

  for (final row in rows) {
    final id = DataParsingHelper.readInt(row['id']);
    if (id == null || id <= 0) {
      continue;
    }

    final profile = DataParsingHelper.asMap(row['profile']);
    final studentProfile = DataParsingHelper.asMap(row['studentProfile']);
    final enrollments = DataParsingHelper.asMapList(row['studentEnrollments']);

    String enrollmentLabel = '-';
    if (enrollments.isNotEmpty) {
      final first = enrollments.first;
      if (first['circleId'] != null) {
        enrollmentLabel = 'C-${first['circleId']}';
      }
    }

    final name = DataParsingHelper.readString(
      profile['fullName'] ?? row['fullName'] ?? row['name'],
      fallback: 'طالب #$id',
    );

    final levelCode = studentProfile['level']?.toString();
    final statusCode = studentProfile['studentStatus']?.toString();
    final followUpStatus =
        _deriveFollowUpStatus(todayFollowUps[id] ?? const <String>{});

    output.add(
      _StudentListItem(
        id: id,
        name: name,
        levelLabel: DataParsingHelper.studentLevelLabel(levelCode) ?? 'غير محدد',
        statusLabel: DataParsingHelper.studentStatusLabel(statusCode),
        statusColor: DataParsingHelper.studentStatusColor(statusCode),
        enrollmentLabel: enrollmentLabel,
        followUpStatus: followUpStatus,
      ),
    );
  }

  output.sort((a, b) => a.name.compareTo(b.name));
  return output;
});

class StudentsListScreen extends ConsumerStatefulWidget {
  const StudentsListScreen({super.key});

  @override
  ConsumerState<StudentsListScreen> createState() => _StudentsListScreenState();
}

class _StudentsListScreenState extends ConsumerState<StudentsListScreen> {
  @override
  Widget build(BuildContext context) {
    final studentsAsync = ref.watch(studentsDirectoryProvider);
    final circleName = ref.watch(
      contextControllerProvider.select((state) => state.selectedCircleName),
    );
    final totalCount =
        studentsAsync.maybeWhen(data: (items) => items.length, orElse: () => 0);
    final completedCount = studentsAsync.maybeWhen(
      data: (items) => items
          .where(
              (item) => item.followUpStatus == StudentFollowUpStatus.complete)
          .length,
      orElse: () => 0,
    );
    final progress = totalCount > 0 ? completedCount / totalCount : 0.0;

    return Scaffold(
      appBar: StandardAppBar(
        title: 'متابعة الحلقة',
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios_rounded, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(RouteNames.teacherHome);
            }
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(studentsDirectoryProvider),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          children: [
            _CircleFollowUpSummaryCard(
              total: totalCount,
              completed: completedCount,
              progress: progress,
              circleName: circleName,
            ).animate().fadeIn().slideY(begin: 0.04, end: 0),
            const SizedBox(height: AppSpacing.md),
            Expanded(
              child: studentsAsync.when(
                loading: () => ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SkeletonCardLoader(),
                    SkeletonCardLoader(),
                    SkeletonCardLoader(),
                    SkeletonCardLoader(),
                  ],
                ),
                error: (error, _) => AppEmptyState(
                  title: 'تعذر تحميل الطلاب',
                  subtitle: _errorMessage(error),
                  icon: Icons.error_outline_rounded,
                  actionLabel: 'إعادة المحاولة',
                  onAction: () => ref.invalidate(studentsDirectoryProvider),
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return const AppEmptyState(
                      title: 'لا توجد بيانات متابعة',
                      subtitle:
                          'عند ربط الطلاب بالحَلَقة وتسجيل الحفظ والمراجعة ستظهر حالة كل طالب هنا.',
                      icon: Icons.person_search_rounded,
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(studentsDirectoryProvider);
                      await ref.read(studentsDirectoryProvider.future);
                    },
                    child: ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: items.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return _FollowUpStudentCard(
                          item: item,
                          onTap: () => context.push(
                            RouteNames.teacherStudentProfile(item.id),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CircleFollowUpSummaryCard extends StatelessWidget {
  final int total;
  final int completed;
  final double progress;
  final String? circleName;

  const _CircleFollowUpSummaryCard({
    required this.total,
    required this.completed,
    required this.progress,
    required this.circleName,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedCircleName = (circleName ?? '').trim();
    final safeProgress = progress.isFinite ? progress.clamp(0.0, 1.0) : 0.0;

    return EnterpriseCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      radius: AppRadius.xl,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.groups_rounded,
                  color: AppColors.primaryLight,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'متابعة طلاب الحلقة',
                      style:
                          TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      resolvedCircleName.isEmpty
                          ? 'ملف واحد للطلاب والمتابعة دون تكرار في الأدوات.'
                          : 'الحلقة الحالية: $resolvedCircleName',
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$total طالب',
                  style: const TextStyle(
                    color: AppColors.primaryLight,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _SummaryMetricPill(
                  label: 'المكتمل',
                  value: '$completed',
                  color: AppColors.successLight,
                  background: const Color(0xFFEEF9F1),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _SummaryMetricPill(
                  label: 'بانتظار المتابعة',
                  value: '${total - completed}',
                  color: AppColors.warningLight,
                  background: const Color(0xFFFFF8EC),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: safeProgress,
              minHeight: 8,
              color: AppColors.primaryLight,
              backgroundColor: AppColors.borderLight.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}

class _FollowUpStudentCard extends StatelessWidget {
  final _StudentListItem item;
  final VoidCallback onTap;

  const _FollowUpStudentCard({
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final config = _followUpConfig(item.followUpStatus);
    final Color color = config['color'] as Color;
    final Color bgColor = config['bg'] as Color;
    final IconData icon = config['icon'] as IconData;
    final String label = config['label'] as String;

    return EnterpriseCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      radius: AppRadius.xl,
      child: Row(
        children: [
          _StudentAvatar(name: item.name),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _StudentMetaChip(
                      label: item.levelLabel,
                      color: AppColors.infoLight,
                      background: AppColors.infoLight.withValues(alpha: 0.10),
                    ),
                    _StudentMetaChip(
                      label: item.statusLabel,
                      color: item.statusColor,
                      background: item.statusColor.withValues(alpha: 0.12),
                    ),
                    if (item.enrollmentLabel != '-')
                      _StudentMetaChip(
                        label: item.enrollmentLabel,
                        color: AppColors.textSecondaryLight,
                        background: const Color(0xFFF2F4F5),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(icon, size: 14, color: color),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'افتح الملف لعرض الحفظ والمراجعة والخطة الشهرية من مكان واحد.',
                  style: TextStyle(
                    color: AppColors.textSecondaryLight,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.keyboard_arrow_left_rounded,
            size: 20,
            color: AppColors.textSecondaryLight,
          ),
        ],
      ),
    );
  }
}

class _SummaryMetricPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final Color background;

  const _SummaryMetricPill({
    required this.label,
    required this.value,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w900,
              fontSize: 18,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentMetaChip extends StatelessWidget {
  final String label;
  final Color color;
  final Color background;

  const _StudentMetaChip({
    required this.label,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 11,
        ),
      ),
    );
  }
}

class _StudentAvatar extends StatelessWidget {
  final String name;

  const _StudentAvatar({required this.name});

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? '؟' : name.trim().characters.first;

    return Container(
      width: 44,
      height: 44,
      decoration: const BoxDecoration(
        color: Color(0xFFE8F0ED),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            color: Color(0xFF1E2A25),
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
      ),
    );
  }
}
