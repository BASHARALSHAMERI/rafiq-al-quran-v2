import '../../data/models/org_dtos.dart';

abstract class OrgRepository {
  Future<List<OrgCircleDto>> listCircles({int? centerId});
}
