import '../entities/center.dart';
import '../entities/circle.dart';

abstract class ContextRepository {
  Future<List<Center>> getMyCenters();
  Future<List<Circle>> getMyCircles({required int centerId});

  Future<void> saveCurrentCenter(int centerId);
  Future<void> saveCurrentCircle(int circleId);

  Future<int?> getCurrentCenterId();
  Future<int?> getCurrentCircleId();
  Future<void> clearContext();
}
