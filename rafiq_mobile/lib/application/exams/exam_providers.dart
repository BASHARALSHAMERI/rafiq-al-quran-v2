import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/exam_remote_datasource.dart';
import '../../data/models/exam_dtos.dart';
import '../../data/repositories_impl/exam_repository_impl.dart';
import '../../domain/repositories/exam_repository.dart';

final examRemoteDataSourceProvider = Provider<ExamRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ExamRemoteDataSourceImpl(dio: dio);
});

final examRepositoryProvider = Provider<ExamRepository>((ref) {
  final remoteDataSource = ref.watch(examRemoteDataSourceProvider);
  return ExamRepositoryImpl(remoteDataSource: remoteDataSource);
});

final availableExamsProvider =
    FutureProvider.family<List<ExamDto>, int?>((ref, circleId) async {
  final repo = ref.watch(examRepositoryProvider);
  return repo.getExams(circleId: circleId, status: 'PUBLISHED');
});
