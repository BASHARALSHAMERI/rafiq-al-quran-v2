import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../data/datasources/group_activities_remote_datasource.dart';
import '../../data/repositories_impl/group_activities_repository_impl.dart';
import '../../domain/repositories/group_activities_repository.dart';

final groupActivitiesRemoteDataSourceProvider =
    Provider<GroupActivitiesRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return GroupActivitiesRemoteDataSourceImpl(dio: dio);
});

final groupActivitiesRepositoryProvider =
    Provider<GroupActivitiesRepository>((ref) {
  final remoteDataSource = ref.watch(groupActivitiesRemoteDataSourceProvider);
  return GroupActivitiesRepositoryImpl(remoteDataSource: remoteDataSource);
});
