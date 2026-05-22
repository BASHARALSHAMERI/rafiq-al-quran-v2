import 'dart:io';
import 'dart:typed_data';
import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../../data/datasources/library_remote_datasource.dart';
import '../../data/models/library_dtos.dart';
import '../../domain/repositories/library_repository.dart';
import 'library_providers.dart';

part 'library_controller.freezed.dart';

@freezed
class LibraryState with _$LibraryState {
  const factory LibraryState.initial() = _Initial;
  const factory LibraryState.loading() = _Loading;
  const factory LibraryState.loaded({
    @Default([]) List<LibraryCategoryDto> categories,
    @Default([]) List<LibraryItemDto> items,
    String? categoriesError,
    String? itemsError,
  }) = _Loaded;
  const factory LibraryState.error(String message) = _Error;
}

class LibraryController extends StateNotifier<LibraryState> {
  final LibraryRepository _repository;

  LibraryController(this._repository) : super(const LibraryState.initial());

  Future<void> loadLibrary({
    int? centerId,
    int? circleId,
    int? categoryId,
    String? q,
    String? type,
  }) async {
    final previous = _snapshotFromState(state);
    final hasCachedData =
        previous.categories.isNotEmpty || previous.items.isNotEmpty;

    state = hasCachedData
        ? LibraryState.loaded(
            categories: previous.categories,
            items: previous.items,
          )
        : const LibraryState.loading();

    var categories = previous.categories;
    var items = previous.items;
    String? categoriesError;
    String? itemsError;

    try {
      categories = await _repository.getCategories(centerId: centerId);
    } catch (error, stackTrace) {
      categoriesError = _mapLoadError(
        error,
        target: 'التصنيفات',
      );
      _logLoadFailure('categories', error, stackTrace);
    }

    try {
      items = await _repository.getItems(
        centerId: centerId,
        circleId: circleId,
        categoryId: categoryId,
        q: q,
        type: type,
      );
    } catch (error, stackTrace) {
      itemsError = _mapLoadError(
        error,
        target: 'العناصر',
      );
      _logLoadFailure('items', error, stackTrace);
    }

    final hasAnyData = categories.isNotEmpty || items.isNotEmpty;
    if (!hasAnyData && categoriesError != null && itemsError != null) {
      state = LibraryState.error(
        'تعذر تحميل بيانات المكتبة.\n$categoriesError\n$itemsError',
      );
      return;
    }

    state = LibraryState.loaded(
      categories: categories,
      items: items,
      categoriesError: categoriesError,
      itemsError: itemsError,
    );
  }

  Future<String?> downloadItem(LibraryItemDto item) async {
    try {
      final response = await _repository.downloadItem(item.id);
      final rootDir = await getApplicationDocumentsDirectory();
      final libraryDir = Directory(p.join(rootDir.path, 'library'));
      if (!await libraryDir.exists()) {
        await libraryDir.create(recursive: true);
      }

      final file = File(p.join(libraryDir.path, item.fileName));
      final bytes = _readBytes(response.data);
      await file.writeAsBytes(bytes, flush: true);
      return file.path;
    } catch (_) {
      return null;
    }
  }

  Uint8List _readBytes(dynamic data) {
    if (data is Uint8List) {
      return data;
    }
    if (data is List<int>) {
      return Uint8List.fromList(data);
    }
    if (data is List) {
      return Uint8List.fromList(data.cast<int>());
    }
    throw const FileSystemException('Invalid download payload');
  }

  ({List<LibraryCategoryDto> categories, List<LibraryItemDto> items})
      _snapshotFromState(LibraryState value) {
    return value.maybeWhen(
      loaded: (categories, items, _, __) => (
        categories: categories,
        items: items,
      ),
      orElse: () => (
        categories: <LibraryCategoryDto>[],
        items: <LibraryItemDto>[],
      ),
    );
  }

  String _mapLoadError(
    Object error, {
    required String target,
  }) {
    if (error is LibraryPayloadParsingException) {
      return '[Parsing] تعذر تحليل بيانات $target من الخادم (${error.message}).';
    }

    if (error is DioException) {
      if (_isNetworkError(error)) {
        return '[Network] تعذر تحميل $target بسبب مشكلة اتصال.';
      }

      final statusCode = error.response?.statusCode;
      if (statusCode != null) {
        return '[Server] تعذر تحميل $target (رمز الحالة: $statusCode).';
      }

      return '[Server] حدث خطأ غير متوقع أثناء تحميل $target.';
    }

    return '[Unknown] حدث خطأ غير متوقع أثناء تحميل $target.';
  }

  bool _isNetworkError(DioException error) {
    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.unknown;
  }

  void _logLoadFailure(
    String segment,
    Object error,
    StackTrace stackTrace,
  ) {
    developer.log(
      'Library load failure in $segment segment',
      name: 'LibraryController',
      error: error,
      stackTrace: stackTrace,
    );
  }
}

final libraryControllerProvider =
    StateNotifierProvider<LibraryController, LibraryState>((ref) {
  final repository = ref.watch(libraryRepositoryProvider);
  return LibraryController(repository);
});
