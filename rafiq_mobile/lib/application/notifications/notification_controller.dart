import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../data/models/notification_dtos.dart';
import '../../domain/repositories/notification_repository.dart';
import 'notification_providers.dart';

part 'notification_controller.freezed.dart';

@freezed
class NotificationState with _$NotificationState {
  const factory NotificationState.initial() = _Initial;
  const factory NotificationState.loading() = _Loading;
  const factory NotificationState.loaded({
    @Default([]) List<NotificationDto> notifications,
    @Default(0) int unreadCount,
  }) = _Loaded;
  const factory NotificationState.error(String message) = _Error;
}

class NotificationController extends StateNotifier<NotificationState> {
  final NotificationRepository _repository;

  NotificationController(this._repository)
      : super(const NotificationState.initial());

  Future<void> loadNotifications({bool? isRead, String? type}) async {
    // Keep existing data if refreshing, else show loading
    final currentNotifications = state.maybeWhen(
      loaded: (items, _) => items,
      orElse: () => <NotificationDto>[],
    );
    if (currentNotifications.isEmpty) {
      state = const NotificationState.loading();
    }

    try {
      final notifications = await _repository.getNotifications(
        isRead: isRead,
        type: type,
      );
      final unreadCount = await _repository.getUnreadCount();

      state = NotificationState.loaded(
        notifications: notifications,
        unreadCount: unreadCount,
      );
    } catch (e) {
      state = NotificationState.error(e.toString());
    }
  }

  Future<void> refreshUnreadCount() async {
    try {
      final unreadCount = await _repository.getUnreadCount();
      state.maybeMap(
        loaded: (loadedState) {
          state = loadedState.copyWith(unreadCount: unreadCount);
        },
        orElse: () {}, // Do nothing if not loaded
      );
    } catch (_) {
      // Background fail silently
    }
  }

  Future<void> markAsRead(int id) async {
    try {
      await _repository.markRead(id);
      // Optimistically update UI
      state.maybeMap(
        loaded: (loadedState) {
          final updatedNotifications = loadedState.notifications.map((n) {
            return n.id == id ? n.copyWith(isRead: true) : n;
          }).toList();

          state = loadedState.copyWith(
            notifications: updatedNotifications,
            unreadCount: (loadedState.unreadCount - 1).clamp(0, 999),
          );
        },
        orElse: () {},
      );
    } catch (e) {
      // Revert optimism if failed? For now just log or ignore
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _repository.markAllRead();
      state.maybeMap(
        loaded: (loadedState) {
          final updatedNotifications = loadedState.notifications.map((n) {
            return n.copyWith(isRead: true);
          }).toList();

          state = loadedState.copyWith(
            notifications: updatedNotifications,
            unreadCount: 0,
          );
        },
        orElse: () {},
      );
    } catch (e) {
      // Ignore
    }
  }
}

final notificationControllerProvider =
    StateNotifierProvider<NotificationController, NotificationState>((ref) {
  final repository = ref.watch(notificationRepositoryProvider);
  return NotificationController(repository);
});
