import '../../data/models/group_activity_dtos.dart';

abstract class GroupActivitiesRepository {
  Future<GroupActivityDto> createGroupActivity(
      CreateGroupActivityRequestDto request);
}
