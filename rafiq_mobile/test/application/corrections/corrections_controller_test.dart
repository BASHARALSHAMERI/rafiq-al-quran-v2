import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rafiq_mobile/application/corrections/corrections_controller.dart';
import 'package:rafiq_mobile/application/sync/sync_queue_service.dart';
import 'package:rafiq_mobile/data/models/correction_dtos.dart';
import 'package:rafiq_mobile/domain/repositories/corrections_repository.dart';

void main() {
  late _FakeCorrectionsRepository repository;
  late CorrectionsController controller;

  late ProviderContainer container;

  setUp(() {
    repository = _FakeCorrectionsRepository();
    container = ProviderContainer();
    controller = CorrectionsController(container.read(syncQueueServiceProvider.notifier).ref, repository);
  });

  tearDown(() {
    container.dispose();
    controller.dispose();
  });

  test('load pulls corrections from repository', () async {
    repository.listResult = ListCorrectionsResultDto(
      data: [_item(status: 'PENDING')],
      page: 1,
      pageSize: 100,
      total: 1,
    );

    await controller.load(centerId: 10, circleId: 11);

    expect(repository.lastCenterId, 10);
    expect(repository.lastCircleId, 11);
    expect(controller.state.items, hasLength(1));
    expect(controller.state.error, isNull);
  });

  test('approve updates corrected item in state', () async {
    controller.state = CorrectionsState(
      items: [_item(id: 4, status: 'PENDING')],
    );
    repository.approveResult = _item(
      id: 4,
      status: 'APPROVED',
      reviewNote: 'تمت المراجعة',
    );

    await controller.approve(4, applyChanges: true, reviewNote: 'تمت المراجعة');

    expect(repository.lastApproveId, 4);
    expect(controller.state.items.single.status, 'APPROVED');
    expect(controller.state.actionError, isNull);
  });

  test('reject stores action error when repository throws', () async {
    controller.state = CorrectionsState(
      items: [_item(id: 9, status: 'PENDING')],
    );
    repository.rejectError = Exception('رفض غير ممكن');

    await expectLater(
      controller.reject(9, reviewNote: 'مرفوض'),
      throwsException,
    );

    expect(controller.state.actionError, 'Exception: رفض غير ممكن');
    expect(controller.state.isActing, isFalse);
  });
}

class _FakeCorrectionsRepository implements CorrectionsRepository {
  ListCorrectionsResultDto? listResult;
  CorrectionItemDto? approveResult;
  CorrectionItemDto? rejectResult;
  Object? rejectError;
  int? lastCenterId;
  int? lastCircleId;
  int? lastApproveId;

  @override
  Future<CorrectionItemDto> approve(
    int correctionId, {
    required bool applyChanges,
    String? reviewNote,
  }) async {
    lastApproveId = correctionId;
    return approveResult ?? _item(id: correctionId, status: 'APPROVED');
  }

  @override
  Future<ListCorrectionsResultDto> list({
    String? status,
    String? targetType,
    int? centerId,
    int? circleId,
    int page = 1,
    int pageSize = 100,
  }) async {
    lastCenterId = centerId;
    lastCircleId = circleId;
    return listResult ??
        const ListCorrectionsResultDto(
          data: [],
          page: 1,
          pageSize: 100,
          total: 0,
        );
  }

  @override
  Future<CorrectionItemDto> reject(
    int correctionId, {
    required String reviewNote,
  }) async {
    if (rejectError != null) {
      throw rejectError!;
    }
    return rejectResult ?? _item(id: correctionId, status: 'REJECTED');
  }
}

CorrectionItemDto _item({
  int id = 1,
  String status = 'PENDING',
  String? reviewNote,
}) {
  final now = DateTime(2026, 3, 8);
  return CorrectionItemDto(
    id: id,
    organizationId: 1,
    centerId: 2,
    circleId: 3,
    targetType: 'FOLLOW_UP',
    targetId: 4,
    requestedById: 5,
    requestedByRole: 'TEACHER',
    reason: 'سبب',
    proposedChanges: const {'rating': 5},
    currentSnapshot: const {'rating': 3},
    status: status,
    reviewNote: reviewNote,
    createdAt: now,
    updatedAt: now,
  );
}
