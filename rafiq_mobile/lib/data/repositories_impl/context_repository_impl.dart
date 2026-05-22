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
    final dtos = await _remoteDataSource.getMyCenters();
    return dtos.map((dto) => dto.toEntity()).toList();
  }

  @override
  Future<List<Circle>> getMyCircles({required String centerId}) async {
    final dtos = await _remoteDataSource.getMyCircles(centerId);
    return dtos.map((dto) => dto.toEntity()).toList();
  }

  @override
  Future<void> saveCurrentCenter(String centerId) =>
      _localDataSource.saveCurrentCenter(centerId);

  @override
  Future<void> saveCurrentCircle(String circleId) =>
      _localDataSource.saveCurrentCircle(circleId);

  @override
  Future<String?> getCurrentCenterId() => _localDataSource.getCurrentCenterId();

  @override
  Future<String?> getCurrentCircleId() => _localDataSource.getCurrentCircleId();

  @override
  Future<void> clearContext() => _localDataSource.clearContext();
}
