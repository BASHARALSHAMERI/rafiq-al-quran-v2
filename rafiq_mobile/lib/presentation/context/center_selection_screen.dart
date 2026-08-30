import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_controller.dart';
import '../../core/enums/user_role.dart';

import '../../application/context/context_controller.dart';
import '../../application/context/context_state.dart';
import '../../core/router/route_names.dart';
import '../shared/widgets/page_state_view.dart';

class CenterSelectionScreen extends ConsumerStatefulWidget {
  const CenterSelectionScreen({super.key});

  @override
  ConsumerState<CenterSelectionScreen> createState() =>
      _CenterSelectionScreenState();
}

class _CenterSelectionScreenState extends ConsumerState<CenterSelectionScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(contextControllerProvider.notifier).loadCenters();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(contextControllerProvider);
    final theme = Theme.of(context);

    ref.listen<ContextState>(contextControllerProvider, (previous, next) {
      final auth = ref.read(authControllerProvider);
      final role = parseUserRole(auth.user?.role);
      final requiresCenterOnly = role?.requiresCenterOnly ?? false;

      if (next.hasSelectedCenter && !next.hasSelectedCircle) {
        if (requiresCenterOnly) {
          context.go(RouteNames.root);
        } else {
          context.go(RouteNames.selectCircle);
        }
      } else if (next.hasCompleteContext) {
        context.go(RouteNames.root);
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primary.withValues(alpha: 0.12),
                    theme.scaffoldBackgroundColor,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'اختيار المركز',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'اختر المركز الذي تريد العمل ضمنه لهذا الحساب.',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const PageStateView.loading(
                      title: 'جارٍ تحميل المراكز',
                      message: 'يرجى الانتظار قليلًا.',
                    )
                  : state.error != null
                      ? PageStateView.error(
                          title: 'تعذر تحميل المراكز',
                          message: state.error!,
                          actionLabel: 'إعادة المحاولة',
                          onAction: () => ref
                              .read(contextControllerProvider.notifier)
                              .loadCenters(),
                        )
                      : state.centers.isEmpty
                          ? const PageStateView.empty(
                              title: 'لا توجد مراكز متاحة',
                              message:
                                  'لم يتم العثور على مراكز مرتبطة بهذا الحساب.',
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: state.centers.length,
                              itemBuilder: (context, index) {
                                final center = state.centers[index];
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(14),
                                    onTap: () => ref
                                        .read(
                                            contextControllerProvider.notifier)
                                        .selectCenter(center.id),
                                    child: Padding(
                                      padding: const EdgeInsets.all(14),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 44,
                                            height: 44,
                                            decoration: BoxDecoration(
                                              color: theme
                                                  .colorScheme.primaryContainer,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            child: Icon(
                                              Icons.account_balance_rounded,
                                              color: theme.colorScheme.primary,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  center.name,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                                if (center.code.trim().isNotEmpty) ...[
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    center.code,
                                                    style: theme
                                                        .textTheme.bodySmall,
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                          const Icon(
                                            Icons.chevron_left_rounded,
                                          ),
                                        ],
                                      ),
                                    ),
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
