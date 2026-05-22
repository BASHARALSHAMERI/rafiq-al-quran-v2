import 'package:hive_flutter/hive_flutter.dart';

import 'auth_local_datasource.dart';

class ContextLocalDataSource {
  final AuthLocalDataSource _authLocalDataSource;

  ContextLocalDataSource(this._authLocalDataSource);

  static const _boxName = 'app_cache';
  static const _centerIdKey = 'selected_center_id';
  static const _circleIdKey = 'selected_circle_id';
  static const _ownerUserIdKey = 'selected_context_user_id';

  Future<Box<dynamic>> _box() async {
    if (Hive.isBoxOpen(_boxName)) {
      return Hive.box<dynamic>(_boxName);
    }
    return Hive.openBox<dynamic>(_boxName);
  }

  Future<void> saveSelectedCenter(String centerId) async {
    final box = await _box();
    final activeUserId = await _currentUserId();
    if (activeUserId == null) {
      await _clearBox(box);
      return;
    }

    await _syncScope(box, activeUserId);
    await box.put(_centerIdKey, centerId);
  }

  Future<void> saveSelectedCircle(String circleId) async {
    final box = await _box();
    final activeUserId = await _currentUserId();
    if (activeUserId == null) {
      await _clearBox(box);
      return;
    }

    await _syncScope(box, activeUserId);
    await box.put(_circleIdKey, circleId);
  }

  Future<String?> getSelectedCenter() async {
    final box = await _box();
    if (!await _isScopeActive(box)) {
      return null;
    }
    final value = box.get(_centerIdKey);
    return value is String && value.trim().isNotEmpty ? value : null;
  }

  Future<String?> getSelectedCircle() async {
    final box = await _box();
    if (!await _isScopeActive(box)) {
      return null;
    }
    final value = box.get(_circleIdKey);
    return value is String && value.trim().isNotEmpty ? value : null;
  }

  Future<void> clear() async {
    final box = await _box();
    await _clearBox(box);
  }

  Future<void> saveCurrentCenter(String centerId) =>
      saveSelectedCenter(centerId);

  Future<void> saveCurrentCircle(String circleId) =>
      saveSelectedCircle(circleId);

  Future<String?> getCurrentCenterId() => getSelectedCenter();

  Future<String?> getCurrentCircleId() => getSelectedCircle();

  Future<void> clearContext() => clear();

  Future<String?> _currentUserId() async {
    final value = (await _authLocalDataSource.getUserId())?.trim();
    if (value == null || value.isEmpty) {
      return null;
    }
    return value;
  }

  Future<bool> _isScopeActive(Box<dynamic> box) async {
    final activeUserId = await _currentUserId();
    final storedUserId = _normalize(box.get(_ownerUserIdKey));

    if (activeUserId == null) {
      if (storedUserId != null) {
        await _clearBox(box);
      }
      return false;
    }

    if (storedUserId == null) {
      return false;
    }

    if (storedUserId != activeUserId) {
      await _clearBox(box);
      return false;
    }

    return true;
  }

  Future<void> _syncScope(Box<dynamic> box, String activeUserId) async {
    final storedUserId = _normalize(box.get(_ownerUserIdKey));
    if (storedUserId != null && storedUserId != activeUserId) {
      await _clearBox(box);
    }
    await box.put(_ownerUserIdKey, activeUserId);
  }

  Future<void> _clearBox(Box<dynamic> box) async {
    await box.delete(_centerIdKey);
    await box.delete(_circleIdKey);
    await box.delete(_ownerUserIdKey);
  }

  String? _normalize(dynamic value) {
    final text = value?.toString().trim();
    if (text == null || text.isEmpty) {
      return null;
    }
    return text;
  }
}
