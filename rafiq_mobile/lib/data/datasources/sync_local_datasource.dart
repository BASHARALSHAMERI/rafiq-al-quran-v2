import 'dart:convert';

import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

class PendingMutationRow {
  final String mutationId;
  final String entity;
  final String method;
  final String endpoint;
  final Map<String, dynamic> payload;
  final int? baseVersion;
  final String idempotencyKey;
  final String status;
  final int attemptCount;
  final DateTime? nextRetryAt;
  final DateTime createdAt;

  const PendingMutationRow({
    required this.mutationId,
    required this.entity,
    required this.method,
    required this.endpoint,
    required this.payload,
    required this.baseVersion,
    required this.idempotencyKey,
    required this.status,
    required this.attemptCount,
    required this.nextRetryAt,
    required this.createdAt,
  });
}

class SyncLocalDataSource {
  static const _dbName = 'rafiq_offline_sync.db';
  static const _dbVersion = 1;

  Database? _db;

  Future<Database> _database() async {
    if (_db != null) {
      return _db!;
    }

    final basePath = await getDatabasesPath();
    final dbPath = p.join(basePath, _dbName);

    _db = await openDatabase(
      dbPath,
      version: _dbVersion,
      onCreate: (db, version) async {
        await db.execute('''
CREATE TABLE pending_mutations (
  mutation_id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  payload TEXT NOT NULL,
  base_version INTEGER NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT NULL,
  created_at TEXT NOT NULL
)
''');

        await db.execute('''
CREATE INDEX idx_pending_mutations_status_created
ON pending_mutations(status, created_at)
''');

        await db.execute('''
CREATE INDEX idx_pending_mutations_next_retry
ON pending_mutations(next_retry_at)
''');

        await db.execute('''
CREATE TABLE attendance_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_key TEXT NOT NULL UNIQUE,
  circle_id TEXT NOT NULL,
  attendance_date TEXT NOT NULL,
  payload TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
)
''');

        await db.execute('''
CREATE TABLE followup_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_key TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL,
  circle_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
)
''');

        await db.execute('''
CREATE TABLE sync_conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mutation_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  server_snapshot TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
)
''');

        await db.execute('''
CREATE TABLE kpi_cache (
  cache_key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
''');
      },
    );

    return _db!;
  }

  Future<void> enqueuePendingMutation({
    required String mutationId,
    required String entity,
    required String method,
    required String endpoint,
    required Map<String, dynamic> payload,
    int? baseVersion,
    required String idempotencyKey,
  }) async {
    final db = await _database();
    await db.insert(
      'pending_mutations',
      {
        'mutation_id': mutationId,
        'entity': entity,
        'method': method.toUpperCase(),
        'endpoint': endpoint,
        'payload': jsonEncode(payload),
        'base_version': baseVersion,
        'idempotency_key': idempotencyKey,
        'status': 'pending',
        'attempt_count': 0,
        'next_retry_at': null,
        'created_at': DateTime.now().toUtc().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<PendingMutationRow>> listReadyPendingMutations(
      {int limit = 50}) async {
    final db = await _database();
    final now = DateTime.now().toUtc().toIso8601String();

    final rows = await db.query(
      'pending_mutations',
      where: '''
status IN ('pending','retrying')
AND (next_retry_at IS NULL OR next_retry_at <= ?)
''',
      whereArgs: [now],
      orderBy: 'created_at ASC',
      limit: limit,
    );

    return rows.map(_toPendingMutationRow).toList(growable: false);
  }

  Future<void> markMutationSynced(String mutationId) async {
    final db = await _database();
    await db.delete(
      'pending_mutations',
      where: 'mutation_id = ?',
      whereArgs: [mutationId],
    );
  }

  Future<void> markMutationFailed(String mutationId) async {
    final db = await _database();
    await db.update(
      'pending_mutations',
      {
        'status': 'failed',
        'next_retry_at': null,
      },
      where: 'mutation_id = ?',
      whereArgs: [mutationId],
    );
  }

  Future<void> scheduleMutationRetry({
    required String mutationId,
    required int attemptCount,
    required DateTime nextRetryAt,
  }) async {
    final db = await _database();
    await db.update(
      'pending_mutations',
      {
        'status': 'retrying',
        'attempt_count': attemptCount,
        'next_retry_at': nextRetryAt.toUtc().toIso8601String(),
      },
      where: 'mutation_id = ?',
      whereArgs: [mutationId],
    );
  }

  Future<void> insertConflict({
    required String mutationId,
    required String endpoint,
    required String reason,
    Map<String, dynamic>? serverSnapshot,
  }) async {
    final db = await _database();
    await db.insert(
      'sync_conflicts',
      {
        'mutation_id': mutationId,
        'endpoint': endpoint,
        'server_snapshot':
            serverSnapshot == null ? null : jsonEncode(serverSnapshot),
        'reason': reason,
        'created_at': DateTime.now().toUtc().toIso8601String(),
      },
    );
  }

  Future<void> upsertKpiCache({
    required String key,
    required Map<String, dynamic> value,
  }) async {
    final db = await _database();
    await db.insert(
      'kpi_cache',
      {
        'cache_key': key,
        'value': jsonEncode(value),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  PendingMutationRow _toPendingMutationRow(Map<String, Object?> row) {
    final rawPayload = row['payload'];
    final payload = rawPayload is String
        ? jsonDecode(rawPayload)
        : const <String, dynamic>{};

    return PendingMutationRow(
      mutationId: row['mutation_id']?.toString() ?? '',
      entity: row['entity']?.toString() ?? '',
      method: row['method']?.toString().toUpperCase() ?? 'POST',
      endpoint: row['endpoint']?.toString() ?? '',
      payload:
          payload is Map<String, dynamic> ? payload : const <String, dynamic>{},
      baseVersion:
          row['base_version'] is int ? row['base_version'] as int : null,
      idempotencyKey: row['idempotency_key']?.toString() ?? '',
      status: row['status']?.toString() ?? 'pending',
      attemptCount:
          row['attempt_count'] is int ? row['attempt_count'] as int : 0,
      nextRetryAt: DateTime.tryParse(row['next_retry_at']?.toString() ?? ''),
      createdAt: DateTime.tryParse(row['created_at']?.toString() ?? '') ??
          DateTime.now().toUtc(),
    );
  }
}
