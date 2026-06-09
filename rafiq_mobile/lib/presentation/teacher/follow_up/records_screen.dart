import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../application/auth/auth_providers.dart';
import '../../../../application/context/context_controller.dart';
import '../../../../core/constants/app_spacing.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/data_parsing_helper.dart';
import '../../shared/states/app_empty_state.dart';
import '../../shared/states/app_error_state.dart';
import '../../shared/states/app_loading_state.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/standard_app_bar.dart';

class _RecordEntry {
  final String student;
  final String type;
  final String detail;
  final int stars;

  const _RecordEntry({
    required this.student,
    required this.type,
    required this.detail,
    required this.stars,
  });
}

class _DailyRecord {
  final DateTime date;
  final List<_RecordEntry> entries;

  const _DailyRecord({
    required this.date,
    required this.entries,
  });
}

final _teacherRecordsProvider =
    FutureProvider.autoDispose<List<_DailyRecord>>((ref) async {
  final circleId = int.tryParse(
    ref.watch(contextControllerProvider).selectedCircleId ?? '',
  );
  if (circleId == null) {
    return const <_DailyRecord>[];
  }

  final dio = ref.watch(apiClientProvider);
  final to = DateTime.now();
  final from = to.subtract(const Duration(days: 20));
  final items = <Map<String, dynamic>>[];
  const pageSize = 100;

  for (var page = 1; page <= 20; page++) {
    final response = await dio.get(
      '/follow-ups',
      queryParameters: {
        'circleId': circleId,
        'from': DateFormat('yyyy-MM-dd').format(from),
        'to': DateFormat('yyyy-MM-dd').format(to),
        'page': page,
        'pageSize': pageSize,
      },
    );

    final payload = DataParsingHelper.asMap(response.data);
    final data = DataParsingHelper.asMap(payload['data']);
    final pageItems = DataParsingHelper.asMapList(data['data']);
    items.addAll(pageItems);

    final total = DataParsingHelper.readInt(data['total']) ?? 0;
    if ((total > 0 && items.length >= total) || pageItems.length < pageSize) {
      break;
    }
  }

  final grouped = <String, List<_RecordEntry>>{};
  final dates = <String, DateTime>{};

  for (final item in items) {
    final recordDate = DateTime.tryParse(item['recordDate']?.toString() ?? '');
    if (recordDate == null) {
      continue;
    }
    final key = DateFormat('yyyy-MM-dd').format(recordDate);
    dates[key] = recordDate;
    grouped.putIfAbsent(key, () => <_RecordEntry>[]).add(
          _RecordEntry(
            student: DataParsingHelper.asMap(item['student'])['fullName']?.toString() ?? 'طالب',
            type: DataParsingHelper.followUpTypeLabel(item['type']),
            detail: DataParsingHelper.formatFollowUpMap(item),
            stars: DataParsingHelper.ratingToStars(item['rating']),
          ),
        );
  }

  final output = grouped.entries
      .map(
        (entry) => _DailyRecord(
          date: dates[entry.key]!,
          entries: entry.value,
        ),
      )
      .toList(growable: false)
    ..sort((a, b) => b.date.compareTo(a.date));

  return output;
});

class RecordsScreen extends ConsumerWidget {
  const RecordsScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(_teacherRecordsProvider);
    await ref.read(_teacherRecordsProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordsAsync = ref.watch(_teacherRecordsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: const StandardAppBar(title: 'السجل اليومي'),
      body: recordsAsync.when(
        loading: () => const AppLoadingState(
          message: 'جار تحميل سجل الحلقة...',
        ),
        error: (error, _) => AppErrorState(
          title: 'تعذر تحميل السجل',
          message: error.toString(),
          onRetry: () => _refresh(ref),
        ),
        data: (records) => RefreshIndicator(
          onRefresh: () => _refresh(ref),
          child: records.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [
                    SizedBox(height: 120),
                    AppEmptyState(
                      title: 'لا توجد سجلات متابعة',
                      subtitle:
                          'ستظهر هنا سجلات الحفظ والمراجعة والمتون المسجلة للحلقة خلال الفترة الأخيرة.',
                      icon: Icons.history_toggle_off_rounded,
                    ),
                  ],
                )
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: records.length,
                  itemBuilder: (context, index) {
                    final day = records[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.calendar_month_rounded,
                                size: 16,
                                color: AppColors.textSecondaryLight,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                DateFormat('EEEE، d MMMM', 'ar')
                                    .format(day.date),
                                style: const TextStyle(
                                  color: AppColors.textSecondaryLight,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          ...day.entries.map(
                            (entry) => Padding(
                              padding:
                                  const EdgeInsets.only(bottom: AppSpacing.sm),
                              child: AppCard(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            entry.student,
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Wrap(
                                            spacing: 8,
                                            runSpacing: 8,
                                            children: [
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                  horizontal: 10,
                                                  vertical: 5,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: DataParsingHelper.followUpTypeColor(entry.type)
                                                      .withValues(alpha: 0.10),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          999),
                                                ),
                                                child: Text(
                                                  entry.type,
                                                  style: TextStyle(
                                                    color:
                                                        DataParsingHelper.followUpTypeColor(entry.type),
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ),
                                              Text(
                                                entry.detail,
                                                style: const TextStyle(
                                                  color: AppColors
                                                      .textSecondaryLight,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: List.generate(
                                        5,
                                        (starIndex) => Icon(
                                          Icons.star_rounded,
                                          size: 16,
                                          color: starIndex < entry.stars
                                              ? AppColors.warningLight
                                              : AppColors.borderLight,
                                        ),
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
                  },
                ),
        ),
      ),
    );
  }
}
