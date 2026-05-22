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

class TeacherRemoteRecitationScreen extends ConsumerWidget {
  const TeacherRemoteRecitationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final circleId = ref.watch(teacherRemoteRecitationCircleIdProvider);
    final settingsAsync = ref.watch(teacherRemoteRecitationSettingsProvider);
    final slotsAsync = ref.watch(teacherRemoteRecitationSlotsProvider);
    final pendingAsync = ref.watch(
      remoteRecitationBookingsProvider(
        (
          circleId: circleId,
          status: RemoteRecitationBookingStatusDto.requested,
        ),
      ),
    );
    final approvedAsync = ref.watch(
      remoteRecitationBookingsProvider(
        (
          circleId: circleId,
          status: RemoteRecitationBookingStatusDto.approved,
        ),
      ),
    );
    final historyAsync = ref.watch(
      remoteRecitationBookingsProvider(
        (
          circleId: circleId,
          status: RemoteRecitationBookingStatusDto.completed,
        ),
      ),
    );

    final pendingCount = pendingAsync.valueOrNull?.data.length ?? 0;

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
                child: TabBar(
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: AppColors.textPrimaryLight,
                  unselectedLabelColor: AppColors.textSecondaryLight,
                  indicator: const BoxDecoration(
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
                    const Tab(text: 'المواعيد'),
                    Tab(
                      child: _TabLabel(
                        title: 'الطلبات',
                        badgeCount: pendingCount,
                      ),
                    ),
                    const Tab(text: 'السجل'),
                  ],
                ),
              ),
            ),
          ),
        ),
        body: circleId == null
            ? const PageStateView.empty(
                title: 'لا توجد حلقة محددة',
                message:
                    'اختر الحلقة أولاً حتى تتمكن من إدارة جلسات التسميع عن بعد.',
              )
            : TabBarView(
                children: [
                  _TeacherSlotsTab(
                    settingsAsync: settingsAsync,
                    slotsAsync: slotsAsync,
                  ),
                  _TeacherRequestsTab(
                    pendingAsync: pendingAsync,
                    approvedAsync: approvedAsync,
                  ),
                  _TeacherHistoryTab(historyAsync: historyAsync),
                ],
              ),
      ),
    );
  }
}

class _TeacherSlotsTab extends ConsumerWidget {
  final AsyncValue<RemoteRecitationSettingsDto?> settingsAsync;
  final AsyncValue<RemoteRecitationSlotsPageDto?> slotsAsync;

  const _TeacherSlotsTab({
    required this.settingsAsync,
    required this.slotsAsync,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final circleId = ref.watch(teacherRemoteRecitationCircleIdProvider);
    final settings = settingsAsync.valueOrNull;
    final slotsPage = slotsAsync.valueOrNull;
    final slots = slotsPage?.data ?? const <RemoteRecitationSlotDto>[];

    final isInitialLoading = (settingsAsync.isLoading && settings == null) ||
        (slotsAsync.isLoading && slotsPage == null);
    if (isInitialLoading) {
      return const PageStateView.loading();
    }

    final hasBlockingError = (settingsAsync.hasError && settings == null) ||
        (slotsAsync.hasError && slotsPage == null);
    if (hasBlockingError) {
      return PageStateView.error(
        title: 'تعذر تحميل المواعيد',
        message: '${settingsAsync.error ?? slotsAsync.error}',
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
          if (settings != null) ...[
            EnterpriseCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'إعدادات الجلسة',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: [
                      _InfoChip(
                        icon: Icons.timer_outlined,
                        label: '${settings.slotDurationMinutes} دقيقة',
                      ),
                      _InfoChip(
                        icon: Icons.schedule_outlined,
                        label: 'الحجز قبل ${settings.bookingLeadHours} س',
                      ),
                      _InfoChip(
                        icon: Icons.event_busy_outlined,
                        label:
                            'الإلغاء قبل ${settings.cancellationWindowHours} س',
                      ),
                      _InfoChip(
                        icon: Icons.calendar_month_outlined,
                        label: 'حتى ${settings.maxAdvanceDays} يوم',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          const Text(
            'المواعيد المتاحة للتسميع',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (slots.isEmpty)
            const _SectionEmptyCard(
              title: 'لا توجد مواعيد متاحة',
              message: 'أضف موعداً جديداً ليظهر للطالب في شاشة الحجز.',
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
                                  _formatTimeRange(slot.startsAt, slot.endsAt),
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
                      const SizedBox(height: AppSpacing.sm),
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.sm,
                        children: [
                          if (slot.providerHost != null &&
                              slot.providerHost!.isNotEmpty)
                            _StatusChip(
                              label: slot.providerHost!,
                              color: AppColors.primaryLight,
                            ),
                          const _StatusChip(
                            label: 'رابط خارجي',
                            color: AppColors.infoLight,
                          ),
                        ],
                      ),
                      if (slot.joinUrl != null && slot.joinUrl!.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.sm),
                        InkWell(
                          onTap: () =>
                              _launchExternalLink(context, slot.joinUrl),
                          child: Text(
                            slot.joinUrl!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.infoLight,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                      if (slot.note != null &&
                          slot.note!.trim().isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          slot.note!,
                          style: const TextStyle(
                            color: AppColors.textSecondaryLight,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      const SizedBox(height: AppSpacing.md),
                      OutlinedButton.icon(
                        onPressed: () => _deleteSlot(context, ref, slot),
                        icon: const Icon(Icons.delete_outline_rounded),
                        label: const Text('حذف'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.errorLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          const SizedBox(height: AppSpacing.md),
          FilledButton.icon(
            onPressed: circleId == null || settings == null
                ? null
                : () => _showCreateSlotSheet(
                      context,
                      ref,
                      circleId: circleId,
                      settings: settings,
                    ),
            icon: const Icon(Icons.add_rounded),
            label: const Text('إضافة موعد جديد'),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primaryLight,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TeacherRequestsTab extends ConsumerWidget {
  final AsyncValue<RemoteRecitationBookingsPageDto> pendingAsync;
  final AsyncValue<RemoteRecitationBookingsPageDto> approvedAsync;

  const _TeacherRequestsTab({
    required this.pendingAsync,
    required this.approvedAsync,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingPage = pendingAsync.valueOrNull;
    final approvedPage = approvedAsync.valueOrNull;
    final pending = pendingPage?.data ?? const <RemoteRecitationBookingDto>[];
    final approved = approvedPage?.data ?? const <RemoteRecitationBookingDto>[];

    final isInitialLoading = (pendingAsync.isLoading && pendingPage == null) ||
        (approvedAsync.isLoading && approvedPage == null);
    if (isInitialLoading) {
      return const PageStateView.loading();
    }

    final hasBlockingError = (pendingAsync.hasError && pendingPage == null) ||
        (approvedAsync.hasError && approvedPage == null);
    if (hasBlockingError) {
      return PageStateView.error(
        title: 'تعذر تحميل الطلبات',
        message: '${pendingAsync.error ?? approvedAsync.error}',
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
            'طلبات بانتظار الموافقة',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (pending.isEmpty)
            const _SectionEmptyCard(
              title: 'لا توجد طلبات حالياً',
              message: 'سيظهر هنا أي طلب حجز جديد يرسله الطلاب.',
            )
          else
            ...pending.map(
              (booking) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _PendingBookingCard(booking: booking),
              ),
            ),
          const SizedBox(height: AppSpacing.lg),
          const Text(
            'جلسات قادمة',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (approved.isEmpty)
            const _SectionEmptyCard(
              title: 'لا توجد جلسات قادمة',
              message: 'عند قبول أحد الطلبات سيظهر هنا مع رابط الانضمام.',
            )
          else
            ...approved.map(
              (booking) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _UpcomingBookingCard(booking: booking),
              ),
            ),
        ],
      ),
    );
  }
}

class _TeacherHistoryTab extends ConsumerWidget {
  final AsyncValue<RemoteRecitationBookingsPageDto> historyAsync;

  const _TeacherHistoryTab({required this.historyAsync});

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
              message: 'سيظهر هنا سجل التسميع بعد إكمال الجلسات وتقييمها.',
            )
          else
            ...bookings.map(
              (booking) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _CompletedBookingCard(booking: booking),
              ),
            ),
        ],
      ),
    );
  }
}

class _PendingBookingCard extends ConsumerWidget {
  final RemoteRecitationBookingDto booking;

  const _PendingBookingCard({required this.booking});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                      booking.student.fullName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatSessionLine(booking.slot.startsAt),
                      style: const TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              _RoundAvatar(label: _firstLetter(booking.student.fullName)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          const _StatusChip(
            label: 'بانتظار الموافقة',
            color: AppColors.warningLight,
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _handleBookingDecision(
                    context,
                    ref,
                    booking: booking,
                    approve: false,
                  ),
                  icon: const Icon(Icons.close_rounded),
                  label: const Text('رفض'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.errorLight,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _handleBookingDecision(
                    context,
                    ref,
                    booking: booking,
                    approve: true,
                  ),
                  icon: const Icon(Icons.check_rounded),
                  label: const Text('قبول'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primaryLight,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _UpcomingBookingCard extends ConsumerWidget {
  final RemoteRecitationBookingDto booking;

  const _UpcomingBookingCard({required this.booking});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                      booking.student.fullName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatSessionLine(booking.slot.startsAt),
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
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () =>
                      _showCompleteBookingSheet(context, ref, booking: booking),
                  icon: const Icon(Icons.menu_book_outlined),
                  label: const Text('تقييم'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primaryLight,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () =>
                      _launchExternalLink(context, booking.slot.joinUrl),
                  icon: const Icon(Icons.link_rounded),
                  label: const Text('انضمام للجلسة'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.infoLight,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CompletedBookingCard extends StatelessWidget {
  final RemoteRecitationBookingDto booking;

  const _CompletedBookingCard({required this.booking});

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
                      booking.student.fullName,
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
                  _followUpSummary(followUp),
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

class _TabLabel extends StatelessWidget {
  final String title;
  final int badgeCount;

  const _TabLabel({
    required this.title,
    this.badgeCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(title),
        if (badgeCount > 0) ...[
          const SizedBox(width: 6),
          Container(
            constraints: const BoxConstraints(minWidth: 20),
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFD24B43),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '$badgeCount',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ],
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

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F7F4),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primaryLight),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundAvatar extends StatelessWidget {
  final String label;

  const _RoundAvatar({required this.label});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 22,
      backgroundColor: AppColors.primaryLight,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
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

String _formatTimeRange(DateTime start, DateTime end) {
  final format = DateFormat('HH:mm', 'ar');
  return '${format.format(start)} - ${format.format(end)}';
}

String _formatSessionLine(DateTime start) {
  final day = DateFormat('EEEE', 'ar').format(start);
  final time = DateFormat('HH:mm', 'ar').format(start);
  return '$day - $time';
}

String _followUpSummary(RemoteRecitationFollowUpDto? followUp) {
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

String _firstLetter(String value) {
  final trimmed = value.trim();
  return trimmed.isEmpty ? 'ط' : trimmed.characters.first;
}

Future<void> _launchExternalLink(BuildContext context, String? url) async {
  if (url == null || url.trim().isEmpty) {
    _showSnackBar(context, 'لا يوجد رابط متاح لهذه الجلسة.');
    return;
  }

  final uri = Uri.tryParse(url);
  if (uri == null) {
    _showSnackBar(context, 'الرابط غير صالح.');
    return;
  }

  final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    _showSnackBar(context, 'تعذر فتح الرابط الخارجي.');
  }
}

Future<void> _deleteSlot(
  BuildContext context,
  WidgetRef ref,
  RemoteRecitationSlotDto slot,
) async {
  final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('حذف الموعد'),
          content: const Text(
            'سيتم إخفاء هذا الموعد من شاشة الحجز. هل تريد المتابعة؟',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('حذف'),
            ),
          ],
        ),
      ) ??
      false;

  if (!confirmed) {
    return;
  }

  try {
    await ref.read(remoteRecitationRemoteDataSourceProvider).deleteSlot(
          slotId: slot.id,
          lockVersion: slot.lockVersion,
        );
    ref.read(remoteRecitationRefreshProvider.notifier).state++;
    if (context.mounted) {
      _showSnackBar(context, 'تم حذف الموعد بنجاح.');
    }
  } catch (error) {
    if (context.mounted) {
      _showSnackBar(context, 'تعذر حذف الموعد: $error');
    }
  }
}

Future<void> _handleBookingDecision(
  BuildContext context,
  WidgetRef ref, {
  required RemoteRecitationBookingDto booking,
  required bool approve,
}) async {
  try {
    if (approve) {
      await ref.read(remoteRecitationRemoteDataSourceProvider).approveBooking(
            bookingId: booking.id,
            lockVersion: booking.lockVersion,
          );
    } else {
      await ref.read(remoteRecitationRemoteDataSourceProvider).rejectBooking(
            bookingId: booking.id,
            lockVersion: booking.lockVersion,
          );
    }

    ref.read(remoteRecitationRefreshProvider.notifier).state++;
    if (context.mounted) {
      _showSnackBar(context, approve ? 'تم قبول الطلب.' : 'تم رفض الطلب.');
    }
  } catch (error) {
    if (context.mounted) {
      _showSnackBar(context, 'تعذر تحديث الطلب: $error');
    }
  }
}

Future<void> _showCreateSlotSheet(
  BuildContext context,
  WidgetRef ref, {
  required int circleId,
  required RemoteRecitationSettingsDto settings,
}) async {
  final joinUrlController = TextEditingController();
  final noteController = TextEditingController();
  DateTime? selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay? selectedTime = const TimeOfDay(hour: 16, minute: 0);
  bool submitting = false;

  try {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setState) {
            final start = _combineDateAndTime(selectedDate, selectedTime);
            final end = start?.add(
              Duration(minutes: settings.slotDurationMinutes),
            );

            return Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.md,
                MediaQuery.of(sheetContext).viewInsets.bottom + AppSpacing.md,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'إضافة موعد جديد',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('التاريخ'),
                      subtitle: Text(
                        selectedDate == null
                            ? 'اختر تاريخ الموعد'
                            : DateFormat(
                                'EEEE d MMMM y',
                                'ar',
                              ).format(selectedDate!),
                      ),
                      trailing: const Icon(Icons.calendar_today_outlined),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: sheetContext,
                          initialDate: selectedDate ?? DateTime.now(),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(
                            Duration(days: settings.maxAdvanceDays),
                          ),
                        );
                        if (picked != null) {
                          setState(() => selectedDate = picked);
                        }
                      },
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('الوقت'),
                      subtitle: Text(
                        selectedTime == null
                            ? 'اختر وقت البداية'
                            : selectedTime!.format(sheetContext),
                      ),
                      trailing: const Icon(Icons.schedule_outlined),
                      onTap: () async {
                        final picked = await showTimePicker(
                          context: sheetContext,
                          initialTime: selectedTime ?? TimeOfDay.now(),
                        );
                        if (picked != null) {
                          setState(() => selectedTime = picked);
                        }
                      },
                    ),
                    if (end != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: Text(
                          'ينتهي الموعد تلقائياً عند '
                          '${DateFormat('HH:mm', 'ar').format(end)}',
                          style: const TextStyle(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ),
                    TextField(
                      controller: joinUrlController,
                      decoration: const InputDecoration(
                        labelText: 'رابط الجلسة الخارجي',
                        hintText: 'https://meet.google.com/...',
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    TextField(
                      controller: noteController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'ملاحظة داخلية',
                        hintText: 'اختياري',
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    FilledButton.icon(
                      onPressed: submitting
                          ? null
                          : () async {
                              final startDateTime = _combineDateAndTime(
                                  selectedDate, selectedTime);
                              if (startDateTime == null) {
                                _showSnackBar(
                                  sheetContext,
                                  'حدد التاريخ والوقت أولاً.',
                                );
                                return;
                              }

                              if (joinUrlController.text.trim().isEmpty) {
                                _showSnackBar(
                                  sheetContext,
                                  'أدخل رابط الجلسة الخارجي.',
                                );
                                return;
                              }

                              final endDateTime = startDateTime.add(
                                Duration(minutes: settings.slotDurationMinutes),
                              );

                              setState(() => submitting = true);
                              try {
                                await ref
                                    .read(
                                      remoteRecitationRemoteDataSourceProvider,
                                    )
                                    .createSlot(
                                      circleId: circleId,
                                      startsAt: startDateTime.toIso8601String(),
                                      endsAt: endDateTime.toIso8601String(),
                                      joinUrl: joinUrlController.text.trim(),
                                      note: noteController.text.trim(),
                                    );
                                ref
                                    .read(
                                      remoteRecitationRefreshProvider.notifier,
                                    )
                                    .state++;
                                if (sheetContext.mounted) {
                                  Navigator.of(sheetContext).pop();
                                }
                                if (context.mounted) {
                                  _showSnackBar(
                                    context,
                                    'تمت إضافة الموعد بنجاح.',
                                  );
                                }
                              } catch (error) {
                                if (sheetContext.mounted) {
                                  setState(() => submitting = false);
                                  _showSnackBar(
                                    sheetContext,
                                    'تعذر إضافة الموعد: $error',
                                  );
                                }
                              }
                            },
                      icon: submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.add_rounded),
                      label: const Text('إضافة الموعد'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  } finally {
    joinUrlController.dispose();
    noteController.dispose();
  }
}

Future<void> _showCompleteBookingSheet(
  BuildContext context,
  WidgetRef ref, {
  required RemoteRecitationBookingDto booking,
}) async {
  final surahController = TextEditingController();
  final fromSurahController = TextEditingController();
  final fromAyahController = TextEditingController();
  final toSurahController = TextEditingController();
  final toAyahController = TextEditingController();
  final ratingController = TextEditingController();
  final matnNameController = TextEditingController();
  final matnStatusController = TextEditingController();
  final notesController = TextEditingController();
  String selectedType = 'NEW_MEMORIZATION';
  bool submitting = false;

  try {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setState) {
            final isMatn = selectedType == 'MATN';

            return Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.md,
                MediaQuery.of(sheetContext).viewInsets.bottom + AppSpacing.md,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'تقييم الجلسة',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    DropdownButtonFormField<String>(
                      initialValue: selectedType,
                      decoration: const InputDecoration(
                        labelText: 'نوع التسميع',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'NEW_MEMORIZATION',
                          child: Text('حفظ جديد'),
                        ),
                        DropdownMenuItem(
                          value: 'REVIEW',
                          child: Text('مراجعة'),
                        ),
                        DropdownMenuItem(
                          value: 'MATN',
                          child: Text('متن'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => selectedType = value);
                        }
                      },
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    if (!isMatn) ...[
                      TextField(
                        controller: surahController,
                        decoration: const InputDecoration(
                          labelText: 'اسم السورة أو وصف المقطع',
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: fromSurahController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'من سورة',
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: TextField(
                              controller: fromAyahController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'من آية',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: toSurahController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'إلى سورة',
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: TextField(
                              controller: toAyahController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'إلى آية',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      TextField(
                        controller: matnNameController,
                        decoration: const InputDecoration(
                          labelText: 'اسم المتن',
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      TextField(
                        controller: matnStatusController,
                        decoration: const InputDecoration(
                          labelText: 'حالة المتن',
                        ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.sm),
                    TextField(
                      controller: ratingController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'التقييم من 100',
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    TextField(
                      controller: notesController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'ملاحظات',
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    FilledButton.icon(
                      onPressed: submitting
                          ? null
                          : () async {
                              final rating = _parseInt(
                                ratingController.text,
                              );
                              if (rating != null &&
                                  (rating < 1 || rating > 100)) {
                                _showSnackBar(
                                  sheetContext,
                                  'التقييم يجب أن يكون بين 1 و100.',
                                );
                                return;
                              }

                              final fromSurah =
                                  _parseInt(fromSurahController.text);
                              final fromAyah =
                                  _parseInt(fromAyahController.text);
                              final toSurah = _parseInt(toSurahController.text);
                              final toAyah = _parseInt(toAyahController.text);
                              final hasAnyRange = fromSurah != null ||
                                  fromAyah != null ||
                                  toSurah != null ||
                                  toAyah != null;
                              final hasFullRange = fromSurah != null &&
                                  fromAyah != null &&
                                  toSurah != null &&
                                  toAyah != null;

                              final payload = <String, dynamic>{
                                'type': selectedType,
                                'recordDate': DateFormat(
                                  'yyyy-MM-dd',
                                ).format(booking.slot.startsAt),
                                'lockVersion': booking.lockVersion,
                              };

                              if (rating != null) {
                                payload['rating'] = rating;
                              }

                              final notes = notesController.text.trim();
                              if (notes.isNotEmpty) {
                                payload['notes'] = notes;
                              }

                              if (isMatn) {
                                final matnName = matnNameController.text.trim();
                                if (matnName.isEmpty) {
                                  _showSnackBar(
                                    sheetContext,
                                    'أدخل اسم المتن أولاً.',
                                  );
                                  return;
                                }
                                payload['matnName'] = matnName;

                                final matnStatus =
                                    matnStatusController.text.trim();
                                if (matnStatus.isNotEmpty) {
                                  payload['matnStatus'] = matnStatus;
                                }
                              } else {
                                final surah = surahController.text.trim();
                                if (hasAnyRange && !hasFullRange) {
                                  _showSnackBar(
                                    sheetContext,
                                    'أدخل نطاق الآيات كاملاً أو اتركه فارغاً.',
                                  );
                                  return;
                                }
                                if (surah.isEmpty && !hasFullRange) {
                                  _showSnackBar(
                                    sheetContext,
                                    'أدخل اسم السورة أو نطاق الحفظ.',
                                  );
                                  return;
                                }
                                if (surah.isNotEmpty) {
                                  payload['surah'] = surah;
                                }
                                if (hasFullRange) {
                                  payload['fromSurah'] = fromSurah;
                                  payload['fromAyah'] = fromAyah;
                                  payload['toSurah'] = toSurah;
                                  payload['toAyah'] = toAyah;
                                }
                              }

                              setState(() => submitting = true);
                              try {
                                await ref
                                    .read(
                                      remoteRecitationRemoteDataSourceProvider,
                                    )
                                    .completeBooking(
                                      bookingId: booking.id,
                                      payload: payload,
                                    );
                                ref
                                    .read(
                                      remoteRecitationRefreshProvider.notifier,
                                    )
                                    .state++;
                                if (sheetContext.mounted) {
                                  Navigator.of(sheetContext).pop();
                                }
                                if (context.mounted) {
                                  _showSnackBar(
                                    context,
                                    'تم حفظ تقييم الجلسة بنجاح.',
                                  );
                                }
                              } catch (error) {
                                if (sheetContext.mounted) {
                                  setState(() => submitting = false);
                                  _showSnackBar(
                                    sheetContext,
                                    'تعذر حفظ التقييم: $error',
                                  );
                                }
                              }
                            },
                      icon: submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check_rounded),
                      label: const Text('حفظ التقييم'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primaryLight,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  } finally {
    surahController.dispose();
    fromSurahController.dispose();
    fromAyahController.dispose();
    toSurahController.dispose();
    toAyahController.dispose();
    ratingController.dispose();
    matnNameController.dispose();
    matnStatusController.dispose();
    notesController.dispose();
  }
}

DateTime? _combineDateAndTime(DateTime? date, TimeOfDay? time) {
  if (date == null || time == null) {
    return null;
  }

  return DateTime(
    date.year,
    date.month,
    date.day,
    time.hour,
    time.minute,
  );
}

int? _parseInt(String value) {
  final normalized = value.trim();
  if (normalized.isEmpty) {
    return null;
  }

  return int.tryParse(normalized);
}

void _showSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message)),
  );
}
