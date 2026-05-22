import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../application/auth/auth_controller.dart';
import '../../application/notifications/notification_controller.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/notification_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/premium_app_bar.dart';
import 'notification_navigation.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () =>
          ref.read(notificationControllerProvider.notifier).loadNotifications(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationControllerProvider);

    return Scaffold(
      appBar: PremiumAppBar(
        title: 'الإشعارات',
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded),
            tooltip: 'تحديد الكل كمقروء',
            onPressed: () {
              ref.read(notificationControllerProvider.notifier).markAllAsRead();
            },
          ),
        ],
      ),
      body: state.when(
        initial: () => const SizedBox.shrink(),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (message) => AppEmptyState(
          title: 'تعذر تحميل الإشعارات',
          subtitle: message,
          icon: Icons.error_outline_rounded,
          actionLabel: 'إعادة المحاولة',
          onAction: () => ref
              .read(notificationControllerProvider.notifier)
              .loadNotifications(),
        ),
        loaded: (notifications, unreadCount) {
          if (notifications.isEmpty) {
            return const AppEmptyState(
              title: 'لا توجد إشعارات',
              subtitle: 'أنت على اطلاع بآخر التحديثات.',
              icon: Icons.notifications_none_rounded,
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref
                .read(notificationControllerProvider.notifier)
                .loadNotifications(),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return InkWell(
                  onTap: () => _openNotification(notification),
                  child: Container(
                    color: notification.isRead
                        ? Colors.transparent
                        : AppColors.primaryLight.withValues(alpha: 0.05),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          backgroundColor: _getColorForType(notification.type)
                              .withValues(alpha: 0.1),
                          child: Icon(
                            _getIconForType(notification.type),
                            color: _getColorForType(notification.type),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      notification.title,
                                      style: TextStyle(
                                        fontWeight: notification.isRead
                                            ? FontWeight.normal
                                            : FontWeight.bold,
                                        color: AppColors.textPrimaryLight,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    DateFormat('d MMM', 'ar')
                                        .format(notification.createdAt),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: AppSpacing.xs),
                              Text(
                                notification.message,
                                style: const TextStyle(
                                  color: AppColors.textSecondaryLight,
                                ),
                              ),
                              if (unreadCount > 0 && index == 0)
                                Padding(
                                  padding:
                                      const EdgeInsets.only(top: AppSpacing.xs),
                                  child: Text(
                                    'غير المقروء: $unreadCount',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondaryLight,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _openNotification(NotificationDto notification) async {
    if (!notification.isRead) {
      await ref
          .read(notificationControllerProvider.notifier)
          .markAsRead(notification.id);
    }
    if (!mounted) {
      return;
    }

    final currentUserRole = ref.read(authControllerProvider).user?.role;
    final route = resolveNotificationPrimaryRoute(
      notification,
      currentUserRole: currentUserRole,
    );
    if (route != null) {
      context.push(route);
      return;
    }

    context.push(
      RouteNames.notificationDetails(notification.id),
      extra: notification,
    );
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'EXAM_PUBLISHED':
        return AppColors.primaryLight;
      case 'EXAM_SCORED':
        return AppColors.successLight;
      case 'GOLDEN_RECORD_NOMINATION_APPROVED':
        return AppColors.warningLight;
      default:
        return AppColors.secondaryLight;
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'EXAM_PUBLISHED':
        return Icons.fact_check_outlined;
      case 'EXAM_SCORED':
        return Icons.grading_rounded;
      case 'GOLDEN_RECORD_NOMINATION_APPROVED':
        return Icons.verified_outlined;
      default:
        return Icons.notifications_rounded;
    }
  }
}
