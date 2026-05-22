import 'package:dio/dio.dart';

import '../../domain/repositories/library_repository.dart';
import '../datasources/library_remote_datasource.dart';
import '../models/library_dtos.dart';

class LibraryRepositoryImpl implements LibraryRepository {
  final LibraryRemoteDataSource remoteDataSource;

  LibraryRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<LibraryCategoryDto>> getCategories({int? centerId}) async {
    return await remoteDataSource.getCategories(centerId: centerId);
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
    return await remoteDataSource.getItems(
      centerId: centerId,
      circleId: circleId,
      categoryId: categoryId,
      q: q,
      type: type,
      page: page,
      pageSize: pageSize,
    );
  }

  @override
  Future<Response> downloadItem(int itemId) async {
    return await remoteDataSource.downloadItem(itemId);
  }
}
