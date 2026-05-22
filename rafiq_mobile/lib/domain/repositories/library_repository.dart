import 'package:dio/dio.dart';
import '../../data/models/library_dtos.dart';

abstract class LibraryRepository {
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
