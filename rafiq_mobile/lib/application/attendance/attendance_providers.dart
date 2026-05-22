import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/attendance_local_datasource.dart';
import '../../data/datasources/attendance_remote_datasource.dart';
import '../../data/repositories_impl/attendance_repository_impl.dart';
import '../../domain/repositories/attendance_repository.dart';
import '../auth/auth_providers.dart';

final attendanceLocalDataSourceProvider = Provider((ref) {
  return AttendanceLocalDataSource();
});

final attendanceRemoteDataSourceProvider = Provider((ref) {
  return AttendanceRemoteDataSource(ref.watch(dioProvider));
});

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepositoryImpl(
    ref.watch(attendanceRemoteDataSourceProvider),
    ref.watch(attendanceLocalDataSourceProvider),
  );
});
