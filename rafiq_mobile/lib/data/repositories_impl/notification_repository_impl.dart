import '../../domain/repositories/notification_repository.dart';
import '../datasources/notification_remote_datasource.dart';
import '../models/notification_dtos.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationRemoteDataSource remoteDataSource;

  NotificationRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<NotificationDto>> getNotifications({
    bool? isRead,
    String? type,
    int limit = 50,
    int offset = 0,
  }) async {
    return await remoteDataSource.getNotifications(
      isRead: isRead,
      type: type,
      limit: limit,
      offset: offset,
    );
  }

  @override
  Future<int> getUnreadCount() async {
    return await remoteDataSource.getUnreadCount();
  }

  @override
  Future<void> markRead(int id) async {
    await remoteDataSource.markRead(id);
  }

  @override
  Future<void> markAllRead() async {
    await remoteDataSource.markAllRead();
  }
}
