import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/context/context_controller.dart';
import '../../application/context/context_state.dart';
import '../../core/router/route_names.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/standard_app_bar.dart';

class CircleSelectionScreen extends ConsumerStatefulWidget {
  const CircleSelectionScreen({super.key});

  @override
  ConsumerState<CircleSelectionScreen> createState() =>
      _CircleSelectionScreenState();
}

class _CircleSelectionScreenState extends ConsumerState<CircleSelectionScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(contextControllerProvider.notifier)
          .loadCirclesForSelectedCenter();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(contextControllerProvider);
    final theme = Theme.of(context);

    ref.listen<ContextState>(contextControllerProvider, (previous, next) {
      if (next.hasCompleteContext) {
        context.go(RouteNames.root);
      }
    });

    return Scaffold(
      appBar: StandardAppBar(
        title: 'اختيار الحلقة',
        onBackTap: () async {
          await ref.read(contextControllerProvider.notifier).clearContext();
          if (!context.mounted) {
            return;
          }
          context.go(RouteNames.selectCenter);
        },
      ),
      body: state.isLoading
          ? const PageStateView.loading(
              title: 'جارٍ تحميل الحلقات',
              message: 'يرجى الانتظار قليلًا.',
            )
          : state.error != null
              ? PageStateView.error(
                  title: 'تعذر تحميل الحلقات',
                  message: state.error!,
                  actionLabel: 'إعادة المحاولة',
                  onAction: () => ref
                      .read(contextControllerProvider.notifier)
                      .loadCirclesForSelectedCenter(),
                )
              : state.circles.isEmpty
                  ? const PageStateView.empty(
                      title: 'لا توجد حلقات متاحة',
                      message: 'لم يتم العثور على حلقات مرتبطة بهذا المركز.',
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.circles.length,
                      itemBuilder: (context, index) {
                        final circle = state.circles[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(14),
                            onTap: () => ref
                                .read(contextControllerProvider.notifier)
                                .selectCircle(circle.id),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color:
                                          theme.colorScheme.secondaryContainer,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.groups_rounded,
                                      color: theme.colorScheme.secondary,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      circle.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.chevron_left_rounded),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
