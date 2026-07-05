import 'package:dio/dio.dart';
import 'package:json_annotation/json_annotation.dart';

import '../models/library_dtos.dart';

abstract class LibraryRemoteDataSource {
  Future<List<LibraryCategoryDto>> getCategories({int? centerId});

  Future<List<LibraryItemDto>> getItems({
    int? centerId,
    int? circleId,
    int? categoryId,
    String? q,
    String? type,
    int page = 1,
    int pageSize = 20,
  });

  Future<Response> downloadItem(int itemId);
}

class LibraryPayloadParsingException implements Exception {
  final String operation;
  final String message;
  final Object? cause;

  const LibraryPayloadParsingException({
    required this.operation,
    required this.message,
    this.cause,
  });

  @override
  String toString() {
    return 'LibraryPayloadParsingException(operation: $operation, message: $message, cause: $cause)';
  }
}

class LibraryRemoteDataSourceImpl implements LibraryRemoteDataSource {
  final Dio dio;

  LibraryRemoteDataSourceImpl({required this.dio});

  @override
  Future<List<LibraryCategoryDto>> getCategories({int? centerId}) async {
    final query = <String, dynamic>{};
    if (centerId != null) query['centerId'] = centerId;

    final response =
        await dio.get('/library/categories', queryParameters: query);
    final data = _extractList(
      response.data,
      operation: 'GET /library/categories',
    );
    return _parseList(
      data,
      operation: 'GET /library/categories',
      parser: LibraryCategoryDto.fromJson,
    );
  }

  @override
  Future<List<LibraryItemDto>> getItems({
    int? centerId,
    int? circleId,
    int? categoryId,
    String? q,
    String? type,
    int page = 1,
    int pageSize = 20,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (centerId != null) query['centerId'] = centerId;
    if (circleId != null) query['circleId'] = circleId;
    if (categoryId != null) query['categoryId'] = categoryId;
    if (q != null && q.isNotEmpty) query['q'] = q;
    if (type != null && type.isNotEmpty) query['type'] = type;

    final response = await dio.get('/library/items', queryParameters: query);
    final data = _extractList(
      response.data,
      operation: 'GET /library/items',
    );
    return _parseList(
      data,
      operation: 'GET /library/items',
      parser: LibraryItemDto.fromJson,
    );
  }

  @override
  Future<Response> downloadItem(int itemId) async {
    // Return the raw response (bytes/Stream) for the repository to process or pass to UI
    return dio.get(
      '/library/items/$itemId/download',
      options: Options(responseType: ResponseType.bytes),
    );
  }

  List<T> _parseList<T>(
    List<Map<String, dynamic>> data, {
    required String operation,
    required T Function(Map<String, dynamic>) parser,
  }) {
    try {
      return data.map(parser).toList(growable: false);
    } on CheckedFromJsonException catch (error) {
      throw LibraryPayloadParsingException(
        operation: operation,
        message: 'JSON payload is missing required fields',
        cause: error,
      );
    } on FormatException catch (error) {
      throw LibraryPayloadParsingException(
        operation: operation,
        message: 'JSON payload has invalid date or numeric format',
        cause: error,
      );
    } on TypeError catch (error) {
      throw LibraryPayloadParsingException(
        operation: operation,
        message: 'JSON payload has incompatible value types',
        cause: error,
      );
    }
  }

  List<Map<String, dynamic>> _extractList(
    dynamic responseData, {
    required String operation,
  }) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is List) {
        return _ensureMapList(data, operation: operation);
      }
      
      if (data is Map<String, dynamic>) {
        if (data.containsKey('data') && data['data'] is List) {
          return _ensureMapList(data['data'] as List, operation: operation);
        }
        if (data.containsKey('items') && data['items'] is List) {
          return _ensureMapList(data['items'] as List, operation: operation);
        }
      }
    }

    if (responseData is List) {
      return _ensureMapList(responseData, operation: operation);
    }

    throw LibraryPayloadParsingException(
      operation: operation,
      message: 'Unexpected payload shape for list endpoint',
      cause: responseData.runtimeType,
    );
  }

  List<Map<String, dynamic>> _ensureMapList(
    List<dynamic> list, {
    required String operation,
  }) {
    if (list.any((item) => item is! Map<String, dynamic>)) {
      throw LibraryPayloadParsingException(
        operation: operation,
        message: 'List payload contains non-object entries',
      );
    }

    return list.cast<Map<String, dynamic>>();
  }
}
