import 'package:flutter/material.dart';

import '../../../core/constants/app_radius.dart';
import '../../../core/theme/app_colors.dart';

/// TaskItem - Used for today's tasks
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
    final successColor = context.customColors.success;
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: context.cardColor,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: context.borderColor),
          ),
          child: Row(
            children: [
              GestureDetector(
                onTap: onChanged != null ? () => onChanged!(!done) : null,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: done ? successColor : Colors.transparent,
                    border: Border.all(
                      color: done ? successColor : context.borderColor,
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
              Expanded(
                child: Text(
                  text,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: done
                        ? context.textSecondaryColor
                        : context.textPrimaryColor,
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
    final successColor = context.customColors.success;
    final borderColor = context.borderColor;

    return GestureDetector(
      onTap: _toggle,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: borderColor),
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
                      successColor,
                      _controller.value,
                    ),
                    border: Border.all(
                      color: Color.lerp(
                        borderColor,
                        successColor,
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
                      fontWeight: FontWeight.w600,
                      color: _done
                          ? context.textSecondaryColor
                          : context.textPrimaryColor,
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
