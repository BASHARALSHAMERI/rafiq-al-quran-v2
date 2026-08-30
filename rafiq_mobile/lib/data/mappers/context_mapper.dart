import '../../domain/entities/center.dart';
import '../../domain/entities/circle.dart';
import '../models/context_dtos.dart';

extension CenterDtoMapper on CenterDto {
  Center toEntity() => Center(
        id: id,
        organizationId: organizationId,
        name: name,
        code: code,
        isActive: isActive,
        gender: gender,
        timezone: timezone,
        mosqueName: mosqueName,
        locationText: locationText,
        latitude: latitude,
        longitude: longitude,
        allowedRadiusMeters: allowedRadiusMeters,
        logoUrl: logoUrl,
        centerAdminUserId: centerAdminUserId,
      );
}

extension CircleDtoMapper on CircleDto {
  Circle toEntity() => Circle(
        id: id,
        centerId: centerId,
        name: name,
        teacherId: teacherId,
        isActive: isActive,
        gender: gender,
        circleType: circleType,
        approvalStatus: approvalStatus,
        mosqueName: mosqueName,
        locationText: locationText,
        latitude: latitude,
        longitude: longitude,
        allowedRadiusMeters: allowedRadiusMeters,
        teacherName: teacherName,
        studentsCount: studentsCount,
      );
}
