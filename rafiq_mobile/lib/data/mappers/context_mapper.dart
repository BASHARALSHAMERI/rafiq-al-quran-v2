import '../../domain/entities/center.dart';
import '../../domain/entities/circle.dart';
import '../models/context_dtos.dart';

extension CenterDtoMapper on CenterDto {
  Center toEntity() => Center(
        id: id,
        name: name,
        domain: domain,
      );
}

extension CircleDtoMapper on CircleDto {
  Circle toEntity() => Circle(
        id: id,
        name: name,
        centerId: centerId,
      );
}
