import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../application/context/context_controller.dart';
import '../../../../application/context/context_state.dart';
import '../../../../application/follow_up/follow_up_controller.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/constants/quran_data.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../data/models/follow_up_dtos.dart';
import '../providers/follow_up_providers.dart';
import 'student_follow_up_forms.dart';
import 'student_follow_up_widgets.dart';

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

    if (widget.readOnly) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          120,
        ),
        children: [
          StudentFollowUpLastRecords(records: records),
          const SizedBox(height: 14),
          const FollowUpNoticeBanner(
            color: AppColors.infoLight,
            title: 'المتابعة متاحة للمعلم فقط',
            message:
                'يمكنك مراجعة آخر السجلات من هنا، لكن تسجيل جلسة جديدة أو اعتماد متابعة يتطلب صلاحية المعلم.',
          ),
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
        StudentFollowUpLastRecords(records: records),
        const SizedBox(height: 14),
        if (!contextState.hasSelectedCircle) ...[
          FollowUpNoticeBanner(
            color: AppColors.errorLight,
            title: 'لا يمكن اعتماد المتابعة قبل اختيار الحلقة',
            message: 'اختيار الحلقة أولاً يمنع تسجيل البيانات على سياق خاطئ.',
            action: OutlinedButton.icon(
              onPressed: () => context.push(RouteNames.selectCircle),
              icon: const Icon(Icons.arrow_forward_rounded),
              label: const Text('اختيار الحلقة'),
            ),
          ),
          const SizedBox(height: 14),
        ],
        if (issues.isNotEmpty) ...[
          FollowUpNoticeBanner(
            color: AppColors.errorLight,
            title: 'راجع هذا القسم قبل الحفظ',
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
        AnimatedSwitcher(
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
          child: _buildActiveSection(contextState),
        ),
      ],
    );
  }

  Widget _buildActiveSection(ContextState contextState) {
    switch (_activeSection) {
      case FollowUpSessionSection.memorization:
        return MemorizationSectionForm(
          key: const ValueKey('memorization'),
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
          ),
        );
      case FollowUpSessionSection.review:
        return ReviewSectionForm(
          key: const ValueKey('review'),
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
          ),
        );
      case FollowUpSessionSection.matn:
        return MatnSectionForm(
          key: const ValueKey('matn'),
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
          ),
        );
    }
  }

  Widget _actions(
    ContextState contextState,
    FollowUpSessionSection section,
    String primaryLabel,
    String draftLabel,
  ) {
    final locked = !contextState.hasSelectedCircle ||
        _isSubmitting ||
        (_saved[section] ?? false);
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
          onPressed: locked
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
          onPressed:
              locked ? null : () => _submit(section, _SubmissionMode.draft),
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
        if (mode == _SubmissionMode.finalRecord &&
            section == FollowUpSessionSection.memorization) {
          _activeSection = FollowUpSessionSection.review;
        } else if (mode == _SubmissionMode.finalRecord &&
            section == FollowUpSessionSection.review) {
          _activeSection = FollowUpSessionSection.matn;
        }
      });
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            mode == _SubmissionMode.draft
                ? 'تم حفظ المسودة.'
                : 'تم حفظ المتابعة بنجاح.',
          ),
          backgroundColor: AppColors.successLight,
        ),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_friendlyError(error)),
          backgroundColor: AppColors.errorLight,
        ),
      );
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
            fromAyah: range.fromAyah,
            toAyah: range.toAyah,
            pagesCount: range.pagesCount,
            rating: _newRating,
            notes: notes,
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
            fromAyah: range.fromAyah,
            toAyah: range.toAyah,
            pagesCount: range.pagesCount,
            rating: _reviewRating,
            notes: notes,
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
    final text = error.toString().replaceFirst('Exception: ', '').trim();
    return text.isEmpty ? 'تعذر حفظ المتابعة الآن.' : text;
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
