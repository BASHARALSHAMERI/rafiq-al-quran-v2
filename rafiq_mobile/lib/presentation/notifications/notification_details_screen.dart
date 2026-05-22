import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/notifications/notification_controller.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/notification_dtos.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/standard_app_bar.dart';

class NotificationDetailsScreen extends ConsumerWidget {
  final int? notificationId;
  final NotificationDto? initialNotification;

  const NotificationDetailsScreen({
    super.key,
    this.notificationId,
    this.initialNotification,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notification = initialNotification ?? _findNotification(ref);

    return Scaffold(
      appBar: const StandardAppBar(title: 'تفاصيل الإشعار'),
      body: notification == null
          ? const AppEmptyState(
              title: 'تعذر فتح الإشعار',
              subtitle:
                  'لم نتمكن من العثور على بيانات هذا الإشعار داخل الجلسة الحالية.',
              icon: Icons.notifications_off_outlined,
            )
          : ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        notification.message,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              height: 1.7,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  NotificationDto? _findNotification(WidgetRef ref) {
    final state = ref.read(notificationControllerProvider);
    return state.maybeWhen(
      loaded: (notifications, _) {
        if (notificationId == null) {
          return null;
        }
        for (final notification in notifications) {
          if (notification.id == notificationId) {
            return notification;
          }
        }
        return null;
      },
      orElse: () => null,
    );
  }
}
