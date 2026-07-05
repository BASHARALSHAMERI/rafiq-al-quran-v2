import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../../../application/context/context_controller.dart';
import '../../../../application/context/context_state.dart';
import '../../../../application/follow_up/follow_up_controller.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/constants/quran_data.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/app_snack_bar.dart';
import '../../../../data/models/follow_up_dtos.dart';
import '../providers/follow_up_providers.dart';
import 'student_follow_up_forms.dart';
import 'student_follow_up_widgets.dart';
import '../../../../data/models/teacher_panel_dtos.dart';
import '../../../../domain/entities/student_profile.dart';
import '../../../../application/teacher/teacher_panel_providers.dart';
import '../../../../application/attendance/attendance_providers.dart';
import '../../../../domain/entities/attendance.dart';

enum _SubmissionMode { draft, finalRecord }

class StudentFollowUpTab extends ConsumerStatefulWidget {
  final int studentId;
  final bool readOnly;

  const StudentFollowUpTab({
    super.key,
    required this.studentId,
    this.readOnly = false,
  });

  @override
  ConsumerState<StudentFollowUpTab> createState() => _StudentFollowUpTabState();
}

class _StudentFollowUpTabState extends ConsumerState<StudentFollowUpTab> {
  FollowUpSessionSection _activeSection = FollowUpSessionSection.memorization;
  bool _isSubmitting = false;

  final _saved = <FollowUpSessionSection, bool>{
    FollowUpSessionSection.memorization: false,
    FollowUpSessionSection.review: false,
    FollowUpSessionSection.matn: false,
  };
  final _issues = <FollowUpSessionSection, List<String>>{
    FollowUpSessionSection.memorization: const [],
    FollowUpSessionSection.review: const [],
    FollowUpSessionSection.matn: const [],
  };

  final Map<FollowUpSessionSection, String> _idempotencyKeys = {
    FollowUpSessionSection.memorization: const Uuid().v4(),
    FollowUpSessionSection.review: const Uuid().v4(),
    FollowUpSessionSection.matn: const Uuid().v4(),
  };

  QuranSurah? _newFromSurah;
  QuranSurah? _newToSurah;
  final _newFromAyahCtrl = TextEditingController(text: '1');
  final _newToAyahCtrl = TextEditingController(text: '1');
  final _newNotesCtrl = TextEditingController();
  int _newRating = 4;

  QuranSurah? _reviewFromSurah;
  QuranSurah? _reviewToSurah;
  final _reviewFromAyahCtrl = TextEditingController(text: '1');
  final _reviewToAyahCtrl = TextEditingController(text: '1');
  final _reviewNotesCtrl = TextEditingController();
  int _reviewRating = 4;

  final _matnLessonCtrl = TextEditingController();
  final _matnNotesCtrl = TextEditingController();
  String _selectedMatn = 'تحفة الأطفال';
  String _matnStatus = 'COMPLETED';

  @override
  void dispose() {
    _newFromAyahCtrl.dispose();
    _newToAyahCtrl.dispose();
    _newNotesCtrl.dispose();
    _reviewFromAyahCtrl.dispose();
    _reviewToAyahCtrl.dispose();
    _reviewNotesCtrl.dispose();
    _matnLessonCtrl.dispose();
    _matnNotesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contextState = ref.watch(contextControllerProvider);
    final issues = _issues[_activeSection] ?? const <String>[];
    final profileAsync = ref.watch(studentProfileProvider(widget.studentId));
    final records = profileAsync.valueOrNull?.recentFollowUps ?? const [];

    final now = DateTime.now();
    final period = (month: now.month, year: now.year);
    final plansList =
        ref.watch(teacherMonthlyPlansProvider(period)).valueOrNull;

    TeacherMonthlyPlanDto? plan;
    if (plansList != null) {
      for (final p in plansList.plans) {
        if (p.studentId == widget.studentId) {
          plan = p;
          break;
        }
      }
    }

    final circleId = int.tryParse(contextState.selectedCircleId ?? '');

    final attendanceAsync = circleId != null
        ? ref.watch(todayAttendanceProvider(circleId.toString()))
        : null;

    final isAttendanceLoading = attendanceAsync != null &&
        attendanceAsync.isLoading &&
        attendanceAsync.valueOrNull == null;

    final hasAttendanceError =
        attendanceAsync != null && attendanceAsync.hasError;

    final attendanceRecords = attendanceAsync?.valueOrNull;
    AttendanceRecord? studentRecord;
    if (attendanceRecords != null) {
      for (final r in attendanceRecords) {
        if (r.studentId == widget.studentId.toString()) {
          studentRecord = r;
          break;
        }
      }
    }

    final bool hasConfirmedAttendance = studentRecord != null;
    final bool isPrepared = hasConfirmedAttendance;
    final bool isAbsent = studentRecord?.status == AttendanceStatus.absent;
    final bool isExcused = studentRecord?.status == AttendanceStatus.excused;

    final bool blocksInteraction = !widget.readOnly && (isAbsent || isExcused);
    final bool blocksFinalRecord = !widget.readOnly &&
        (circleId == null || !hasConfirmedAttendance || isAbsent || isExcused);
    final bool blocksDraft = !widget.readOnly && (isAbsent || isExcused);

    if (circleId != null && isAttendanceLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (widget.readOnly) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          120,
        ),
        children: [
          _buildCompactHeaderRow(
              FollowUpSessionSection.memorization, plan, records),
          const SizedBox(height: 14),
          _buildCompactHeaderRow(FollowUpSessionSection.review, plan, records),
          const SizedBox(height: 14),
          _buildCompactHeaderRow(FollowUpSessionSection.matn, plan, records),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.md,
        AppSpacing.md,
        120,
      ),
      children: [
        if (!contextState.hasSelectedCircle) ...[
          FollowUpNoticeBanner(
            color: AppColors.errorLight,
            title: 'يجب اختيار الحلقة أولاً للاعتماد',
            message: '',
            action: OutlinedButton.icon(
              onPressed: () => context.push(RouteNames.selectCircle),
              icon: const Icon(Icons.arrow_forward_rounded, size: 16),
              label: const Text('اختيار الحلقة'),
            ),
          ),
          const SizedBox(height: 14),
        ] else if (hasAttendanceError) ...[
          FollowUpNoticeBanner(
            color: AppColors.errorLight,
            title: 'تعذر التحقق من حالة الحضور والتحضير اليوم',
            message:
                'يمكنك إدخال البيانات وحفظها كمسودة، لكن اعتماد المتابعة النهائي يحتاج تحقق الحضور أولاً.',
            action: OutlinedButton.icon(
              onPressed: () =>
                  ref.invalidate(todayAttendanceProvider(circleId.toString())),
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('إعادة المحاولة'),
            ),
          ),
          const SizedBox(height: 14),
        ] else if (!isPrepared) ...[
          const FollowUpNoticeBanner(
            color: AppColors.warningLight,
            title: 'تنبيه: لم يتم تحضير الطالب اليوم',
            message:
                'يمكنك حفظ العمل كمسودة الآن، ويجب تسجيل حضور الطالب قبل اعتماد المتابعة النهائي.',
          ),
          const SizedBox(height: 14),
        ] else if (isAbsent) ...[
          const FollowUpNoticeBanner(
            color: AppColors.errorLight,
            title: 'تنبيه: الطالب مسجل غائب اليوم',
            message:
                'لا يمكن إدخال أو حفظ بيانات المتابعة (حفظ، مراجعة، أو متون) لطالب مسجل غائب.',
          ),
          const SizedBox(height: 14),
        ] else if (isExcused) ...[
          const FollowUpNoticeBanner(
            color: AppColors.errorLight,
            title: 'تنبيه: الطالب مسجل غائب بعذر اليوم',
            message:
                'لا يمكن إدخال أو حفظ بيانات المتابعة (حفظ، مراجعة، أو متون) لطالب مسجل غائب بعذر.',
          ),
          const SizedBox(height: 14),
        ],
        if (issues.isNotEmpty) ...[
          FollowUpNoticeBanner(
            color: AppColors.errorLight,
            title: 'يرجى مراجعة وتصحيح التنبيهات قبل الحفظ',
            message: issues.join('\n'),
          ),
          const SizedBox(height: 14),
        ],
        FollowUpHorizontalStepper(
          activeSection: _activeSection,
          saved: _saved,
          issues: _issues,
          onSelect: (section) => setState(() => _activeSection = section),
        ),
        const SizedBox(height: 16),
        AbsorbPointer(
          absorbing: blocksInteraction,
          child: Opacity(
            opacity: blocksInteraction ? 0.6 : 1.0,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              switchInCurve: Curves.easeOut,
              switchOutCurve: Curves.easeIn,
              transitionBuilder: (child, animation) => FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.04, 0),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              ),
              child: _buildActiveSection(
                contextState,
                plan,
                records,
                blocksFinalRecord,
                blocksDraft,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCompactHeaderRow(
    FollowUpSessionSection section,
    TeacherMonthlyPlanDto? plan,
    List<FollowUpRecord> records,
  ) {
    FollowUpRecord? latestOf(String type) {
      for (final record in records) {
        if (record.type == type) {
          return record;
        }
      }
      return null;
    }

    String formatPlanRange(
        int? fromSurah, int? fromAyah, int? toSurah, int? toAyah) {
      if (fromSurah == null) return 'غير محددة';
      final fromSurahName =
          QuranData.findByNumber(fromSurah)?.name ?? '$fromSurah';
      if (toSurah == null || toSurah == fromSurah) {
        if (fromAyah != null && toAyah != null) {
          return '$fromSurahName ($fromAyah-$toAyah)';
        }
        return fromSurahName;
      }
      final toSurahName = QuranData.findByNumber(toSurah)?.name ?? '$toSurah';
      return '$fromSurahName - $toSurahName';
    }

    switch (section) {
      case FollowUpSessionSection.memorization:
        final lastMemo = latestOf('NEW_MEMORIZATION');
        if (plan == null) {
          return AchievementMiniCard(
            title: 'آخر حفظ مسجل',
            record: lastMemo,
            icon: Icons.menu_book_rounded,
          );
        }
        final targetRange = formatPlanRange(
          plan.hifz.fromSurah,
          plan.hifz.fromAyah,
          plan.hifz.toSurah,
          plan.hifz.toAyah,
        );
        return Row(
          children: [
            Expanded(
              child: AchievementMiniCard(
                title: 'آخر حفظ مسجل',
                record: lastMemo,
                icon: Icons.menu_book_rounded,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: PlanProgressMiniCard(
                title: 'خطة الحفظ لشهر ${plan.month}',
                rangeText: targetRange,
                executed: plan.progress.hifzExecutedPages,
                target: plan.hifz.targetPages ?? 0.0,
                rate: plan.progress.hifzCompletionRate,
                icon: Icons.trending_up_rounded,
              ),
            ),
          ],
        );
      case FollowUpSessionSection.review:
        final lastReview = latestOf('REVIEW');
        if (plan == null) {
          return AchievementMiniCard(
            title: 'آخر مراجعة مسجلة',
            record: lastReview,
            icon: Icons.autorenew_rounded,
          );
        }
        final targetRange = formatPlanRange(
          plan.review.fromSurah,
          plan.review.fromAyah,
          plan.review.toSurah,
          plan.review.toAyah,
        );
        return Row(
          children: [
            Expanded(
              child: AchievementMiniCard(
                title: 'آخر مراجعة مسجلة',
                record: lastReview,
                icon: Icons.autorenew_rounded,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: PlanProgressMiniCard(
                title: 'خطة المراجعة لشهر ${plan.month}',
                rangeText: targetRange,
                executed: plan.progress.reviewExecutedPages,
                target: plan.review.targetPages ?? 0.0,
                rate: plan.progress.reviewCompletionRate,
                icon: Icons.loop_rounded,
              ),
            ),
          ],
        );
      case FollowUpSessionSection.matn:
        final lastMatn = latestOf('MATN');
        return Row(
          children: [
            Expanded(
              child: AchievementMiniCard(
                title: 'آخر متن مسجل',
                record: lastMatn,
                icon: Icons.bookmark_added_rounded,
              ),
            ),
          ],
        );
    }
  }

  Widget _buildActiveSection(
    ContextState contextState,
    TeacherMonthlyPlanDto? plan,
    List<FollowUpRecord> records,
    bool blocksFinalRecord,
    bool blocksDraft,
  ) {
    switch (_activeSection) {
      case FollowUpSessionSection.memorization:
        return MemorizationSectionForm(
          key: const ValueKey('memorization'),
          header: _buildCompactHeaderRow(
              FollowUpSessionSection.memorization, plan, records),
          fromSurah: _newFromSurah,
          toSurah: _newToSurah,
          fromAyahController: _newFromAyahCtrl,
          toAyahController: _newToAyahCtrl,
          notesController: _newNotesCtrl,
          rating: _newRating,
          onFromSurahChanged: (value) {
            _touch(FollowUpSessionSection.memorization);
            setState(() {
              _newFromSurah = value;
              _newToSurah = value;
              if (_newFromAyahCtrl.text.isEmpty) {
                _newFromAyahCtrl.text = '1';
              }
              if (value != null) {
                _newToAyahCtrl.text = '${value.ayahCount}';
              }
            });
          },
          onToSurahChanged: (value) {
            _touch(FollowUpSessionSection.memorization);
            setState(() {
              _newToSurah = value;
              _newToAyahCtrl.text = '${value?.ayahCount ?? 1}';
            });
          },
          onNotesChanged: (_) => _touch(FollowUpSessionSection.memorization),
          onRatingChanged: (value) {
            _touch(FollowUpSessionSection.memorization);
            setState(() => _newRating = value);
          },
          estimatedPages: _pagesText(
            _newFromSurah,
            _newFromAyahCtrl.text,
            _newToSurah ?? _newFromSurah,
            _newToAyahCtrl.text,
          ),
          actions: _actions(
            contextState,
            FollowUpSessionSection.memorization,
            'اعتماد الحفظ',
            'حفظ كمسودة',
            blocksFinalRecord,
            blocksDraft,
          ),
        );
      case FollowUpSessionSection.review:
        return ReviewSectionForm(
          key: const ValueKey('review'),
          header: _buildCompactHeaderRow(
              FollowUpSessionSection.review, plan, records),
          fromSurah: _reviewFromSurah,
          toSurah: _reviewToSurah,
          fromAyahController: _reviewFromAyahCtrl,
          toAyahController: _reviewToAyahCtrl,
          notesController: _reviewNotesCtrl,
          rating: _reviewRating,
          onFromSurahChanged: (value) {
            _touch(FollowUpSessionSection.review);
            setState(() {
              _reviewFromSurah = value;
              _reviewToSurah = value;
              if (_reviewFromAyahCtrl.text.isEmpty) {
                _reviewFromAyahCtrl.text = '1';
              }
              if (value != null) {
                _reviewToAyahCtrl.text = '${value.ayahCount}';
              }
            });
          },
          onToSurahChanged: (value) {
            _touch(FollowUpSessionSection.review);
            setState(() {
              _reviewToSurah = value;
              _reviewToAyahCtrl.text = '${value?.ayahCount ?? 1}';
            });
          },
          onNotesChanged: (_) => _touch(FollowUpSessionSection.review),
          onRatingChanged: (value) {
            _touch(FollowUpSessionSection.review);
            setState(() => _reviewRating = value);
          },
          estimatedPages: _pagesText(
            _reviewFromSurah,
            _reviewFromAyahCtrl.text,
            _reviewToSurah ?? _reviewFromSurah,
            _reviewToAyahCtrl.text,
          ),
          actions: _actions(
            contextState,
            FollowUpSessionSection.review,
            'اعتماد المراجعة',
            'حفظ كمسودة',
            blocksFinalRecord,
            blocksDraft,
          ),
        );
      case FollowUpSessionSection.matn:
        return MatnSectionForm(
          key: const ValueKey('matn'),
          header: _buildCompactHeaderRow(
              FollowUpSessionSection.matn, plan, records),
          selectedMatn: _selectedMatn,
          lessonController: _matnLessonCtrl,
          notesController: _matnNotesCtrl,
          matnStatus: _matnStatus,
          onMatnChanged: (value) {
            _touch(FollowUpSessionSection.matn);
            setState(() => _selectedMatn = value);
          },
          onLessonChanged: (_) => _touch(FollowUpSessionSection.matn),
          onNotesChanged: (_) => _touch(FollowUpSessionSection.matn),
          onCompletedSelected: () {
            _touch(FollowUpSessionSection.matn);
            setState(() => _matnStatus = 'COMPLETED');
          },
          onPendingSelected: () {
            _touch(FollowUpSessionSection.matn);
            setState(() => _matnStatus = 'PENDING');
          },
          actions: _actions(
            contextState,
            FollowUpSessionSection.matn,
            'اعتماد المتن',
            'حفظ كمسودة',
            blocksFinalRecord,
            blocksDraft,
          ),
        );
    }
  }

  Widget _actions(
    ContextState contextState,
    FollowUpSessionSection section,
    String primaryLabel,
    String draftLabel,
    bool blocksFinalRecord,
    bool blocksDraft,
  ) {
    final baseLocked = !contextState.hasSelectedCircle ||
        _isSubmitting ||
        (_saved[section] ?? false);
    final finalLocked = baseLocked || blocksFinalRecord;
    final draftLocked = baseLocked || blocksDraft;
    final accent = _sectionAccent(section);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_saved[section] == true)
          const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: FollowUpNoticeBanner(
              color: AppColors.successLight,
              title: 'تم حفظ هذا القسم',
              message: 'عدل أي حقل لتسجيل نسخة جديدة.',
            ),
          ),
        FilledButton.icon(
          onPressed: finalLocked
              ? null
              : () => _submit(section, _SubmissionMode.finalRecord),
          style: FilledButton.styleFrom(
            backgroundColor: accent,
            disabledBackgroundColor: AppColors.borderLight,
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
          ),
          icon: _isSubmitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.check_circle_rounded, size: 20),
          label: Text(
            primaryLabel,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
          ),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: draftLocked
              ? null
              : () => _submit(section, _SubmissionMode.draft),
          style: OutlinedButton.styleFrom(
            foregroundColor: accent,
            side: BorderSide(color: accent.withValues(alpha: 0.4)),
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          icon: const Icon(Icons.save_outlined, size: 18),
          label: Text(
            draftLabel,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }

  String _pagesText(
    QuranSurah? fromSurah,
    String fromAyahText,
    QuranSurah? toSurah,
    String toAyahText,
  ) {
    if (fromSurah == null) {
      return '0';
    }
    final effectiveToSurah = toSurah ?? fromSurah;
    final fromAyah = int.tryParse(fromAyahText) ?? 1;
    final toAyah = int.tryParse(toAyahText) ?? effectiveToSurah.ayahCount;
    final pages = QuranData.estimatePagesRange(
      fromSurahNumber: fromSurah.number,
      fromAyah: fromAyah,
      toSurahNumber: effectiveToSurah.number,
      toAyah: toAyah,
    );
    return pages <= 0 ? '0' : pages.toStringAsFixed(1);
  }

  String get _recordDate => DateTime.now().toIso8601String().split('T').first;

  void _touch(FollowUpSessionSection section) {
    setState(() {
      _saved[section] = false;
      _issues[section] = const [];
    });
  }

  Color _sectionAccent(FollowUpSessionSection section) {
    switch (section) {
      case FollowUpSessionSection.memorization:
        return AppColors.secondaryLight;
      case FollowUpSessionSection.review:
        return AppColors.infoLight;
      case FollowUpSessionSection.matn:
        return AppColors.successLight;
    }
  }

  Future<void> _submit(
    FollowUpSessionSection section,
    _SubmissionMode mode,
  ) async {
    final result = _buildRequest(section, mode);
    setState(() => _issues[section] = result.issues);
    if (result.request == null) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await ref
          .read(followUpControllerProvider.notifier)
          .createFollowUp(result.request!);
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _saved[section] = true;
        _issues[section] = const [];
      });
      if (!mounted) {
        return;
      }
      AppSnackBar.success(
        context,
        mode == _SubmissionMode.draft
            ? 'تم حفظ المسودة.'
            : 'تم حفظ المتابعة بنجاح.',
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _issues[section] = [
          'تعذر حفظ البيانات الآن.',
          _friendlyError(error),
        ];
      });
      AppSnackBar.error(context, _friendlyError(error));
    }
  }

  _BuildResult _buildRequest(
    FollowUpSessionSection section,
    _SubmissionMode mode,
  ) {
    final issues = <String>[];
    final circleId = int.tryParse(
      ref.read(contextControllerProvider).selectedCircleId ?? '',
    );
    if (circleId == null || circleId <= 0) {
      issues.add('اختر الحلقة الحالية قبل تسجيل المتابعة.');
      return _BuildResult(issues: issues);
    }

    switch (section) {
      case FollowUpSessionSection.memorization:
        final range = _validateRange(
          _newFromSurah,
          _newToSurah,
          _newFromAyahCtrl.text,
          _newToAyahCtrl.text,
          issues,
        );
        final notes = _clean(_newNotesCtrl.text);
        if (mode == _SubmissionMode.finalRecord &&
            _newRating <= 2 &&
            notes == null) {
          issues.add('أضف ملاحظة قصيرة عند التقييم الضعيف للحفظ.');
        }
        if (range == null || issues.isNotEmpty) {
          return _BuildResult(issues: issues);
        }
        return _BuildResult(
          request: CreateFollowUpRequestDto(
            studentId: widget.studentId,
            circleId: circleId,
            recordDate: _recordDate,
            type: 'NEW_MEMORIZATION',
            status: mode == _SubmissionMode.draft ? 'DRAFT' : 'FINAL',
            surah: range.surah,
            fromSurah: _newFromSurah?.number,
            toSurah: _newToSurah?.number ?? _newFromSurah?.number,
            fromAyah: range.fromAyah,
            toAyah: range.toAyah,
            fromPage: QuranData.getPageNumber(_newFromSurah!.number, range.fromAyah),
            toPage: QuranData.getPageNumber((_newToSurah ?? _newFromSurah)!.number, range.toAyah),
            pagesCount: range.pagesCount,
            rating: _newRating,
            notes: notes,
            idempotencyKey: _idempotencyKeys[FollowUpSessionSection.memorization],
          ),
        );
      case FollowUpSessionSection.review:
        final range = _validateRange(
          _reviewFromSurah,
          _reviewToSurah,
          _reviewFromAyahCtrl.text,
          _reviewToAyahCtrl.text,
          issues,
        );
        final notes = _clean(_reviewNotesCtrl.text);
        if (mode == _SubmissionMode.finalRecord &&
            _reviewRating <= 2 &&
            notes == null) {
          issues.add('أضف ملاحظة قصيرة عند انخفاض تقييم المراجعة.');
        }
        if (range == null || issues.isNotEmpty) {
          return _BuildResult(issues: issues);
        }
        return _BuildResult(
          request: CreateFollowUpRequestDto(
            studentId: widget.studentId,
            circleId: circleId,
            recordDate: _recordDate,
            type: 'REVIEW',
            status: mode == _SubmissionMode.draft ? 'DRAFT' : 'FINAL',
            surah: range.surah,
            fromSurah: _reviewFromSurah?.number,
            toSurah: _reviewToSurah?.number ?? _reviewFromSurah?.number,
            fromAyah: range.fromAyah,
            toAyah: range.toAyah,
            fromPage: QuranData.getPageNumber(_reviewFromSurah!.number, range.fromAyah),
            toPage: QuranData.getPageNumber((_reviewToSurah ?? _reviewFromSurah)!.number, range.toAyah),
            pagesCount: range.pagesCount,
            rating: _reviewRating,
            notes: notes,
            idempotencyKey: _idempotencyKeys[FollowUpSessionSection.review],
          ),
        );
      case FollowUpSessionSection.matn:
        final lesson = _clean(_matnLessonCtrl.text);
        final notes = _clean(_matnNotesCtrl.text);
        if (lesson == null) {
          issues.add('اكتب الدرس أو الأبيات قبل حفظ المتن.');
        }
        if (mode == _SubmissionMode.finalRecord &&
            _matnStatus == 'PENDING' &&
            notes == null) {
          issues.add('عند احتياج المتن لمتابعة أضف ملاحظة تشرح المطلوب.');
        }
        if (issues.isNotEmpty) {
          return _BuildResult(issues: issues);
        }
        return _BuildResult(
          request: CreateFollowUpRequestDto(
            studentId: widget.studentId,
            circleId: circleId,
            recordDate: _recordDate,
            type: 'MATN',
            status: mode == _SubmissionMode.draft ? 'DRAFT' : 'FINAL',
            matnName: _selectedMatn,
            matnStatus: _matnStatus,
            notes: notes == null
                ? 'الدرس: $lesson'
                : 'الدرس: $lesson\nملاحظات: $notes',
            idempotencyKey: _idempotencyKeys[FollowUpSessionSection.matn],
          ),
        );
    }
  }

  _RangeResult? _validateRange(
    QuranSurah? fromSurah,
    QuranSurah? toSurah,
    String fromAyahText,
    String toAyahText,
    List<String> issues,
  ) {
    if (fromSurah == null) {
      issues.add('حدد بداية المدى من سورة صحيحة.');
      return null;
    }

    final effectiveToSurah = toSurah ?? fromSurah;
    final fromAyah = int.tryParse(fromAyahText.trim());
    final toAyah = int.tryParse(toAyahText.trim());

    if (fromAyah == null || fromAyah < 1 || fromAyah > fromSurah.ayahCount) {
      issues.add('رقم آية البداية غير صالح في ${fromSurah.name}.');
    }
    if (toAyah == null || toAyah < 1 || toAyah > effectiveToSurah.ayahCount) {
      issues.add('رقم آية النهاية غير صالح في ${effectiveToSurah.name}.');
    }

    // New Logical Check: From must be <= To
    if (effectiveToSurah.number == fromSurah.number) {
      if (fromAyah != null && toAyah != null && fromAyah > toAyah) {
        issues.add('آية البداية لا يمكن أن تكون أكبر من آية النهاية.');
      }
    } else if (effectiveToSurah.number < fromSurah.number) {
      issues.add('سورة النهاية لا يمكن أن تسبق سورة البداية.');
    }

    if (issues.isNotEmpty) {
      return null;
    }

    final pages = QuranData.estimatePagesRange(
      fromSurahNumber: fromSurah.number,
      fromAyah: fromAyah!,
      toSurahNumber: effectiveToSurah.number,
      toAyah: toAyah!,
    );
    if (pages <= 0) {
      issues.add('لم نستطع احتساب المدى، راجع السورة والآيات المدخلة.');
      return null;
    }

    return _RangeResult(
      surah: effectiveToSurah.number == fromSurah.number
          ? fromSurah.name
          : '${fromSurah.name} - ${effectiveToSurah.name}',
      fromAyah: fromAyah,
      toAyah: toAyah,
      pagesCount: double.parse(pages.toStringAsFixed(1)),
    );
  }

  String? _clean(String value) {
    final text = value.trim();
    return text.isEmpty ? null : text;
  }

  String _friendlyError(Object error) {
    return 'تعذر حفظ المتابعة الآن. يرجى المحاولة مرة أخرى.';
  }
}

class _BuildResult {
  final CreateFollowUpRequestDto? request;
  final List<String> issues;

  const _BuildResult({
    this.request,
    this.issues = const [],
  });
}

class _RangeResult {
  final String surah;
  final int fromAyah;
  final int toAyah;
  final double pagesCount;

  const _RangeResult({
    required this.surah,
    required this.fromAyah,
    required this.toAyah,
    required this.pagesCount,
  });
}
