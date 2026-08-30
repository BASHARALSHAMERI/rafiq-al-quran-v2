import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../application/auth/auth_providers.dart';
import '../../application/context/context_controller.dart';
import '../../data/datasources/remote_recitation_remote_datasource.dart';
import '../../data/models/remote_recitation_models.dart';

typedef RemoteRecitationBookingsQuery = ({
  int? circleId,
  RemoteRecitationBookingStatusDto? status
});

final remoteRecitationRemoteDataSourceProvider =
    Provider<RemoteRecitationRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider);
  return RemoteRecitationRemoteDataSourceImpl(dio: dio);
});

final remoteRecitationRefreshProvider = StateProvider<int>((ref) => 0);

final teacherRemoteRecitationCircleIdProvider = Provider<int?>((ref) {
  final selectedCircleId = ref.watch(
    contextControllerProvider.select((state) => state.selectedCircleId),
  );
  return selectedCircleId;
});

final teacherRemoteRecitationSettingsProvider =
    FutureProvider<RemoteRecitationSettingsDto?>((ref) async {
  ref.watch(remoteRecitationRefreshProvider);
  final circleId = ref.watch(teacherRemoteRecitationCircleIdProvider);
  if (circleId == null) {
    return null;
  }

  return ref
      .read(remoteRecitationRemoteDataSourceProvider)
      .getSettings(circleId);
});

final teacherRemoteRecitationSlotsProvider =
    FutureProvider<RemoteRecitationSlotsPageDto?>((ref) async {
  ref.watch(remoteRecitationRefreshProvider);
  final circleId = ref.watch(teacherRemoteRecitationCircleIdProvider);
  if (circleId == null) {
    return null;
  }

  return ref.read(remoteRecitationRemoteDataSourceProvider).listSlots(
        circleId: circleId,
      );
});

final studentRemoteRecitationSlotsProvider =
    FutureProvider<RemoteRecitationSlotsPageDto>((ref) async {
  ref.watch(remoteRecitationRefreshProvider);
  return ref.read(remoteRecitationRemoteDataSourceProvider).listSlots();
});

final remoteRecitationBookingsProvider = FutureProvider.family<
    RemoteRecitationBookingsPageDto, RemoteRecitationBookingsQuery>((
  ref,
  query,
) async {
  ref.watch(remoteRecitationRefreshProvider);
  return ref.read(remoteRecitationRemoteDataSourceProvider).listBookings(
        circleId: query.circleId,
        status: query.status,
      );
});
