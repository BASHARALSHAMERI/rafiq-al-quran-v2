import '../../data/models/follow_up_dtos.dart';
import '../entities/student_profile.dart';

abstract class FollowUpRepository {
  Future<StudentProfile> getStudentProfile(int studentId);
  Future<List<FollowUpRecordDto>> getFollowUps(ListFollowUpsRequestDto request);
  Future<FollowUpRecordDto> createFollowUp(CreateFollowUpRequestDto request);
  Future<FollowUpRecordDto> updateFollowUp(
      int followUpId, UpdateFollowUpRequestDto request);
  Future<FollowUpRecordDto> finalizeFollowUp(int followUpId);
}
