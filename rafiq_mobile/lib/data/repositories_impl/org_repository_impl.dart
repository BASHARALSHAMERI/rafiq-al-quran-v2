import '../../domain/repositories/org_repository.dart';
import '../datasources/org_remote_datasource.dart';
import '../models/org_dtos.dart';

class OrgRepositoryImpl implements OrgRepository {
  final OrgRemoteDataSource remoteDataSource;

  OrgRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<OrgCircleDto>> listCircles({int? centerId}) {
    return remoteDataSource.listCircles(centerId: centerId);
  }
}
