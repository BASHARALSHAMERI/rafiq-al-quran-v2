import 'package:dio/dio.dart';

import '../../domain/entities/student_profile.dart';
import '../models/follow_up_dtos.dart';

abstract class FollowUpRemoteDataSource {
  Future<StudentProfile> getStudentProfile(int studentId);
  Future<List<FollowUpRecordDto>> getFollowUps(ListFollowUpsRequestDto request);
  Future<FollowUpRecordDto> createFollowUp(CreateFollowUpRequestDto request);
  Future<FollowUpRecordDto> updateFollowUp(
      int followUpId, UpdateFollowUpRequestDto request);
  Future<FollowUpRecordDto> finalizeFollowUp(int followUpId);
}

class FollowUpRemoteDataSourceImpl implements FollowUpRemoteDataSource {
  final Dio dio;

  FollowUpRemoteDataSourceImpl({required this.dio});

  @override
  Future<StudentProfile> getStudentProfile(int studentId) async {
    final response = await dio.get('/users/$studentId/student-profile');
    if (response.statusCode == 200) {
      return StudentProfile.fromJson(_extractData(response.data));
    } else {
      throw Exception('Failed to load student profile: ${response.statusCode}');
    }
  }

  @override
  Future<List<FollowUpRecordDto>> getFollowUps(
      ListFollowUpsRequestDto request) async {
    final Map<String, dynamic> query = {};
    if (request.centerId != null) query['centerId'] = request.centerId;
    if (request.circleId != null) query['circleId'] = request.circleId;
    if (request.studentId != null) query['studentId'] = request.studentId;
    if (request.from != null) query['from'] = request.from;
    if (request.to != null) query['to'] = request.to;
    if (request.status != null) query['status'] = request.status;
    if (request.page != null) query['page'] = request.page;
    if (request.pageSize != null) query['pageSize'] = request.pageSize;

    final response = await dio.get('/follow-ups', queryParameters: query);
    final data = _extractList(response.data);
    return data
        .map((e) => FollowUpRecordDto.fromJson(e))
        .toList(growable: false);
  }

  @override
  Future<FollowUpRecordDto> createFollowUp(
      CreateFollowUpRequestDto request) async {
    final response = await dio.post('/follow-ups', data: request.toJson());
    return FollowUpRecordDto.fromJson(_extractData(response.data));
  }

  @override
  Future<FollowUpRecordDto> updateFollowUp(
      int followUpId, UpdateFollowUpRequestDto request) async {
    final response = await dio.patch(
      '/follow-ups/$followUpId',
      data: request.toJson(),
    );
    return FollowUpRecordDto.fromJson(_extractData(response.data));
  }

  @override
  Future<FollowUpRecordDto> finalizeFollowUp(int followUpId) async {
    final response = await dio.patch('/follow-ups/$followUpId/finalize');
    return FollowUpRecordDto.fromJson(_extractData(response.data));
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic>) {
        return data;
      }
      return responseData;
    }
    return <String, dynamic>{};
  }

  List<Map<String, dynamic>> _extractList(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is List) {
        return data.whereType<Map<String, dynamic>>().toList(growable: false);
      }
      if (data is Map<String, dynamic>) {
        if (data.containsKey('data') && data['data'] is List) {
          return (data['data'] as List)
              .whereType<Map<String, dynamic>>()
              .toList(growable: false);
        }
        if (data.containsKey('items') && data['items'] is List) {
          return (data['items'] as List)
              .whereType<Map<String, dynamic>>()
              .toList(growable: false);
        }
      }
    } else if (responseData is List) {
      return responseData
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }
    return const [];
  }
}
