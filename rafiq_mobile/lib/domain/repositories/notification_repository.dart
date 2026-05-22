import '../../data/models/notification_dtos.dart';

abstract class NotificationRepository {
  Future<List<NotificationDto>> getNotifications({
    bool? isRead,
    String? type,
    int limit = 50,
    int offset = 0,
  });

  Future<int> getUnreadCount();

  Future<void> markRead(int id);

  Future<void> markAllRead();
}
