import 'package:dio/dio.dart';

import '../models/remote_recitation_models.dart';

abstract class RemoteRecitationRemoteDataSource {
  Future<RemoteRecitationSettingsDto> getSettings(int circleId);
  Future<RemoteRecitationSlotsPageDto> listSlots({int? circleId});
  Future<RemoteRecitationBookingsPageDto> listBookings({
    int? circleId,
    RemoteRecitationBookingStatusDto? status,
  });
  Future<RemoteRecitationSlotDto> createSlot({
    required int circleId,
    required String startsAt,
    required String endsAt,
    required String joinUrl,
    String? note,
  });
  Future<RemoteRecitationSlotDto> deleteSlot({
    required int slotId,
    required int lockVersion,
  });
  Future<RemoteRecitationBookingDto> createBooking({
    required int slotId,
  });
  Future<RemoteRecitationBookingDto> approveBooking({
    required int bookingId,
    required int lockVersion,
    String? note,
  });
  Future<RemoteRecitationBookingDto> rejectBooking({
    required int bookingId,
    required int lockVersion,
    String? note,
  });
  Future<RemoteRecitationBookingDto> cancelBooking({
    required int bookingId,
    required int lockVersion,
    String? reason,
  });
  Future<RemoteRecitationBookingDto> completeBooking({
    required int bookingId,
    required Map<String, dynamic> payload,
  });
}

class RemoteRecitationRemoteDataSourceImpl
    implements RemoteRecitationRemoteDataSource {
  final Dio dio;

  RemoteRecitationRemoteDataSourceImpl({required this.dio});

  @override
  Future<RemoteRecitationSettingsDto> getSettings(int circleId) async {
    final response = await dio.get(
      '/remote-recitation/settings',
      queryParameters: {'circleId': circleId},
    );
    return RemoteRecitationSettingsDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationSlotsPageDto> listSlots({int? circleId}) async {
    final response = await dio.get(
      '/remote-recitation/slots',
      queryParameters: {
        if (circleId != null) 'circleId': circleId,
        'page': 1,
        'pageSize': 100,
      },
    );
    return RemoteRecitationSlotsPageDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationBookingsPageDto> listBookings({
    int? circleId,
    RemoteRecitationBookingStatusDto? status,
  }) async {
    final response = await dio.get(
      '/remote-recitation/bookings',
      queryParameters: {
        if (circleId != null) 'circleId': circleId,
        if (status != null) 'status': status.apiValue,
        'page': 1,
        'pageSize': 100,
      },
    );
    return RemoteRecitationBookingsPageDto.fromJson(
        _extractData(response.data));
  }

  @override
  Future<RemoteRecitationSlotDto> createSlot({
    required int circleId,
    required String startsAt,
    required String endsAt,
    required String joinUrl,
    String? note,
  }) async {
    final response = await dio.post(
      '/remote-recitation/slots',
      data: {
        'circleId': circleId,
        'startsAt': startsAt,
        'endsAt': endsAt,
        'joinUrl': joinUrl,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
    return RemoteRecitationSlotDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationSlotDto> deleteSlot({
    required int slotId,
    required int lockVersion,
  }) async {
    final response = await dio.delete(
      '/remote-recitation/slots/$slotId',
      queryParameters: {'lockVersion': lockVersion},
    );
    return RemoteRecitationSlotDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationBookingDto> createBooking({
    required int slotId,
  }) async {
    final response = await dio.post(
      '/remote-recitation/bookings',
      data: {'slotId': slotId},
    );
    return RemoteRecitationBookingDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationBookingDto> approveBooking({
    required int bookingId,
    required int lockVersion,
    String? note,
  }) async {
    final response = await dio.patch(
      '/remote-recitation/bookings/$bookingId/approve',
      data: {
        'lockVersion': lockVersion,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
    return RemoteRecitationBookingDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationBookingDto> rejectBooking({
    required int bookingId,
    required int lockVersion,
    String? note,
  }) async {
    final response = await dio.patch(
      '/remote-recitation/bookings/$bookingId/reject',
      data: {
        'lockVersion': lockVersion,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
    return RemoteRecitationBookingDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationBookingDto> cancelBooking({
    required int bookingId,
    required int lockVersion,
    String? reason,
  }) async {
    final response = await dio.patch(
      '/remote-recitation/bookings/$bookingId/cancel',
      data: {
        'lockVersion': lockVersion,
        if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
      },
    );
    return RemoteRecitationBookingDto.fromJson(_extractData(response.data));
  }

  @override
  Future<RemoteRecitationBookingDto> completeBooking({
    required int bookingId,
    required Map<String, dynamic> payload,
  }) async {
    final response = await dio.post(
      '/remote-recitation/bookings/$bookingId/complete',
      data: payload,
    );
    return RemoteRecitationBookingDto.fromJson(_extractData(response.data));
  }

  Map<String, dynamic> _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final payload = responseData['data'];
      if (payload is Map<String, dynamic>) {
        return payload;
      }
      return responseData;
    }
    return const <String, dynamic>{};
  }
}
