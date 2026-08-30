import '../../domain/repositories/context_repository.dart';
import '../../data/datasources/context_remote_datasource.dart';
import '../../data/datasources/context_local_datasource.dart';
import '../../domain/entities/center.dart';
import '../../domain/entities/circle.dart';
import '../mappers/context_mapper.dart';

class ContextRepositoryImpl implements ContextRepository {
  final ContextRemoteDataSource _remoteDataSource;
  final ContextLocalDataSource _localDataSource;

  ContextRepositoryImpl(this._remoteDataSource, this._localDataSource);

  @override
  Future<List<Center>> getMyCenters() async {
    try {
      final dtos = await _remoteDataSource.getMyCenters();
      await _localDataSource.saveCenters(dtos);
      return dtos.map((dto) => dto.toEntity()).toList();
    } catch (e) {
      final cachedDtos = await _localDataSource.getCachedCenters();
      if (cachedDtos != null && cachedDtos.isNotEmpty) {
        return cachedDtos.map((dto) => dto.toEntity()).toList();
      }
      rethrow;
    }
  }

  @override
  Future<List<Circle>> getMyCircles({required int centerId}) async {
    try {
      final dtos = await _remoteDataSource.getMyCircles(centerId.toString());
      await _localDataSource.saveCircles(dtos);
      return dtos.map((dto) => dto.toEntity()).toList();
    } catch (e) {
      final cachedDtos = await _localDataSource.getCachedCircles();
      if (cachedDtos != null && cachedDtos.isNotEmpty) {
        return cachedDtos
            .where((dto) => dto.centerId == centerId)
            .map((dto) => dto.toEntity())
            .toList();
      }
      rethrow;
    }
  }

  @override
  Future<void> saveCurrentCenter(int centerId) =>
      _localDataSource.saveCurrentCenter(centerId);

  @override
  Future<void> saveCurrentCircle(int circleId) =>
      _localDataSource.saveCurrentCircle(circleId);

  @override
  Future<int?> getCurrentCenterId() => _localDataSource.getCurrentCenterId();

  @override
  Future<int?> getCurrentCircleId() => _localDataSource.getCurrentCircleId();

  @override
  Future<void> clearContext() => _localDataSource.clearContext();
}
