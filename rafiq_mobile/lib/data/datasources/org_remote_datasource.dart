import 'package:dio/dio.dart';

import '../models/org_dtos.dart';

abstract class OrgRemoteDataSource {
  Future<List<OrgCircleDto>> listCircles({int? centerId});
}

class OrgRemoteDataSourceImpl implements OrgRemoteDataSource {
  final Dio dio;

  OrgRemoteDataSourceImpl({required this.dio});

  @override
  Future<List<OrgCircleDto>> listCircles({int? centerId}) async {
    final response = await dio.get(
      '/org/circles',
      queryParameters: centerId == null ? null : {'centerId': centerId},
    );
    final data = _extractList(response.data);
    return data.map(OrgCircleDto.fromJson).toList(growable: false);
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
    }
    if (responseData is List) {
      return responseData
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }
    return const [];
  }
}
