import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/context/context_controller.dart';
import '../../application/org/org_providers.dart';
import '../../application/supervisor/supervisor_notes_controller.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_snack_bar.dart';
import '../../data/models/org_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/app_card.dart';
import '../shared/widgets/section_header.dart';
import '../shared/widgets/standard_app_bar.dart';

class SupervisorNotesScreen extends ConsumerStatefulWidget {
  const SupervisorNotesScreen({super.key});

  @override
  ConsumerState<SupervisorNotesScreen> createState() =>
      _SupervisorNotesScreenState();
}

class _SupervisorNotesScreenState extends ConsumerState<SupervisorNotesScreen> {
  bool _showForm = false;
  String _category = 'GENERAL';
  int? _selectedCircleId;
  String _targetLabel = '';
  String _content = '';
  bool _didLoad = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_didLoad) return;
    _didLoad = true;
    Future.microtask(_load);
  }

  Future<void> _load() async {
    final ctx = ref.read(contextControllerProvider);
    final centerId = ctx.selectedCenterId;
    await ref
        .read(supervisorNotesControllerProvider.notifier)
        .load(centerId: centerId);
  }

  Future<void> _handleSubmit(List<OrgCircleDto> circles) async {
    if (_content.trim().isEmpty) {
      AppSnackBar.warning(context, 'يرجى كتابة الملاحظة');
      return;
    }

    final ctx = ref.read(contextControllerProvider);
    final centerId = ctx.selectedCenterId;
    final circle = _selectedCircleId != null
        ? circles.where((c) => c.id == _selectedCircleId).firstOrNull
        : null;
    final resolvedLabel = _targetLabel.trim().isNotEmpty
        ? _targetLabel.trim()
        : circle != null
            ? '${circle.name}${circle.teacherName != null ? ' - ${circle.teacherName}' : ''}'
            : null;

    try {
      await ref.read(supervisorNotesControllerProvider.notifier).create(
            centerId: centerId,
            circleId: _selectedCircleId,
            category: _category,
            targetLabel: resolvedLabel,
            content: _content.trim(),
          );

      if (!mounted) return;
      AppSnackBar.success(context, 'تم حفظ الملاحظة بنجاح');
      setState(() {
        _showForm = false;
        _content = '';
        _category = 'GENERAL';
        _selectedCircleId = null;
        _targetLabel = '';
      });
    } catch (_) {
      if (!mounted) return;
      final error = ref.read(supervisorNotesControllerProvider).actionError ??
          'تعذر الحفظ';
      AppSnackBar.error(context, error);
    }
  }

  Future<void> _markResolved(int id) async {
    try {
      await ref.read(supervisorNotesControllerProvider.notifier).markResolved(id);
      if (!mounted) return;
      AppSnackBar.success(context, 'تمت المعالجة بنجاح');
    } catch (_) {
      if (!mounted) return;
      AppSnackBar.error(context, 'تعذر تحديث الملاحظة');
    }
  }

  Map<String, dynamic> _getCategoryStyle(BuildContext context, String cat) {
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;
    final isDark = context.isDark;

    if (cat == 'PRAISE') {
      return {
        'bg': custom.success.withValues(alpha: isDark ? 0.20 : 0.10),
        'color': custom.success,
        'label': 'إشادة'
      };
    }
    if (cat == 'WARNING') {
      return {
        'bg': Theme.of(context).colorScheme.error.withValues(alpha: isDark ? 0.20 : 0.10),
        'color': Theme.of(context).colorScheme.error,
        'label': 'تنبيه'
      };
    }
    if (cat == 'VISIT') {
      return {
        'bg': custom.info.withValues(alpha: isDark ? 0.20 : 0.10),
        'color': custom.info,
        'label': 'زيارة'
      };
    }
    if (cat == 'EVALUATION') {
      return {
        'bg': primary.withValues(alpha: isDark ? 0.20 : 0.10),
        'color': primary,
        'label': 'تقييم'
      };
    }
    return {
      'bg': custom.info.withValues(alpha: isDark ? 0.20 : 0.10),
      'color': custom.info,
      'label': 'ملاحظة عامة'
    };
  }

  @override
  Widget build(BuildContext context) {
    final notesState = ref.watch(supervisorNotesControllerProvider);
    final ctx = ref.watch(contextControllerProvider);
    final centerId = ctx.selectedCenterId;
    final circlesAsync = ref.watch(orgCirclesProvider(centerId));
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: StandardAppBar(
        title: 'ملاحظات إشرافية',
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: TextButton.icon(
              onPressed: () => setState(() => _showForm = !_showForm),
              icon: const Icon(Icons.add_comment_rounded, size: 16),
              label: const Text('جديد',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
              style: TextButton.styleFrom(
                foregroundColor: primary,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: circlesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              AppEmptyState(
                title: 'تعذر تحميل الحلقات',
                subtitle: e.toString(),
                icon: Icons.error_outline_rounded,
                actionLabel: 'إعادة المحاولة',
                onAction: () => ref.invalidate(orgCirclesProvider(centerId)),
              ),
            ],
          ),
          data: (circles) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                children: [
                  if (_showForm) ...[
                    AppCard(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text('ملاحظة جديدة',
                              style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                  color: context.textPrimaryColor)),
                          const SizedBox(height: AppSpacing.sm),
                          _DropdownField<String>(
                            value: _category,
                            hint: 'نوع الملاحظة',
                            items: const [
                              DropdownMenuItem(
                                  value: 'GENERAL', child: Text('ملاحظة عامة')),
                              DropdownMenuItem(
                                  value: 'PRAISE', child: Text('إشادة')),
                              DropdownMenuItem(
                                  value: 'WARNING', child: Text('تنبيه')),
                            ],
                            onChanged: (v) =>
                                setState(() => _category = v ?? 'GENERAL'),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          _DropdownField<int>(
                            value: _selectedCircleId,
                            hint: 'الحلقة / المعلم',
                            items: circles
                                .map((c) => DropdownMenuItem(
                                      value: c.id,
                                      child: Text(
                                        '${c.name}${c.teacherName != null ? ' - ${c.teacherName}' : ''}',
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ))
                                .toList(),
                            onChanged: (v) =>
                                setState(() => _selectedCircleId = v),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          TextField(
                            onChanged: (val) => _content = val,
                            maxLines: 4,
                            style: TextStyle(color: context.textPrimaryColor),
                            decoration: InputDecoration(
                              hintText: 'اكتب ملاحظتك هنا...',
                              filled: true,
                              fillColor: context.surfaceColor,
                              contentPadding: const EdgeInsets.all(14),
                              border: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide(
                                    color: context.borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide(
                                    color: context.borderColor),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.lg),
                                borderSide: BorderSide(
                                    color: primary,
                                    width: 1.5),
                              ),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          Row(
                            children: [
                              Expanded(
                                child: TextButton(
                                  onPressed: () =>
                                      setState(() => _showForm = false),
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(AppRadius.lg),
                                        side: BorderSide(
                                            color: context.borderColor)),
                                  ),
                                  child: Text('إلغاء', style: TextStyle(color: context.textPrimaryColor, fontWeight: FontWeight.w700)),
                                ),
                              ),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: TextButton(
                                  onPressed: notesState.isActing
                                      ? null
                                      : () => _handleSubmit(circles),
                                  style: TextButton.styleFrom(
                                    backgroundColor: primary,
                                    foregroundColor: Theme.of(context).colorScheme.onPrimary,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(
                                            AppRadius.lg)),
                                  ),
                                  child: notesState.isActing
                                      ? SizedBox(
                                          width: 16,
                                          height: 16,
                                          child: CircularProgressIndicator(
                                              color: Theme.of(context).colorScheme.onPrimary,
                                              strokeWidth: 2))
                                      : const Text('حفظ',
                                          style: TextStyle(
                                              fontWeight: FontWeight.w800)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    )
                        .animate()
                        .fadeIn()
                        .slideY(begin: -0.05, end: 0, duration: 250.ms),
                    const SizedBox(height: AppSpacing.lg),
                  ],
                  if (notesState.isLoading)
                    const Center(child: CircularProgressIndicator())
                  else if (notesState.error != null)
                    AppEmptyState(
                      title: 'تعذر تحميل الملاحظات',
                      subtitle: notesState.error!,
                      icon: Icons.error_outline_rounded,
                      actionLabel: 'إعادة المحاولة',
                      onAction: _load,
                    )
                  else if (notesState.items.isEmpty)
                    const AppEmptyState(
                      title: 'لا توجد ملاحظات',
                      subtitle: 'اضغط على زر "جديد" لإضافة ملاحظة إشرافية.',
                      icon: Icons.notes_rounded,
                    )
                  else ...[
                    SectionHeader(
                        title: 'الملاحظات (${notesState.items.length})'),
                    const SizedBox(height: AppSpacing.sm),
                    ...List.generate(notesState.items.length, (index) {
                      final note = notesState.items[index];
                      final catStyle = _getCategoryStyle(context, note.category);
                      final isPending = note.isPending;
                      final custom = context.customColors;
                      final isDark = context.isDark;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: AppCard(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      _Badge(
                                        label: catStyle['label'] as String,
                                        bg: catStyle['bg'] as Color,
                                        color: catStyle['color'] as Color,
                                      ),
                                      if (isPending) ...[
                                        const SizedBox(width: 8),
                                        _Badge(
                                          label: 'قيد المتابعة',
                                          bg: custom.warning
                                              .withValues(alpha: isDark ? 0.20 : 0.10),
                                          color: custom.warning,
                                        ),
                                      ] else ...[
                                        const SizedBox(width: 8),
                                        _Badge(
                                          label: 'تمت المعالجة',
                                          bg: custom.success
                                              .withValues(alpha: isDark ? 0.20 : 0.10),
                                          color: custom.success,
                                        ),
                                      ],
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      Icon(Icons.access_time_rounded,
                                          size: 12,
                                          color: context.textSecondaryColor),
                                      const SizedBox(width: 4),
                                      Text(
                                        DateFormat('d MMM y', 'ar')
                                            .format(note.createdAt),
                                        style: TextStyle(
                                            fontSize: 11,
                                            color: context.textSecondaryColor),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              if (note.targetLabel != null) ...[
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Icon(Icons.person_outline_rounded,
                                        size: 14,
                                        color: primary),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        note.targetLabel!,
                                        style: TextStyle(
                                            color: primary,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 8),
                              Text(
                                note.content,
                                style: TextStyle(
                                    height: 1.6,
                                    fontSize: 13,
                                    color: context.textPrimaryColor),
                              ),
                              if (isPending) ...[
                                const SizedBox(height: AppSpacing.sm),
                                Align(
                                  alignment: AlignmentDirectional.centerEnd,
                                  child: TextButton.icon(
                                    onPressed: () => _markResolved(note.id),
                                    icon: const Icon(Icons.check_circle_outline,
                                        size: 14),
                                    label: const Text('تمت المعالجة',
                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                                    style: TextButton.styleFrom(
                                        foregroundColor: custom.success),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        )
                            .animate()
                            .fadeIn(delay: (index * 50).ms)
                            .slideY(begin: 0.1, end: 0, duration: 300.ms),
                      );
                    }),
                  ],
                  const SizedBox(height: 100),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _DropdownField<T> extends StatelessWidget {
  final T? value;
  final String hint;
  final List<DropdownMenuItem<T>> items;
  final void Function(T?)? onChanged;

  const _DropdownField({
    required this.value,
    required this.hint,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: context.borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          dropdownColor: context.cardColor,
          hint: Text(hint, style: TextStyle(fontSize: 12, color: context.textSecondaryColor)),
          isExpanded: true,
          icon: Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: context.textSecondaryColor),
          style: TextStyle(
              fontSize: 12,
              color: context.textPrimaryColor,
              fontWeight: FontWeight.w600),
          onChanged: onChanged,
          items: items,
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color bg;
  final Color color;

  const _Badge({required this.label, required this.bg, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(AppRadius.sm)),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 10, fontWeight: FontWeight.w800)),
    );
  }
}
