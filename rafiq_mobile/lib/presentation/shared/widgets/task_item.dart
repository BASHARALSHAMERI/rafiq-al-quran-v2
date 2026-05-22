import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// TaskItem - Used in TeacherHome for today's tasks
///
/// Layout: [Checkbox] Task text (strikethrough if done)
/// Style: Card with subtle border
class TaskItem extends StatelessWidget {
  final String text;
  final bool done;
  final ValueChanged<bool>? onChanged;
  final VoidCallback? onTap;

  const TaskItem({
    super.key,
    required this.text,
    this.done = false,
    this.onChanged,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: isDark ? AppColors.cardDark : AppColors.cardLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: (isDark ? AppColors.borderDark : AppColors.borderLight)
                  .withValues(alpha: 0.5),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.08 : 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // Custom checkbox
              GestureDetector(
                onTap: onChanged != null ? () => onChanged!(!done) : null,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: done
                        ? (isDark
                            ? AppColors.successDark
                            : AppColors.successLight)
                        : Colors.transparent,
                    border: Border.all(
                      color: done
                          ? (isDark
                              ? AppColors.successDark
                              : AppColors.successLight)
                          : (isDark
                              ? AppColors.borderDark
                              : AppColors.borderLight),
                      width: 2,
                    ),
                  ),
                  child: done
                      ? const Icon(
                          Icons.check,
                          size: 14,
                          color: Colors.white,
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 12),
              // Task text
              Expanded(
                child: Text(
                  text,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontSize: 13,
                        color: done
                            ? (isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight)
                            : (isDark
                                ? AppColors.textPrimaryDark
                                : AppColors.textPrimaryLight),
                        decoration: done ? TextDecoration.lineThrough : null,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Interactive version with animation
class TaskItemInteractive extends StatefulWidget {
  final String text;
  final bool initialDone;
  final ValueChanged<bool>? onChanged;

  const TaskItemInteractive({
    super.key,
    required this.text,
    this.initialDone = false,
    this.onChanged,
  });

  @override
  State<TaskItemInteractive> createState() => _TaskItemInteractiveState();
}

class _TaskItemInteractiveState extends State<TaskItemInteractive>
    with SingleTickerProviderStateMixin {
  late bool _done;
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _done = widget.initialDone;
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    if (_done) {
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _done = !_done;
      if (_done) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
    widget.onChanged?.call(_done);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: _toggle,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.cardLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: (isDark ? AppColors.borderDark : AppColors.borderLight)
                .withValues(alpha: 0.5),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.08 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color.lerp(
                      Colors.transparent,
                      isDark ? AppColors.successDark : AppColors.successLight,
                      _controller.value,
                    ),
                    border: Border.all(
                      color: Color.lerp(
                        isDark ? AppColors.borderDark : AppColors.borderLight,
                        isDark ? AppColors.successDark : AppColors.successLight,
                        _controller.value,
                      )!,
                      width: 2,
                    ),
                  ),
                  child: _controller.value > 0.5
                      ? const Icon(
                          Icons.check,
                          size: 14,
                          color: Colors.white,
                        )
                      : null,
                );
              },
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                      fontSize: 13,
                      color: _done
                          ? (isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight)
                          : (isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight),
                      decoration: _done ? TextDecoration.lineThrough : null,
                    ),
                child: Text(widget.text),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
