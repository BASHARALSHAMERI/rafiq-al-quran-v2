import 'package:dio/dio.dart';

import '../models/group_activity_dtos.dart';

abstract class GroupActivitiesRemoteDataSource {
  Future<GroupActivityDto> createGroupActivity(
      CreateGroupActivityRequestDto request);
}

class GroupActivitiesRemoteDataSourceImpl
    implements GroupActivitiesRemoteDataSource {
  final Dio dio;

  GroupActivitiesRemoteDataSourceImpl({required this.dio});

  @override
  Future<GroupActivityDto> createGroupActivity(
      CreateGroupActivityRequestDto request) async {
    final response =
        await dio.post('/group-activities', data: request.toJson());
    final data = response.data;
    if (data is Map<String, dynamic> && data['data'] != null) {
      return GroupActivityDto.fromJson(data['data'] as Map<String, dynamic>);
    }
    return GroupActivityDto.fromJson(data as Map<String, dynamic>);
  }
}
