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
    final primary = Theme.of(context).colorScheme.primary;
    final isDark = context.isDark;

    return Scaffold(
      backgroundColor: context.surfaceColor,
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
        loading: () => Center(child: CircularProgressIndicator(color: primary)),
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
            color: primary,
            onRefresh: () => ref
                .read(notificationControllerProvider.notifier)
                .loadNotifications(),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: context.borderColor),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                final typeColor = _getColorForType(context, notification.type);

                return InkWell(
                  onTap: () => _openNotification(notification),
                  child: Container(
                    color: notification.isRead
                        ? Colors.transparent
                        : primary.withValues(alpha: isDark ? 0.12 : 0.05),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          backgroundColor: typeColor.withValues(alpha: isDark ? 0.20 : 0.10),
                          child: Icon(
                            _getIconForType(notification.type),
                            color: typeColor,
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
                                            ? FontWeight.w600
                                            : FontWeight.w900,
                                        color: context.textPrimaryColor,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    DateFormat('d MMM', 'ar')
                                        .format(notification.createdAt),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: context.textSecondaryColor,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: AppSpacing.xs),
                              Text(
                                notification.message,
                                style: TextStyle(
                                  color: context.textSecondaryColor,
                                  fontSize: 13,
                                ),
                              ),
                              if (unreadCount > 0 && index == 0)
                                Padding(
                                  padding:
                                      const EdgeInsets.only(top: AppSpacing.xs),
                                  child: Text(
                                    'غير المقروء: $unreadCount',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: primary,
                                      fontWeight: FontWeight.w700,
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

  Color _getColorForType(BuildContext context, String type) {
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;

    switch (type) {
      case 'EXAM_PUBLISHED':
        return primary;
      case 'EXAM_SCORED':
        return custom.success;
      case 'GOLDEN_RECORD_NOMINATION_APPROVED':
        return custom.warning;
      default:
        return custom.accent;
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'EXAM_PUBLISHED':
        return Icons.quiz_outlined;
      case 'EXAM_SCORED':
        return Icons.grade_outlined;
      case 'GOLDEN_RECORD_NOMINATION_APPROVED':
        return Icons.star_outline_rounded;
      default:
        return Icons.notifications_outlined;
    }
  }
}
