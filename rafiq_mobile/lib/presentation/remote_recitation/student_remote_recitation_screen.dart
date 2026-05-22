import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../application/remote_recitation/remote_recitation_providers.dart';
import '../../core/constants/app_radius.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/remote_recitation_models.dart';
import '../shared/widgets/enterprise_card.dart';
import '../shared/widgets/page_state_view.dart';

class StudentRemoteRecitationScreen extends ConsumerWidget {
  const StudentRemoteRecitationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slotsAsync = ref.watch(studentRemoteRecitationSlotsProvider);
    final requestedAsync = ref.watch(
      remoteRecitationBookingsProvider(
        (
          circleId: null,
          status: RemoteRecitationBookingStatusDto.requested,
        ),
      ),
    );
    final approvedAsync = ref.watch(
      remoteRecitationBookingsProvider(
        (
          circleId: null,
          status: RemoteRecitationBookingStatusDto.approved,
        ),
      ),
    );
    final historyAsync = ref.watch(
      remoteRecitationBookingsProvider(
        (
          circleId: null,
          status: RemoteRecitationBookingStatusDto.completed,
        ),
      ),
    );

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F8F5),
        appBar: AppBar(
          title: const Text('التسميع عن بعد'),
          centerTitle: true,
          backgroundColor: const Color(0xFFF7F8F5),
          surfaceTintColor: Colors.transparent,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(76),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                0,
                AppSpacing.md,
                AppSpacing.sm,
              ),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: const TabBar(
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: AppColors.textPrimaryLight,
                  unselectedLabelColor: AppColors.textSecondaryLight,
                  indicator: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.all(Radius.circular(16)),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x12000000),
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  tabs: [
                    Tab(text: 'حجز موعد'),
                    Tab(text: 'القادمة'),
                    Tab(text: 'السجل'),
                  ],
                ),
              ),
            ),
          ),
        ),
        body: TabBarView(
          children: [
            _StudentSlotsTab(slotsAsync: slotsAsync),
            _StudentUpcomingTab(
              requestedAsync: requestedAsync,
              approvedAsync: approvedAsync,
            ),
            _StudentHistoryTab(historyAsync: historyAsync),
          ],
        ),
      ),
    );
  }
}

class _StudentSlotsTab extends ConsumerWidget {
  final AsyncValue<RemoteRecitationSlotsPageDto> slotsAsync;

  const _StudentSlotsTab({required this.slotsAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slotsPage = slotsAsync.valueOrNull;
    final slots = slotsPage?.data ?? const <RemoteRecitationSlotDto>[];

    if (slotsAsync.isLoading && slotsPage == null) {
      return const PageStateView.loading();
    }

    if (slotsAsync.hasError && slotsPage == null) {
      return PageStateView.error(
        title: 'تعذر تحميل المواعيد',
        message: '${slotsAsync.error}',
        actionLabel: 'إعادة المحاولة',
        onAction: () =>
            ref.read(remoteRecitationRefreshProvider.notifier).state++,
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.read(remoteRecitationRefreshProvider.notifier).state++;
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          120,
        ),
        children: [
          const Text(
            'المواعيد المتاحة',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (slots.isEmpty)
            const _SectionEmptyCard(
              title: 'لا توجد مواعيد متاحة',
              message: 'سيظهر هنا أي موعد يتيحه المعلم للحجز المسبق.',
            )
          else
            ...slots.map(
              (slot) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: EnterpriseCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _formatDayDate(slot.startsAt),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 18,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${DateFormat('HH:mm', 'ar').format(slot.startsAt)}'
                                  ' - ${slot.teacher.fullName}',
                                  style: const TextStyle(
                                    color: AppColors.textSecondaryLight,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const _RoundIcon(
                            icon: Icons.calendar_today_outlined,
                            color: AppColors.primaryLight,
                            background: Color(0xFFEFF7F2),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      FilledButton.icon(
                        onPressed: () => _bookSlot(context, ref, slot.id),
                        icon: const Icon(Icons.videocam_outlined),
                        label: const Text('حجز هذا الموعد'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primaryLight,
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(50),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StudentUpcomingTab extends ConsumerWidget {
  final AsyncValue<RemoteRecitationBookingsPageDto> requestedAsync;
  final AsyncValue<RemoteRecitationBookingsPageDto> approvedAsync;

  const _StudentUpcomingTab({
    required this.requestedAsync,
    required this.approvedAsync,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestedPage = requestedAsync.valueOrNull;
    final approvedPage = approvedAsync.valueOrNull;
    final requested =
        requestedPage?.data ?? const <RemoteRecitationBookingDto>[];
    final approved = approvedPage?.data ?? const <RemoteRecitationBookingDto>[];

    final isInitialLoading =
        (requestedAsync.isLoading && requestedPage == null) ||
            (approvedAsync.isLoading && approvedPage == null);
    if (isInitialLoading) {
      return const PageStateView.loading();
    }

    final hasBlockingError =
        (requestedAsync.hasError && requestedPage == null) ||
            (approvedAsync.hasError && approvedPage == null);
    if (hasBlockingError) {
      return PageStateView.error(
        title: 'تعذر تحميل الجلسات القادمة',
        message: '${requestedAsync.error ?? approvedAsync.error}',
        actionLabel: 'إعادة المحاولة',
        onAction: () =>
            ref.read(remoteRecitationRefreshProvider.notifier).state++,
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.read(remoteRecitationRefreshProvider.notifier).state++;
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          120,
        ),
        children: [
          if (requested.isEmpty && approved.isEmpty)
            const _SectionEmptyCard(
              title: 'لا توجد جلسات قادمة',
              message:
                  'بعد إرسال الطلب وموافقة المعلم سيظهر الموعد هنا مع رابط الانضمام.',
            )
          else ...[
            if (requested.isNotEmpty) ...[
              const Text(
                'طلبات بانتظار الموافقة',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: AppSpacing.sm),
              ...requested.map(
                (booking) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _PendingStudentBookingCard(booking: booking),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
            const Text(
              'الجلسات القادمة',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: AppSpacing.sm),
            if (approved.isEmpty)
              const _SectionEmptyCard(
                title: 'لا توجد جلسات معتمدة',
                message: 'عند قبول المعلم للطلب سيظهر الرابط هنا.',
              )
            else
              ...approved.map(
                (booking) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _ApprovedStudentBookingCard(booking: booking),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _StudentHistoryTab extends ConsumerWidget {
  final AsyncValue<RemoteRecitationBookingsPageDto> historyAsync;

  const _StudentHistoryTab({required this.historyAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyPage = historyAsync.valueOrNull;
    final bookings = historyPage?.data ?? const <RemoteRecitationBookingDto>[];

    if (historyAsync.isLoading && historyPage == null) {
      return const PageStateView.loading();
    }

    if (historyAsync.hasError && historyPage == null) {
      return PageStateView.error(
        title: 'تعذر تحميل السجل',
        message: '${historyAsync.error}',
        actionLabel: 'إعادة المحاولة',
        onAction: () =>
            ref.read(remoteRecitationRefreshProvider.notifier).state++,
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.read(remoteRecitationRefreshProvider.notifier).state++;
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          120,
        ),
        children: [
          const Text(
            'الجلسات السابقة',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (bookings.isEmpty)
            const _SectionEmptyCard(
              title: 'لا توجد جلسات مكتملة',
              message: 'سيظهر هنا تقييم التسميع بعد انتهاء الجلسة.',
            )
          else
            ...bookings.map(
              (booking) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _StudentCompletedBookingCard(booking: booking),
              ),
            ),
        ],
      ),
    );
  }
}

class _PendingStudentBookingCard extends StatelessWidget {
  final RemoteRecitationBookingDto booking;

  const _PendingStudentBookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatSessionLine(booking.slot.startsAt),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      booking.teacher.fullName,
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              _RoundIcon(
                icon: Icons.schedule_outlined,
                color: AppColors.warningLight,
                background: AppColors.warningLight.withValues(alpha: 0.12),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          const _StatusChip(
            label: 'بانتظار الموافقة',
            color: AppColors.warningLight,
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            'سيظهر رابط الانضمام بعد موافقة المعلم على الطلب.',
            style: TextStyle(
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _ApprovedStudentBookingCard extends StatelessWidget {
  final RemoteRecitationBookingDto booking;

  const _ApprovedStudentBookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatSessionLine(booking.slot.startsAt),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      booking.teacher.fullName,
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const _RoundIcon(
                icon: Icons.videocam_outlined,
                color: Colors.white,
                background: AppColors.primaryLight,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          const _StatusChip(
            label: 'تمت الموافقة',
            color: AppColors.successLight,
          ),
          const SizedBox(height: AppSpacing.md),
          OutlinedButton.icon(
            onPressed: () => _launchUrl(context, booking.slot.joinUrl),
            icon: const Icon(Icons.link_rounded),
            label: const Text('انضمام للجلسة'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.infoLight,
              minimumSize: const Size.fromHeight(50),
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentCompletedBookingCard extends StatelessWidget {
  final RemoteRecitationBookingDto booking;

  const _StudentCompletedBookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    final followUp = booking.followUpRecord;

    return EnterpriseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatSessionLine(booking.slot.startsAt),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      followUp?.recordDate ??
                          DateFormat('yyyy-MM-dd', 'ar')
                              .format(booking.slot.startsAt),
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const _StatusChip(
                label: 'مكتملة',
                color: AppColors.successLight,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAF8),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _historySummary(followUp),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: AppSpacing.xs),
                _StarsBar(rating: followUp?.rating),
                if (followUp?.notes != null &&
                    followUp!.notes!.trim().isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    followUp.notes!,
                    style: const TextStyle(
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionEmptyCard extends StatelessWidget {
  final String title;
  final String message;

  const _SectionEmptyCard({
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            message,
            style: const TextStyle(
              color: AppColors.textSecondaryLight,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusChip({
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _RoundIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Color background;

  const _RoundIcon({
    required this.icon,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: background,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color),
    );
  }
}

class _StarsBar extends StatelessWidget {
  final int? rating;

  const _StarsBar({required this.rating});

  @override
  Widget build(BuildContext context) {
    final stars = ((rating ?? 0) / 20).round().clamp(0, 5);
    return Row(
      children: List.generate(
        5,
        (index) => Icon(
          index < stars ? Icons.star_rounded : Icons.star_border_rounded,
          size: 18,
          color: AppColors.secondaryLight,
        ),
      ),
    );
  }
}

String _formatDayDate(DateTime value) {
  return DateFormat('EEEE d MMMM', 'ar').format(value);
}

String _formatSessionLine(DateTime start) {
  final day = DateFormat('EEEE', 'ar').format(start);
  final time = DateFormat('HH:mm', 'ar').format(start);
  return '$day - $time';
}

String _historySummary(RemoteRecitationFollowUpDto? followUp) {
  if (followUp == null) {
    return 'لا توجد تفاصيل تقييم';
  }

  if (followUp.type == 'MATN') {
    return followUp.matnName ?? 'متن';
  }

  if (followUp.surah != null && followUp.surah!.trim().isNotEmpty) {
    return followUp.surah!;
  }

  final fromSurah = followUp.fromSurah;
  final toSurah = followUp.toSurah;
  if (fromSurah != null && toSurah != null) {
    return 'من $fromSurah:${followUp.fromAyah ?? 1} إلى '
        '$toSurah:${followUp.toAyah ?? 1}';
  }

  return 'تقييم مكتمل';
}

Future<void> _bookSlot(BuildContext context, WidgetRef ref, int slotId) async {
  try {
    await ref.read(remoteRecitationRemoteDataSourceProvider).createBooking(
          slotId: slotId,
        );
    ref.read(remoteRecitationRefreshProvider.notifier).state++;
    if (context.mounted) {
      _showSnackBar(context, 'تم إرسال طلب الحجز بنجاح.');
    }
  } catch (error) {
    if (context.mounted) {
      _showSnackBar(context, 'تعذر إرسال طلب الحجز: $error');
    }
  }
}

Future<void> _launchUrl(BuildContext context, String? rawUrl) async {
  if (rawUrl == null || rawUrl.trim().isEmpty) {
    _showSnackBar(context, 'الرابط غير متاح بعد.');
    return;
  }

  final uri = Uri.tryParse(rawUrl);
  if (uri == null) {
    _showSnackBar(context, 'الرابط غير صالح.');
    return;
  }

  final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    _showSnackBar(context, 'تعذر فتح الرابط الخارجي.');
  }
}

void _showSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message)),
  );
}
