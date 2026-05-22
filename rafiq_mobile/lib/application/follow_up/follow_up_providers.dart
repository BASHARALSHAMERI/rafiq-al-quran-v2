import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/follow_up_remote_datasource.dart';
import '../../data/repositories_impl/follow_up_repository_impl.dart';
import '../../domain/entities/student_profile.dart';
import '../../domain/repositories/follow_up_repository.dart';

final followUpRemoteDataSourceProvider =
    Provider<FollowUpRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return FollowUpRemoteDataSourceImpl(dio: dio);
});

final followUpRepositoryProvider = Provider<FollowUpRepository>((ref) {
  final remoteDataSource = ref.watch(followUpRemoteDataSourceProvider);
  return FollowUpRepositoryImpl(remoteDataSource: remoteDataSource);
});

final studentProfileProvider =
    FutureProvider.family<StudentProfile, int>((ref, studentId) async {
  final repository = ref.watch(followUpRepositoryProvider);
  return repository.getStudentProfile(studentId);
});
