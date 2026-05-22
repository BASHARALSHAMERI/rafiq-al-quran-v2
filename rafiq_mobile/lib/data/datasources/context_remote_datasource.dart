import 'package:dio/dio.dart';

import '../models/context_dtos.dart';

class ContextRemoteDataSource {
  final Dio _dio;

  ContextRemoteDataSource(this._dio);

  Future<List<CenterDto>> getMyCenters() async {
    final centerResponse = await _tryGetList(endpoints: const ['/org/centers']);

    if (centerResponse != null) {
      return centerResponse
          .map(_toCenterDto)
          .where((item) => item.id.trim().isNotEmpty)
          .toList(growable: false);
    }

    final orgCirclesResponse =
        await _tryGetList(endpoints: const ['/org/circles']);
    if (orgCirclesResponse != null) {
      return _centersFromCircles(orgCirclesResponse);
    }

    final fallbackCenterResponse = await _tryGetList(
      endpoints: const [
        '/context/my-centers',
        '/users/me/centers',
      ],
    );
    if (fallbackCenterResponse != null) {
      return fallbackCenterResponse
          .map(_toCenterDto)
          .where((item) => item.id.trim().isNotEmpty)
          .toList(growable: false);
    }

    final circlesResponse = await _tryGetList(
      endpoints: const [
        '/context/my-circles',
        '/users/me/circles',
      ],
    );

    if (circlesResponse == null) {
      return const [];
    }

    return _centersFromCircles(circlesResponse);
  }

  Future<List<CircleDto>> getMyCircles(String centerId) async {
    final response = await _tryGetList(
      endpoints: const [
        '/org/circles',
        '/context/my-circles',
        '/users/me/circles',
      ],
      queryParameters: {'centerId': centerId},
    );

    if (response == null) {
      return const [];
    }

    return response
        .map(_toCircleDto)
        .where((item) =>
            item.id.trim().isNotEmpty && item.centerId.trim().isNotEmpty)
        .toList(growable: false);
  }

  List<CenterDto> _centersFromCircles(
      List<Map<String, dynamic>> circlesResponse) {
    final centersById = <String, CenterDto>{};
    for (final item in circlesResponse) {
      final centerMap = _extractCenterMap(item);
      final centerId = _stringValue(centerMap['id'] ?? item['centerId']);
      if (centerId.isEmpty) {
        continue;
      }

      final dto = CenterDto(
        id: centerId,
        name: _nonEmptyString(
          [
            centerMap['name'],
            centerMap['nameAr'],
            item['centerName'],
          ],
          fallback: 'مركز $centerId',
        ),
        domain: _nonEmptyString(
          [
            centerMap['code'],
            centerMap['domain'],
            item['domain'],
          ],
          fallback: '',
        ),
      );

      centersById[centerId] = dto;
    }
    return centersById.values.toList(growable: false);
  }

  Future<List<Map<String, dynamic>>?> _tryGetList({
    required List<String> endpoints,
    Map<String, dynamic>? queryParameters,
  }) async {
    DioException? lastNetworkError;

    for (final endpoint in endpoints) {
      try {
        final res = await _dio.get(
          endpoint,
          queryParameters: queryParameters,
        );

        return _extractListData(res.data);
      } on DioException catch (error) {
        final status = error.response?.statusCode;
        if (status == 403 || status == 404) {
          continue;
        }
        if (error.type == DioExceptionType.connectionError ||
            error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.receiveTimeout ||
            error.type == DioExceptionType.sendTimeout) {
          lastNetworkError = error;
          break;
        }
      }
    }

    if (lastNetworkError != null) {
      throw lastNetworkError;
    }

    return null;
  }

  List<Map<String, dynamic>> _extractListData(dynamic responseData) {
    if (responseData is List) {
      return responseData
          .whereType<Map<String, dynamic>>()
          .toList(growable: false);
    }

    if (responseData is Map<String, dynamic>) {
      final payload = responseData['data'];
      if (payload is List) {
        return payload
            .whereType<Map<String, dynamic>>()
            .toList(growable: false);
      }
    }

    return const [];
  }

  CenterDto _toCenterDto(Map<String, dynamic> json) {
    return CenterDto(
      id: _stringValue(json['id']),
      name: _nonEmptyString(
        [
          json['name'],
          json['nameAr'],
        ],
        fallback: 'مركز',
      ),
      domain: _nonEmptyString(
        [
          json['domain'],
          json['code'],
        ],
        fallback: '',
      ),
    );
  }

  CircleDto _toCircleDto(Map<String, dynamic> json) {
    final centerMap = _extractCenterMap(json);
    return CircleDto(
      id: _stringValue(json['id']),
      name: _nonEmptyString(
        [
          json['name'],
          json['nameAr'],
        ],
        fallback: 'حلقة',
      ),
      centerId: _stringValue(centerMap['id'] ?? json['centerId']),
    );
  }

  Map<String, dynamic> _extractCenterMap(Map<String, dynamic> json) {
    final center = json['center'];
    if (center is Map<String, dynamic>) {
      return center;
    }
    return const <String, dynamic>{};
  }

  String _stringValue(dynamic value) {
    if (value == null) {
      return '';
    }
    return value.toString();
  }

  String _nonEmptyString(List<dynamic> values, {required String fallback}) {
    for (final value in values) {
      final text = value?.toString().trim() ?? '';
      if (text.isNotEmpty) {
        return text;
      }
    }
    return fallback;
  }
}
