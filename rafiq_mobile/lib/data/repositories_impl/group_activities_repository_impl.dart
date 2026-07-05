import '../../domain/repositories/group_activities_repository.dart';
import '../datasources/group_activities_remote_datasource.dart';
import '../models/group_activity_dtos.dart';

class GroupActivitiesRepositoryImpl implements GroupActivitiesRepository {
  final GroupActivitiesRemoteDataSource remoteDataSource;

  GroupActivitiesRepositoryImpl({required this.remoteDataSource});

  @override
  Future<GroupActivityDto> createGroupActivity(
      CreateGroupActivityRequestDto request) async {
    return remoteDataSource.createGroupActivity(request);
  }
}
