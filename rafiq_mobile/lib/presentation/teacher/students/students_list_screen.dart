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

Map<String, dynamic> _followUpConfig(BuildContext context, StudentFollowUpStatus status) {
  final custom = context.customColors;
  final isDark = context.isDark;

  switch (status) {
    case StudentFollowUpStatus.pending:
      final color = context.textSecondaryColor;
      return {
        'label': 'لم تتم المتابعة',
        'icon': Icons.schedule_rounded,
        'color': color,
        'bg': color.withValues(alpha: isDark ? 0.16 : 0.08),
      };
    case StudentFollowUpStatus.hifz:
      const color = Color(0xFF0284C7);
      return {
        'label': 'تم تسجيل الحفظ',
        'icon': Icons.menu_book_outlined,
        'color': color,
        'bg': color.withValues(alpha: isDark ? 0.18 : 0.10),
      };
    case StudentFollowUpStatus.review:
      const color = Color(0xFFD97706);
      return {
        'label': 'تم تسجيل المراجعة',
        'icon': Icons.bookmark_outline_rounded,
        'color': color,
        'bg': color.withValues(alpha: isDark ? 0.18 : 0.10),
      };
    case StudentFollowUpStatus.mutoon:
      final color = custom.accent;
      return {
        'label': 'تم تسجيل المتون',
        'icon': Icons.integration_instructions_outlined,
        'color': color,
        'bg': color.withValues(alpha: isDark ? 0.18 : 0.10),
      };
    case StudentFollowUpStatus.complete:
      final color = custom.success;
      return {
        'label': 'مكتمل',
        'icon': Icons.check_circle_outline_rounded,
        'color': color,
        'bg': color.withValues(alpha: isDark ? 0.18 : 0.10),
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

class _StudentsDirectoryNotifier extends AutoDisposeAsyncNotifier<List<_StudentListItem>> {
  int _page = 1;
  bool _hasMore = true;

  @override
  Future<List<_StudentListItem>> build() async {
    _page = 1;
    _hasMore = true;
    return _fetchPage(_page);
  }

  Future<void> loadMore() async {
    if (state.isLoading || !_hasMore) return;
    
    state = const AsyncLoading<List<_StudentListItem>>().copyWithPrevious(state);
    
    try {
      final nextItems = await _fetchPage(_page + 1);
      _page++;
      state = AsyncData([...state.value ?? [], ...nextItems]);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<List<_StudentListItem>> _fetchPage(int page) async {
    final contextState = ref.watch(contextControllerProvider);
    final selectedCircleId = contextState.selectedCircleId;
    final selectedCenterId = contextState.selectedCenterId;

    final query = <String, dynamic>{'role': 'STUDENT', 'page': page, 'limit': 20};
    if (selectedCircleId != null) {
      query['circleId'] = selectedCircleId.toString();
    } else if (selectedCenterId != null) {
      query['centerId'] = selectedCenterId.toString();
    }

    final dio = ref.watch(apiClientProvider);
    final response = await dio.get('/users', queryParameters: query);
    
    final responseData = DataParsingHelper.asMap(response.data);
    final dataField = responseData['data'];
    
    List<Map<String, dynamic>> rows = [];
    if (dataField is Map) {
       rows = DataParsingHelper.asMapList(dataField['data']);
       final meta = DataParsingHelper.asMap(dataField['meta']);
       final totalPages = DataParsingHelper.readInt(meta['totalPages']) ?? 1;
       _hasMore = page < totalPages;
    } else if (dataField is List) {
       rows = DataParsingHelper.asMapList(dataField);
       if (rows.isEmpty && response.data is List) {
         rows.addAll(DataParsingHelper.asMapList(response.data));
       }
       _hasMore = false;
    }
    
    final output = <_StudentListItem>[];

    Map<int, Set<String>> todayFollowUps = const {};
    if (selectedCircleId != null && selectedCircleId > 0) {
      try {
        todayFollowUps =
            await ref.watch(todayFollowUpsProvider(selectedCircleId).future);
      } catch (_) {
        todayFollowUps = const {};
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
  }
}

final _studentsDirectoryProvider =
    AsyncNotifierProvider.autoDispose<_StudentsDirectoryNotifier, List<_StudentListItem>>(() {
  return _StudentsDirectoryNotifier();
});

class StudentsListScreen extends ConsumerStatefulWidget {
  const StudentsListScreen({super.key});

  @override
  ConsumerState<StudentsListScreen> createState() => _StudentsListScreenState();
}

class _StudentsListScreenState extends ConsumerState<StudentsListScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(_studentsDirectoryProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final studentsAsync = ref.watch(_studentsDirectoryProvider);
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
      backgroundColor: context.surfaceColor,
      appBar: StandardAppBar(
        title: 'متابعة الحلقة',
        onBackTap: () {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go(RouteNames.teacherHome);
          }
        },
        actions: [
          IconButton(
            icon: Icon(
              Icons.refresh_rounded,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            onPressed: () => ref.invalidate(_studentsDirectoryProvider),
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
                  onAction: () => ref.invalidate(_studentsDirectoryProvider),
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

                  return ListView.separated(
                    controller: _scrollController,
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: items.length + 1,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      if (index == items.length) {
                        return Consumer(
                          builder: (context, ref, child) {
                            final isLoading = ref.watch(_studentsDirectoryProvider).isLoading;
                            return isLoading
                                ? const Padding(
                                    padding: EdgeInsets.all(AppSpacing.md),
                                    child: Center(child: CircularProgressIndicator()),
                                  )
                                : const SizedBox.shrink();
                          },
                        );
                      }
                      
                      final item = items[index];
                      return _FollowUpStudentCard(
                        item: item,
                        onTap: () => context.push(
                          RouteNames.teacherStudentProfile(item.id),
                        ),
                      ).animate().fadeIn().slideY(
                            begin: 0.04,
                            end: 0,
                            delay: Duration(milliseconds: 20 * index.clamp(0, 20)),
                          );
                    },
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
    final safeProgress = progress.isFinite ? progress.clamp(0.0, 1.0) : 0.0;
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'تقدم المتابعة',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: context.textPrimaryColor,
                ),
              ),
              Text(
                '$completed/$total طالب',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: context.textSecondaryColor,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: safeProgress,
              minHeight: 7,
              color: theme.colorScheme.primary,
              backgroundColor: context.borderColor,
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
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                _StudentAvatar(name: item.name),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          color: context.textPrimaryColor,
                        ),
                      ),
                      const SizedBox(height: 6),
                      _StudentStatusChip(status: item.followUpStatus),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Icon(
                  Icons.keyboard_arrow_left_rounded,
                  size: 20,
                  color: context.textSecondaryColor,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StudentStatusChip extends StatelessWidget {
  final StudentFollowUpStatus status;

  const _StudentStatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final config = _followUpConfig(context, status);
    final Color color = config['color'] as Color;
    final Color bgColor = config['bg'] as Color;
    final IconData icon = config['icon'] as IconData;
    final String label = config['label'] as String;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentAvatar extends StatelessWidget {
  final String name;

  const _StudentAvatar({required this.name});

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final initial = name.trim().isEmpty ? '؟' : name.trim().characters.first;
    final theme = Theme.of(context);

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withValues(alpha: isDark ? 0.20 : 0.10),
        shape: BoxShape.circle,
        border: Border.all(
          color: theme.colorScheme.primary.withValues(alpha: isDark ? 0.35 : 0.20),
        ),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            color: isDark ? Colors.white : theme.colorScheme.primary,
            fontWeight: FontWeight.w900,
            fontSize: 18,
          ),
        ),
      ),
    );
  }
}
