import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../application/context/context_controller.dart';
import '../../application/corrections/corrections_controller.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/correction_dtos.dart';
import '../shared/states/app_empty_state.dart';

class SupervisorApprovalsScreen extends ConsumerStatefulWidget {
  const SupervisorApprovalsScreen({super.key});

  @override
  ConsumerState<SupervisorApprovalsScreen> createState() =>
      _SupervisorApprovalsScreenState();
}

class _SupervisorApprovalsScreenState
    extends ConsumerState<SupervisorApprovalsScreen> {
  bool _didLoad = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_didLoad) {
      return;
    }
    _didLoad = true;
    Future.microtask(_load);
  }

  Future<void> _load() async {
    final contextState = ref.read(contextControllerProvider);
    await ref.read(correctionsControllerProvider.notifier).load(
          centerId: int.tryParse(contextState.selectedCenterId ?? ''),
          circleId: int.tryParse(contextState.selectedCircleId ?? ''),
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(correctionsControllerProvider);

    ref.listen<CorrectionsState>(correctionsControllerProvider,
        (previous, next) {
      if (next.actionError != null &&
          next.actionError != previous?.actionError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.actionError!)),
        );
      }
    });

    final pending =
        state.items.where((item) => item.isPending).toList(growable: false);
    final completed =
        state.items.where((item) => !item.isPending).toList(growable: false);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('طلبات التصحيح'),
          centerTitle: true,
          bottom: TabBar(
            labelColor: Theme.of(context).colorScheme.primary,
            tabs: [
              Tab(text: 'قيد الانتظار (${pending.length})'),
              Tab(text: 'مكتملة (${completed.length})'),
            ],
          ),
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: TabBarView(
            children: [
              _ApprovalsTab(
                items: pending,
                isLoading: state.isLoading,
                onApprove: _approve,
                onReject: _reject,
              ),
              _ApprovalsTab(
                items: completed,
                isLoading: state.isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _approve(CorrectionItemDto item) async {
    final noteController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('اعتماد الطلب'),
        content: TextField(
          controller: noteController,
          decoration: const InputDecoration(
            labelText: 'ملاحظة اعتماد (اختياري)',
          ),
          minLines: 2,
          maxLines: 4,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(
              noteController.text.trim(),
            ),
            child: const Text('اعتماد'),
          ),
        ],
      ),
    );
    noteController.dispose();

    if (result == null) {
      return;
    }

    await ref.read(correctionsControllerProvider.notifier).approve(
          item.id,
          applyChanges: true,
          reviewNote: result,
        );
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم اعتماد الطلب وتطبيق التعديل.')),
    );
  }

  Future<void> _reject(CorrectionItemDto item) async {
    final noteController = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('رفض الطلب'),
        content: TextField(
          controller: noteController,
          decoration: const InputDecoration(
            labelText: 'سبب الرفض',
          ),
          minLines: 2,
          maxLines: 4,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () {
              final value = noteController.text.trim();
              if (value.isEmpty) {
                return;
              }
              Navigator.of(dialogContext).pop(value);
            },
            child: const Text('رفض'),
          ),
        ],
      ),
    );
    noteController.dispose();

    if (result == null || result.trim().isEmpty) {
      return;
    }

    await ref.read(correctionsControllerProvider.notifier).reject(
          item.id,
          reviewNote: result,
        );
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم رفض الطلب.')),
    );
  }
}

class _ApprovalsTab extends StatelessWidget {
  final List<CorrectionItemDto> items;
  final bool isLoading;
  final Future<void> Function(CorrectionItemDto item)? onApprove;
  final Future<void> Function(CorrectionItemDto item)? onReject;

  const _ApprovalsTab({
    required this.items,
    required this.isLoading,
    this.onApprove,
    this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading && items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          AppEmptyState(
            title: 'لا توجد طلبات',
            subtitle: 'هذه القائمة فارغة حاليًا ضمن نطاقك الحالي.',
            icon: Icons.rule_folder_outlined,
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: _CorrectionCard(
            item: item,
            onApprove: onApprove == null ? null : () => onApprove!(item),
            onReject: onReject == null ? null : () => onReject!(item),
          )
              .animate()
              .fadeIn(delay: (100 + index * 50).ms)
              .slideY(begin: 0.1, end: 0, duration: 300.ms),
        );
      },
    );
  }
}

class _CorrectionCard extends StatelessWidget {
  final CorrectionItemDto item;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  const _CorrectionCard({
    required this.item,
    this.onApprove,
    this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = switch (item.status) {
      'APPROVED' || 'APPLIED' => AppColors.successLight,
      'REJECTED' => AppColors.errorLight,
      _ => AppColors.warningLight,
    };

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _targetTypeLabel(item.targetType),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'مقدم الطلب: ${item.requestedByName ?? 'مستخدم #${item.requestedById}'}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                    ),
                  ],
                ),
              ),
              _MiniBadge(label: _statusLabel(item.status), color: statusColor),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            item.reason,
            style:
                Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.6),
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _InfoPill(
                icon: Icons.tag_rounded,
                text: 'الهدف #${item.targetId}',
              ),
              _InfoPill(
                icon: Icons.event_note_rounded,
                text: DateFormat('d MMM y', 'ar').format(item.createdAt),
              ),
              _InfoPill(
                icon: Icons.swap_horiz_rounded,
                text: '${item.proposedChanges.length} تعديل مقترح',
              ),
            ],
          ),
          if ((item.reviewNote ?? '').trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(item.reviewNote!),
            ),
          ],
          if (item.isPending && (onApprove != null || onReject != null)) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onReject,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.errorLight,
                      side: const BorderSide(color: AppColors.errorLight),
                    ),
                    child: const Text('رفض'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: FilledButton(
                    onPressed: onApprove,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.successLight,
                    ),
                    child: const Text('اعتماد'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _targetTypeLabel(String targetType) {
    switch (targetType) {
      case 'ATTENDANCE':
        return 'تصحيح مواظبة';
      case 'FOLLOW_UP':
        return 'تصحيح متابعة';
      case 'EXAM_ATTEMPT':
        return 'تصحيح محاولة اختبار';
      default:
        return 'طلب تصحيح';
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'APPROVED':
        return 'معتمد';
      case 'APPLIED':
        return 'مطبق';
      case 'REJECTED':
        return 'مرفوض';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return 'قيد الانتظار';
    }
  }
}

class _MiniBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _MiniBadge({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoPill({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.primaryLight),
          const SizedBox(width: 6),
          Text(text),
        ],
      ),
    );
  }
}
