import 'package:dio/dio.dart';

import '../models/notification_dtos.dart';

abstract class NotificationRemoteDataSource {
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

class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  final Dio dio;

  NotificationRemoteDataSourceImpl({required this.dio});

  @override
  Future<List<NotificationDto>> getNotifications({
    bool? isRead,
    String? type,
    int limit = 50,
    int offset = 0,
  }) async {
    final safeLimit = limit <= 0 ? 50 : limit;
    final query = <String, dynamic>{
      'page': (offset ~/ safeLimit) + 1,
      'pageSize': safeLimit,
    };

    if (isRead != null) {
      query['isRead'] = isRead;
    }
    if (type != null && type.isNotEmpty) {
      query['type'] = type;
    }

    final response = await dio.get('/notifications', queryParameters: query);
    final items = _extractNotificationItems(response.data);
    return items.map(NotificationDto.fromJson).toList(growable: false);
  }

  @override
  Future<int> getUnreadCount() async {
    final data = _extractData(
      (await dio.get('/notifications/unread-count')).data,
    );
    final unreadCount = data['count'] ?? data['unreadCount'] ?? 0;
    return UnreadCountDto.fromJson({'count': unreadCount}).count;
  }

  @override
  Future<void> markRead(int id) async {
    await dio.patch('/notifications/$id/read');
  }

  @override
  Future<void> markAllRead() async {
    await dio.patch('/notifications/read-all');
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      return responseData;
    }

    return <String, dynamic>{};
  }

  List<Map<String, dynamic>> _extractNotificationItems(dynamic responseData) {
    final data = _extractData(responseData);
    final list = data['data'] ?? data['items'] ?? responseData;

    if (list is! List) {
      return const [];
    }

    return list
        .whereType<Map<String, dynamic>>()
        .map(_normalizeNotification)
        .toList(growable: false);
  }

  Map<String, dynamic> _normalizeNotification(Map<String, dynamic> raw) {
    return {
      'id': raw['id'],
      'type': raw['type'] ?? 'SYSTEM',
      'title': raw['title'] ?? '',
      'message': raw['message'] ?? raw['body'] ?? '',
      'isRead': raw['isRead'] ?? false,
      'userId': raw['userId'] ?? raw['recipientUserId'] ?? 0,
      'metadata': raw['metadata'] ?? raw['payload'],
      'createdAt': raw['createdAt'],
      'updatedAt': raw['updatedAt'] ?? raw['readAt'] ?? raw['createdAt'],
    };
  }
}
