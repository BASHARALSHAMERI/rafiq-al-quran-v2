import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SyncQueueService extends Notifier<void> {
  static const String _boxName = 'sync_queue_box';
  
  @override
  void build() {
    // Initialization is handled by Hive.initFlutter() in main or during first call
  }

  /// Adds a request to the local queue to be synced later.
  Future<void> addToQueue({
    required String path,
    required String method,
    dynamic data,
    Map<String, dynamic>? queryParameters,
    String? description,
  }) async {
    if (!Hive.isBoxOpen(_boxName)) {
      await Hive.openBox(_boxName);
    }
    
    final box = Hive.box(_boxName);
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    
    final item = {
      'id': id,
      'path': path,
      'method': method,
      'data': data is Map || data is List ? jsonEncode(data) : data,
      'queryParameters': queryParameters,
      'timestamp': DateTime.now().toIso8601String(),
      'description': description ?? 'عملية غير متصلة',
    };

    await box.put(id, item);
    debugPrint('Added to Sync Queue: $path ($description)');
  }

  /// Attempts to process the pending items in the queue.
  Future<void> processQueue(Dio dio) async {
    if (!Hive.isBoxOpen(_boxName)) {
      await Hive.openBox(_boxName);
    }
    
    final box = Hive.box(_boxName);
    if (box.isEmpty) return;

    final keys = List<String>.from(box.keys);
    debugPrint('Processing Sync Queue: ${keys.length} items found.');

    for (final key in keys) {
      final item = Map<String, dynamic>.from(box.get(key));
      try {
        final response = await dio.request(
          item['path'],
          data: item['data'] != null && item['data'] is String 
              ? jsonDecode(item['data']) 
              : item['data'],
          queryParameters: item['queryParameters'],
          options: Options(method: item['method']),
        );

        if (response.statusCode != null && response.statusCode! < 300) {
          await box.delete(key);
          debugPrint('Synced successfully: ${item['path']}');
        }
      } catch (e) {
        debugPrint('Sync failed for ${item['path']}: $e. Will retry later.');
        break; 
      }
    }
  }

  int get pendingCount {
    if (!Hive.isBoxOpen(_boxName)) return 0;
    return Hive.box(_boxName).length;
  }
}

/// Manual provider to avoid code generation issues in IDE
final syncQueueServiceProvider = NotifierProvider<SyncQueueService, void>(() {
  return SyncQueueService();
});
