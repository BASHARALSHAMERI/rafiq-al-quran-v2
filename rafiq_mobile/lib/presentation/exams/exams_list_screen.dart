import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/context/context_controller.dart';
import '../../application/context/context_state.dart';
import '../../application/exams/exam_controller.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/enums/user_role.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_snack_bar.dart';
import '../../data/models/exam_dtos.dart';
import '../shared/providers/current_user_role_provider.dart';
import 'widgets/exam_attempt_workspace_sheet.dart';
import 'widgets/exam_nomination_actions.dart';
import 'widgets/exam_nomination_sheet.dart';
import 'widgets/exam_shared_widgets.dart';
import 'widgets/exams_list_sections.dart';
import '../shared/widgets/premium_app_bar.dart';
import 'widgets/student_exams_view.dart';

class ExamsListScreen extends ConsumerStatefulWidget {
  const ExamsListScreen({super.key});

  @override
  ConsumerState<ExamsListScreen> createState() => _ExamsListScreenState();
}

class _ExamsListScreenState extends ConsumerState<ExamsListScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String _lastLoadKey = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  bool _requiresContext(UserRole? role) =>
      role == UserRole.teacher || role == UserRole.supervisor;

  void _ensureDataLoaded(ContextState contextState, UserRole? role) {
    final needsContext = _requiresContext(role);
    if (needsContext && !contextState.hasCompleteContext) {
      return;
    }

    final key = [
      role?.name,
      contextState.selectedCenterId?.toString() ?? '',
      contextState.selectedCircleId?.toString() ?? '',
      needsContext.toString(),
    ].join(':');

    if (_lastLoadKey == key) {
      return;
    }

    _lastLoadKey = key;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }

      final includeSupervisorNominations = role == UserRole.supervisor;
      final includeTeacherNominations = role == UserRole.teacher;

      ref.read(examControllerProvider.notifier).loadDashboard(
            centerId: contextState.selectedCenterId,
            circleId: contextState.selectedCircleId,
            includeTemplates: role == UserRole.teacher,
            includeNominations:
                includeTeacherNominations || includeSupervisorNominations,
            nominationStatus: includeSupervisorNominations ? 'SUBMITTED' : null,
          );
    });
  }

  Future<void> _refresh(ContextState contextState, UserRole? role) async {
    final needsContext = _requiresContext(role);
    if (needsContext && !contextState.hasCompleteContext) {
      return;
    }

    final includeSupervisorNominations = role == UserRole.supervisor;
    final includeTeacherNominations = role == UserRole.teacher;

    await ref.read(examControllerProvider.notifier).loadDashboard(
          centerId: contextState.selectedCenterId,
          circleId: contextState.selectedCircleId,
          includeTemplates: role == UserRole.teacher,
          includeNominations:
              includeTeacherNominations || includeSupervisorNominations,
          nominationStatus: includeSupervisorNominations ? 'SUBMITTED' : null,
        );
  }

  Future<void> _openNominationSheet(List<ExamDto> exams) async {
    final nomination = await showModalBottomSheet<ExamNominationDto>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ExamNominationSheet(exams: exams),
    );

    if (!mounted || nomination == null) {
      return;
    }

    AppSnackBar.success(context,
        'تم إرسال ترشيح ${nomination.student?.fullName ?? 'الطالب'} للمراجعة الإشرافية');
  }

  Future<void> _openSupervisorReviewSheet(
    ExamNominationDto nomination,
    ContextState contextState,
    UserRole? role,
  ) async {
    final reviewed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SupervisorReviewNominationSheet(nomination: nomination),
    );

    if (!mounted || reviewed != true) {
      return;
    }

    await _refresh(contextState, role);
  }

  Future<void> _openAttemptSheet(ExamAttemptDto attempt) async {
    await showModalBottomSheet<ExamAttemptDto>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ExamAttemptWorkspaceSheet(attempt: attempt),
    );
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final role = ref.watch(currentUserRoleProvider);

    _ensureDataLoaded(contextState, role);

    final examState = ref.watch(examControllerProvider);
    final primary = Theme.of(context).colorScheme.primary;

    final teacherCanNominate = role == UserRole.teacher;
    final supervisorCanReview = role == UserRole.supervisor;
    final isStudentOrParent =
        role == UserRole.student || role == UserRole.parent;
    final contextRequired = _requiresContext(role);

    final attempts = filterExamAttempts(examState.attempts, _searchQuery);
    final nominations = filterNominations(examState.nominations, _searchQuery);
    final supervisorPendingNominations = supervisorCanReview
        ? nominations.where((n) => n.status == 'SUBMITTED').toList()
        : <ExamNominationDto>[];

    final scheduledCount = examState.attempts
        .where((attempt) => attempt.status == 'SCHEDULED')
        .length;
    final inProgressCount = examState.attempts
        .where((attempt) => attempt.status == 'IN_PROGRESS')
        .length;
    final finalizedCount = examState.attempts
        .where((attempt) =>
            attempt.status == 'EVALUATED' ||
            attempt.status == 'APPROVED' ||
            attempt.status == 'PUBLISHED')
        .length;

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: PremiumAppBar(
        title: 'الاختبارات',
        actions: [
          IconButton(
            tooltip: 'تحديث',
            onPressed:
                examState.isLoading ? null : () => _refresh(contextState, role),
            icon: const Icon(Icons.refresh_rounded),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: contextRequired && !contextState.hasCompleteContext
          ? ExamsContextMissingCard(onRetry: () => _refresh(contextState, role))
          : isStudentOrParent
              ? StudentExamsPremiumView(
                  examState: examState,
                  onRefresh: () => _refresh(contextState, role),
                )
              : RefreshIndicator(
                  color: primary,
                  onRefresh: () => _refresh(contextState, role),
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md,
                      AppSpacing.md,
                      AppSpacing.md,
                      AppSpacing.md,
                    ),
                    children: [
                      if (!isStudentOrParent) ...[
                        ExamsContextSummaryCard(
                          centerName:
                              contextState.selectedCenterName ?? 'غير محدد',
                          circleName:
                              contextState.selectedCircleName ?? 'غير محدد',
                          examTemplateCount: examState.publishedExams.length,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        ExamSearchField(
                          controller: _searchController,
                          query: _searchQuery,
                          onChanged: (value) =>
                              setState(() => _searchQuery = value.trim()),
                          onClear: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        ),
                        const SizedBox(height: AppSpacing.md),
                      ],
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isStudentOrParent
                                      ? 'سجل نتائجي'
                                      : 'سجل الاختبارات',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                    color: context.textPrimaryColor,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  teacherCanNominate
                                      ? 'ترشيح الطالب يتم من المعلم ثم يمر بمرحلة المراجعة الإشرافية قبل اعتماد المركز.'
                                      : supervisorCanReview
                                          ? 'مراجعة طلبات الترشيح المقدمة من المعلمين واتخاذ قرار إشرافي.'
                                          : isStudentOrParent
                                              ? 'هنا يمكنك متابعة نتائج اختباراتك والمواعيد المجدولة لك.'
                                              : 'عرض المحاولات والنتائج وفق الصلاحية الحالية.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: context.textSecondaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (teacherCanNominate)
                            FilledButton.icon(
                              onPressed: examState.isSubmitting ||
                                      examState.publishedExams.isEmpty
                                  ? null
                                  : () => _openNominationSheet(
                                      examState.publishedExams),
                              style: FilledButton.styleFrom(
                                backgroundColor: primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              icon: const Icon(
                                Icons.person_add_alt_1_rounded,
                                size: 18,
                              ),
                              label: const Text('ترشيح طالب'),
                            )
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      ExamsStatsGrid(
                        totalCount: examState.attempts.length,
                        pendingCount: scheduledCount,
                        inProgressCount: inProgressCount,
                        reviewedCount: finalizedCount,
                      ),
                      if (teacherCanNominate) ...[
                        const SizedBox(height: AppSpacing.md),
                        const ExamSectionHeader(
                          title: 'متابعة الترشيحات',
                          subtitle: 'حالة طلباتك لدى المشرف ثم إدارة المركز',
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        if (nominations.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'لا توجد طلبات ترشيح مطابقة حالياً.',
                              style: TextStyle(
                                  color: context.textSecondaryColor),
                            ),
                          )
                        else
                          ...nominations.map(
                            (nomination) => Padding(
                              padding:
                                  const EdgeInsets.only(bottom: AppSpacing.sm),
                              child: NominationReviewCard(
                                nomination: nomination,
                                busy: examState.isSubmitting,
                              ),
                            ),
                          ),
                      ],
                      if (supervisorCanReview) ...[
                        const SizedBox(height: AppSpacing.md),
                        ExamSectionHeader(
                          title: 'طلبات الترشيح المعلقة',
                          subtitle: supervisorPendingNominations.isEmpty
                              ? 'لا توجد طلبات بانتظار مراجعتك'
                              : '${supervisorPendingNominations.length} طلب بانتظار قرارك الإشرافي',
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        if (supervisorPendingNominations.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Text(
                              'لا توجد طلبات ترشيح بانتظار المراجعة الإشرافية.',
                              style: TextStyle(
                                  color: context.textSecondaryColor),
                            ),
                          )
                        else
                          ...supervisorPendingNominations.map(
                            (nomination) => Padding(
                              padding:
                                  const EdgeInsets.only(bottom: AppSpacing.sm),
                              child: NominationReviewCard(
                                nomination: nomination,
                                busy: examState.isSubmitting,
                                onApprove: () => _openSupervisorReviewSheet(
                                  nomination,
                                  contextState,
                                  role,
                                ),
                                onReject: () => _openSupervisorReviewSheet(
                                  nomination,
                                  contextState,
                                  role,
                                ),
                              ),
                            ),
                          ),
                      ],
                      if (examState.error != null && examState.hasContent) ...[
                        const SizedBox(height: AppSpacing.md),
                        ExamInlineWarningCard(
                          message: examState.error!,
                          onRetry: () => _refresh(contextState, role),
                        ),
                      ],
                      const SizedBox(height: AppSpacing.md),
                      if (examState.isLoading && !examState.hasLoaded)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 56),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: primary,
                            ),
                          ),
                        )
                      else if (examState.error != null && !examState.hasContent)
                        ExamsErrorStateCard(
                          message: examState.error!,
                          onRetry: () => _refresh(contextState, role),
                        )
                      else if (attempts.isEmpty)
                        ExamsEmptyAttemptsCard(
                          hasPublishedExams:
                              examState.publishedExams.isNotEmpty,
                          hasSearchQuery: _searchQuery.isNotEmpty,
                          onNominate: !teacherCanNominate ||
                                  examState.publishedExams.isEmpty
                              ? null
                              : () => _openNominationSheet(
                                  examState.publishedExams),
                        )
                      else
                        ...attempts.map(
                          (attempt) => Padding(
                            padding:
                                const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: ExamAttemptCard(
                              attempt: attempt,
                              onTapAction: () => _openAttemptSheet(attempt),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}
