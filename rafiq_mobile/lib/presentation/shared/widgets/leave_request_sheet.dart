import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';

class LeaveRequestSheet extends StatefulWidget {
  final List<String> leaveTypes;
  final TextEditingController noteController;
  final TextEditingController startDateController;
  final TextEditingController endDateController;
  final Map<String, String> leaveTypeLabels;
  final Function(String type) onSubmit;
  final VoidCallback onCancel;

  const LeaveRequestSheet({
    super.key,
    required this.leaveTypes,
    required this.noteController,
    required this.startDateController,
    required this.endDateController,
    this.leaveTypeLabels = const {},
    required this.onSubmit,
    required this.onCancel,
  });

  @override
  State<LeaveRequestSheet> createState() => _LeaveRequestSheetState();
}

class _LeaveRequestSheetState extends State<LeaveRequestSheet> {
  String? _selectedType;

  bool get _canSubmit {
    return _selectedType != null &&
        widget.startDateController.text.trim().isNotEmpty &&
        widget.endDateController.text.trim().isNotEmpty &&
        widget.noteController.text.trim().length >= 5;
  }

  Future<void> _selectDate(
      BuildContext context, TextEditingController controller) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      if (!mounted) return;
      setState(() {
        controller.text =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'طلب إجازة',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: context.textPrimaryColor,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'نوع الإجازة',
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: context.textSecondaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: context.isDark
                      ? theme.colorScheme.surfaceContainerHighest
                      : AppColors.surfaceVariantLight,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: context.borderColor),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedType,
                    dropdownColor: context.cardColor,
                    isExpanded: true,
                    hint: Text(
                      'اختر نوع الإجازة',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: context.textSecondaryColor,
                      ),
                    ),
                    items: widget.leaveTypes.map((t) {
                      return DropdownMenuItem(
                        value: t,
                        child: Text(
                          widget.leaveTypeLabels[t] ?? t,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: context.textPrimaryColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() => _selectedType = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'تاريخ البداية',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: context.textSecondaryColor,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: widget.startDateController,
                          readOnly: true,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: context.textPrimaryColor,
                            fontWeight: FontWeight.w600,
                          ),
                          onTap: () =>
                              _selectDate(context, widget.startDateController),
                          decoration: InputDecoration(
                            hintText: 'YYYY-MM-DD',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppRadius.lg),
                              borderSide: BorderSide(color: context.borderColor),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'تاريخ النهاية',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: context.textSecondaryColor,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: widget.endDateController,
                          readOnly: true,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: context.textPrimaryColor,
                            fontWeight: FontWeight.w600,
                          ),
                          onTap: () =>
                              _selectDate(context, widget.endDateController),
                          decoration: InputDecoration(
                            hintText: 'YYYY-MM-DD',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppRadius.lg),
                              borderSide: BorderSide(color: context.borderColor),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'ملاحظات (اختياري)',
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: context.textSecondaryColor,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: widget.noteController,
                maxLines: 3,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: context.textPrimaryColor,
                ),
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'اكتب سبب الإجازة هنا...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    borderSide: BorderSide(color: context.borderColor),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                        ),
                      ),
                      onPressed: widget.onCancel,
                      child: Text(
                        'إلغاء',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: context.textSecondaryColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: theme.colorScheme.onPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                        ),
                      ),
                      onPressed: _canSubmit
                          ? () => widget.onSubmit(_selectedType!)
                          : null,
                      child: const Text(
                        'تقديم الطلب',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
