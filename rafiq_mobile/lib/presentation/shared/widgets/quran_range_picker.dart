// lib/presentation/shared/widgets/quran_range_picker.dart
//
// ويدجت موحدة لاختيار نطاق قرآني (سورة + آية) مع:
//  • قائمة منسدلة للسورة (مقيدة بالاتجاه إذا لزم)
//  • حقل رقمي للآية مقيّد تلقائياً بعدد آيات السورة المختارة
//  • تقديم عدد الصفحات التقديري فورياً
//  • عرض النطاق المختصر "من سورة X آية A إلى سورة Y آية B"

import 'package:flutter/material.dart';

import '../../../core/constants/quran_data.dart';
import '../../../core/theme/app_colors.dart';

class QuranRangeValue {
  final int? fromSurah;
  final int? fromAyah;
  final int? toSurah;
  final int? toAyah;

  const QuranRangeValue({
    this.fromSurah,
    this.fromAyah,
    this.toSurah,
    this.toAyah,
  });

  bool get isComplete =>
      fromSurah != null &&
      fromAyah != null &&
      toSurah != null &&
      toAyah != null;

  /// الصفحات التقديرية من بيانات المصحف المحلية
  double get estimatedPages {
    if (!isComplete) return 0;
    return QuranData.estimatePagesRange(
      fromSurahNumber: fromSurah!,
      fromAyah: fromAyah!,
      toSurahNumber: toSurah!,
      toAyah: toAyah!,
    );
  }

  /// نص النطاق المختصر
  String get rangeLabel {
    if (!isComplete) return '';
    final from = QuranData.findByNumber(fromSurah!);
    final to = QuranData.findByNumber(toSurah!);
    if (from == null || to == null) return '';
    return 'من سورة ${from.name} الآية $fromAyah إلى سورة ${to.name} الآية $toAyah';
  }

  QuranRangeValue copyWith({
    int? fromSurah,
    int? fromAyah,
    int? toSurah,
    int? toAyah,
  }) {
    return QuranRangeValue(
      fromSurah: fromSurah ?? this.fromSurah,
      fromAyah: fromAyah ?? this.fromAyah,
      toSurah: toSurah ?? this.toSurah,
      toAyah: toAyah ?? this.toAyah,
    );
  }
}

/// ويدجت اختيار النطاق القرآني الموحدة.
/// يُوفّر:
///  - اختيار "من سورة" → "من آية" مع تقييد آلي لعدد الآيات
///  - اختيار "إلى سورة" → "إلى آية" مع تقييد آلي
///  - تقدير الصفحات فورياً
///  - رسالة خطأ عند ترتيب غير سليم
class QuranRangePicker extends StatefulWidget {
  final QuranRangeValue value;
  final ValueChanged<QuranRangeValue> onChanged;
  final Color accent;
  final bool showPageEstimate;
  final String? fromLabel;
  final String? toLabel;

  const QuranRangePicker({
    super.key,
    required this.value,
    required this.onChanged,
    this.accent = AppColors.primaryLight,
    this.showPageEstimate = true,
    this.fromLabel,
    this.toLabel,
  });

  @override
  State<QuranRangePicker> createState() => _QuranRangePickerState();
}

class _QuranRangePickerState extends State<QuranRangePicker> {
  late final TextEditingController _fromAyahCtrl;
  late final TextEditingController _toAyahCtrl;

  QuranRangeValue get _val => widget.value;

  @override
  void initState() {
    super.initState();
    _fromAyahCtrl = TextEditingController(
      text: _val.fromAyah != null ? '${_val.fromAyah}' : '',
    );
    _toAyahCtrl = TextEditingController(
      text: _val.toAyah != null ? '${_val.toAyah}' : '',
    );
  }

  @override
  void didUpdateWidget(QuranRangePicker old) {
    super.didUpdateWidget(old);
    // Sync controllers if parent pushes new values
    if (old.value.fromAyah != widget.value.fromAyah) {
      final text =
          widget.value.fromAyah != null ? '${widget.value.fromAyah}' : '';
      if (_fromAyahCtrl.text != text) _fromAyahCtrl.text = text;
    }
    if (old.value.toAyah != widget.value.toAyah) {
      final text = widget.value.toAyah != null ? '${widget.value.toAyah}' : '';
      if (_toAyahCtrl.text != text) _toAyahCtrl.text = text;
    }
  }

  @override
  void dispose() {
    _fromAyahCtrl.dispose();
    _toAyahCtrl.dispose();
    super.dispose();
  }

  // ---------- helpers ----------

  int _maxAyah(int? surahNumber) {
    if (surahNumber == null) return 999;
    return QuranData.findByNumber(surahNumber)?.ayahCount ?? 999;
  }

  void _clampAndCommit({
    int? fromSurah,
    int? fromAyah,
    int? toSurah,
    int? toAyah,
  }) {
    final fromSurahChanged = fromSurah != null && fromSurah != _val.fromSurah;
    final toSurahChanged = toSurah != null && toSurah != _val.toSurah;
    final newFromSurah = fromSurah ?? _val.fromSurah;
    final newToSurah = toSurah ?? _val.toSurah;

    final maxFrom = _maxAyah(newFromSurah);
    final maxTo = _maxAyah(newToSurah);
    int? newFromAyah = fromSurahChanged
        ? (newFromSurah == null ? null : 1)
        : (fromAyah ?? _val.fromAyah);
    int? newToAyah = toSurahChanged
        ? (newToSurah == null ? null : maxTo)
        : (toAyah ?? _val.toAyah);

    if (newFromAyah != null && newFromAyah > maxFrom) {
      newFromAyah = maxFrom;
    }
    if (newToAyah != null && newToAyah > maxTo) {
      newToAyah = maxTo;
    }

    _fromAyahCtrl.text = newFromAyah != null ? '$newFromAyah' : '';
    _toAyahCtrl.text = newToAyah != null ? '$newToAyah' : '';

    widget.onChanged(QuranRangeValue(
      fromSurah: newFromSurah,
      fromAyah: newFromAyah,
      toSurah: newToSurah,
      toAyah: newToAyah,
    ));
  }

  String? get _orderError {
    final v = _val;
    if (!v.isComplete) return null;
    final inOrder = v.fromSurah! < v.toSurah! ||
        (v.fromSurah == v.toSurah && v.fromAyah! <= v.toAyah!);
    return inOrder ? null : 'نطاق السورة من → إلى غير صحيح';
  }

  // ---------- build ----------

  @override
  Widget build(BuildContext context) {
    final fromMaxAyah = _maxAyah(_val.fromSurah);
    final toMaxAyah = _maxAyah(_val.toSurah);
    final orderErr = _orderError;
    final pages = _val.estimatedPages;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── From row ──
        Text(
          widget.fromLabel ?? 'من',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              flex: 3,
              child: _SurahDropdown(
                label: 'السورة',
                value: _val.fromSurah,
                accent: widget.accent,
                onChanged: (v) => _clampAndCommit(fromSurah: v),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: _AyahField(
                label: 'الآية',
                controller: _fromAyahCtrl,
                maxAyah: fromMaxAyah,
                accent: widget.accent,
                onChanged: (v) => _clampAndCommit(fromAyah: v),
              ),
            ),
          ],
        ),

        const SizedBox(height: 10),

        // ── To row ──
        Text(
          widget.toLabel ?? 'إلى',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: AppColors.textSecondaryLight,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              flex: 3,
              child: _SurahDropdown(
                label: 'السورة',
                value: _val.toSurah,
                accent: widget.accent,
                minSurahNumber: _val.fromSurah,
                onChanged: (v) => _clampAndCommit(toSurah: v),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: _AyahField(
                label: 'الآية',
                controller: _toAyahCtrl,
                maxAyah: toMaxAyah,
                accent: widget.accent,
                onChanged: (v) => _clampAndCommit(toAyah: v),
              ),
            ),
          ],
        ),

        // ── Order error ──
        if (orderErr != null) ...[
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded,
                  size: 14, color: AppColors.errorLight),
              const SizedBox(width: 4),
              Text(
                orderErr,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.errorLight,
                ),
              ),
            ],
          ),
        ],

        // ── Range label + page estimate ──
        if (_val.isComplete && orderErr == null) ...[
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: widget.accent.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: widget.accent.withValues(alpha: 0.18)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _val.rangeLabel,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: widget.accent,
                  ),
                ),
                if (widget.showPageEstimate && pages > 0) ...[
                  const SizedBox(height: 4),
                  Text(
                    'الصفحات التقديرية: ${pages.toStringAsFixed(1)} صفحة',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                      color: widget.accent.withValues(alpha: 0.75),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ─── Internal: SurahDropdown ─────────────────────────

class _SurahDropdown extends StatelessWidget {
  final String label;
  final int? value;
  final Color accent;
  final int? minSurahNumber;
  final ValueChanged<int?> onChanged;

  const _SurahDropdown({
    required this.label,
    required this.value,
    required this.accent,
    required this.onChanged,
    this.minSurahNumber,
  });

  @override
  Widget build(BuildContext context) {
    final surahs = minSurahNumber == null
        ? QuranData.surahs
        : QuranData.surahs
            .where((s) => s.number >= minSurahNumber!)
            .toList(growable: false);

    return DropdownButtonFormField<int>(
      key: ValueKey('surah-$label-$value-$minSurahNumber'),
      initialValue: (value != null && surahs.any((s) => s.number == value))
          ? value
          : null,
      isExpanded: true,
      icon: const Icon(Icons.keyboard_arrow_down_rounded,
          color: AppColors.textSecondaryLight, size: 20),
      decoration: _fieldDecoration(accent).copyWith(
        labelText: label,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      items: surahs
          .map((s) => DropdownMenuItem<int>(
                value: s.number,
                child: Text(
                  s.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ))
          .toList(growable: false),
      onChanged: onChanged,
    );
  }
}

// ─── Internal: AyahField ─────────────────────────

class _AyahField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final int maxAyah;
  final Color accent;
  final ValueChanged<int?> onChanged;

  const _AyahField({
    required this.label,
    required this.controller,
    required this.maxAyah,
    required this.accent,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = maxAyah < 999;

    return TextField(
      controller: controller,
      readOnly: true,
      textAlign: TextAlign.center,
      onTap: !isEnabled
          ? null
          : () async {
              final selected = await showModalBottomSheet<int>(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (sheetContext) => _AyahSelectionSheet(
                  title: label,
                  maxAyah: maxAyah,
                  initialValue: int.tryParse(controller.text.trim()),
                ),
              );
              if (selected == null) {
                return;
              }
              controller.text = '$selected';
              controller.selection = TextSelection.collapsed(
                offset: controller.text.length,
              );
              onChanged(selected);
            },
      decoration: _fieldDecoration(accent).copyWith(
        labelText: label,
        hintText: isEnabled ? '1-$maxAyah' : 'اختر السورة أولاً',
        suffixIcon: const Icon(
          Icons.keyboard_arrow_down_rounded,
          color: AppColors.textSecondaryLight,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      ),
      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
    );
  }
}

class _AyahSelectionSheet extends StatefulWidget {
  final String title;
  final int maxAyah;
  final int? initialValue;

  const _AyahSelectionSheet({
    required this.title,
    required this.maxAyah,
    required this.initialValue,
  });

  @override
  State<_AyahSelectionSheet> createState() => _AyahSelectionSheetState();
}

class _AyahSelectionSheetState extends State<_AyahSelectionSheet> {
  late final TextEditingController _searchController;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _query = '';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<int> get _ayahs {
    final query = _query.trim();
    final all = List<int>.generate(widget.maxAyah, (index) => index + 1);
    if (query.isEmpty) {
      return all;
    }
    return all
        .where((ayah) => ayah.toString().contains(query))
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final ayahs = _ayahs;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD9DDD4),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'اختيار ${widget.title}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${widget.maxAyah} آية',
                        style: const TextStyle(
                          color: AppColors.primaryLight,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _searchController,
                  keyboardType: TextInputType.number,
                  autofocus: true,
                  decoration: const InputDecoration(
                    hintText: 'اكتب رقم الآية للبحث السريع',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                  onChanged: (value) {
                    setState(() => _query = value);
                  },
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 320,
                  child: ayahs.isEmpty
                      ? const Center(
                          child: Text(
                            'رقم الآية غير موجود في هذه السورة',
                            style: TextStyle(
                              color: AppColors.textSecondaryLight,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        )
                      : ListView.separated(
                          itemCount: ayahs.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final ayah = ayahs[index];
                            final selected = ayah == widget.initialValue;
                            return ListTile(
                              onTap: () => Navigator.of(context).pop(ayah),
                              title: Text(
                                'الآية $ayah',
                                style: TextStyle(
                                  fontWeight: selected
                                      ? FontWeight.w900
                                      : FontWeight.w700,
                                ),
                              ),
                              trailing: selected
                                  ? const Icon(
                                      Icons.check_rounded,
                                      color: AppColors.primaryLight,
                                    )
                                  : null,
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Shared decoration ─────────────────────────

InputDecoration _fieldDecoration(Color accent) {
  return InputDecoration(
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFE0E4DA)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFE0E4DA)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: accent, width: 1.8),
    ),
    labelStyle: const TextStyle(
      color: AppColors.textSecondaryLight,
      fontSize: 13,
      fontWeight: FontWeight.w600,
    ),
    hintStyle: const TextStyle(
      color: AppColors.textSecondaryLight,
      fontSize: 12,
    ),
  );
}
