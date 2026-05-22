import '../entities/center.dart';
import '../entities/circle.dart';

abstract class ContextRepository {
  Future<List<Center>> getMyCenters();
  Future<List<Circle>> getMyCircles({required String centerId});

  Future<void> saveCurrentCenter(String centerId);
  Future<void> saveCurrentCircle(String circleId);

  Future<String?> getCurrentCenterId();
  Future<String?> getCurrentCircleId();
  Future<void> clearContext();
}
