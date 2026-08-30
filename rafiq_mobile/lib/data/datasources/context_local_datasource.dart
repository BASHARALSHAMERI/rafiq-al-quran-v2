import 'package:hive_flutter/hive_flutter.dart';

import 'auth_local_datasource.dart';
import '../models/context_dtos.dart';

class ContextLocalDataSource {
  final AuthLocalDataSource _authLocalDataSource;

  ContextLocalDataSource(this._authLocalDataSource);

  static const _boxName = 'app_cache';
  static const _centerIdKey = 'selected_center_id';
  static const _circleIdKey = 'selected_circle_id';
  static const _ownerUserIdKey = 'selected_context_user_id';
  static const _centersKey = 'cached_centers';
  static const _circlesKey = 'cached_circles';

  Future<Box<dynamic>> _box() async {
    if (Hive.isBoxOpen(_boxName)) {
      return Hive.box<dynamic>(_boxName);
    }
    return Hive.openBox<dynamic>(_boxName);
  }

  Future<void> saveSelectedCenter(int centerId) async {
    final box = await _box();
    final activeUserId = await _currentUserId();
    if (activeUserId == null) {
      await _clearBox(box);
      return;
    }

    await _syncScope(box, activeUserId);
    await box.put(_centerIdKey, centerId);
  }

  Future<void> saveSelectedCircle(int circleId) async {
    final box = await _box();
    final activeUserId = await _currentUserId();
    if (activeUserId == null) {
      await _clearBox(box);
      return;
    }

    await _syncScope(box, activeUserId);
    await box.put(_circleIdKey, circleId);
  }

  Future<int?> getSelectedCenter() async {
    final box = await _box();
    if (!await _isScopeActive(box)) {
      return null;
    }
    final value = box.get(_centerIdKey);
    if (value is int) return value;
    if (value is String && value.trim().isNotEmpty) {
      return int.tryParse(value);
    }
    return null;
  }

  Future<int?> getSelectedCircle() async {
    final box = await _box();
    if (!await _isScopeActive(box)) {
      return null;
    }
    final value = box.get(_circleIdKey);
    if (value is int) return value;
    if (value is String && value.trim().isNotEmpty) {
      return int.tryParse(value);
    }
    return null;
  }

  Future<void> clear() async {
    final box = await _box();
    await _clearBox(box);
  }

  Future<void> saveCenters(List<CenterDto> centers) async {
    final box = await _box();
    final activeUserId = await _currentUserId();
    if (activeUserId == null) return;
    await _syncScope(box, activeUserId);
    
    final jsonList = centers.map((c) => c.toJson()).toList();
    await box.put(_centersKey, jsonList);
  }

  Future<void> saveCircles(List<CircleDto> circles) async {
    final box = await _box();
    final activeUserId = await _currentUserId();
    if (activeUserId == null) return;
    await _syncScope(box, activeUserId);

    final jsonList = circles.map((c) => c.toJson()).toList();
    await box.put(_circlesKey, jsonList);
  }

  Future<List<CenterDto>?> getCachedCenters() async {
    final box = await _box();
    if (!await _isScopeActive(box)) return null;

    final data = box.get(_centersKey);
    if (data is List) {
      try {
        return data
            .map((e) => CenterDto.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  Future<List<CircleDto>?> getCachedCircles() async {
    final box = await _box();
    if (!await _isScopeActive(box)) return null;

    final data = box.get(_circlesKey);
    if (data is List) {
      try {
        return data
            .map((e) => CircleDto.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  Future<void> saveCurrentCenter(int centerId) =>
      saveSelectedCenter(centerId);

  Future<void> saveCurrentCircle(int circleId) =>
      saveSelectedCircle(circleId);

  Future<int?> getCurrentCenterId() => getSelectedCenter();

  Future<int?> getCurrentCircleId() => getSelectedCircle();

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
    await box.delete(_centersKey);
    await box.delete(_circlesKey);
  }

  String? _normalize(dynamic value) {
    final text = value?.toString().trim();
    if (text == null || text.isEmpty) {
      return null;
    }
    return text;
  }
}
