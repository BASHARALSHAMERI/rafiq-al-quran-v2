import '../../domain/entities/center.dart';
import '../../domain/entities/circle.dart';

class ContextState {
  final bool isInitialized;
  final bool isLoading;
  final String? error;
  final List<Center> centers;
  final List<Circle> circles;
  final int? selectedCenterId;
  final int? selectedCircleId;

  const ContextState({
    this.isInitialized = false,
    this.isLoading = false,
    this.error,
    this.centers = const [],
    this.circles = const [],
    this.selectedCenterId,
    this.selectedCircleId,
  });

  bool get hasSelectedCenter => selectedCenterId != null;

  bool get hasSelectedCircle => selectedCircleId != null;

  bool get hasCompleteContext => hasSelectedCenter && hasSelectedCircle;

  /// Look up the circle name from the loaded circles list
  String? get selectedCircleName {
    if (selectedCircleId == null) return null;
    try {
      return circles.firstWhere((c) => c.id == selectedCircleId).name;
    } catch (_) {
      return null;
    }
  }

  /// Look up the center name from the loaded centers list
  String? get selectedCenterName {
    if (selectedCenterId == null) return null;
    try {
      return centers.firstWhere((c) => c.id == selectedCenterId).name;
    } catch (_) {
      return null;
    }
  }

  /// Look up the selected center entity
  Center? get selectedCenter {
    if (selectedCenterId == null) return null;
    try {
      return centers.firstWhere((c) => c.id == selectedCenterId);
    } catch (_) {
      return null;
    }
  }

  /// Look up the selected circle entity
  Circle? get selectedCircle {
    if (selectedCircleId == null) return null;
    try {
      return circles.firstWhere((c) => c.id == selectedCircleId);
    } catch (_) {
      return null;
    }
  }

  ContextState copyWith({
    bool? isInitialized,
    bool? isLoading,
    String? error,
    List<Center>? centers,
    List<Circle>? circles,
    int? selectedCenterId,
    int? selectedCircleId,
    bool clearError = false,
    bool clearCenter = false,
    bool clearCircle = false,
  }) {
    return ContextState(
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      centers: centers ?? this.centers,
      circles: circles ?? this.circles,
      selectedCenterId:
          clearCenter ? null : (selectedCenterId ?? this.selectedCenterId),
      selectedCircleId:
          clearCircle ? null : (selectedCircleId ?? this.selectedCircleId),
    );
  }
}
