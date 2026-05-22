import 'package:flutter/material.dart';
import '../../../core/theme/app_animations.dart';

/// بطاقة رقمية متحركة (AnimatedCounter)
/// الرقم يتحرك بسلاسة من قيمة إلى أخرى
class AnimatedCounter extends StatefulWidget {
  final num value;
  final String? prefix;
  final String? suffix;
  final TextStyle? style;
  final Duration duration;
  final Curve curve;
  final int decimalPlaces;

  const AnimatedCounter({
    super.key,
    required this.value,
    this.prefix,
    this.suffix,
    this.style,
    this.duration = AppDurations.slow,
    this.curve = AppCurves.decelerate,
    this.decimalPlaces = 0,
  });

  @override
  State<AnimatedCounter> createState() => _AnimatedCounterState();
}

class _AnimatedCounterState extends State<AnimatedCounter>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  late num _previousValue;

  @override
  void initState() {
    super.initState();
    _previousValue = 0;
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    _animation = Tween<double>(
      begin: _previousValue.toDouble(),
      end: widget.value.toDouble(),
    ).animate(CurvedAnimation(parent: _controller, curve: widget.curve));
    _controller.forward();
  }

  @override
  void didUpdateWidget(AnimatedCounter oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _previousValue = oldWidget.value;
      _animation = Tween<double>(
        begin: _previousValue.toDouble(),
        end: widget.value.toDouble(),
      ).animate(CurvedAnimation(parent: _controller, curve: widget.curve));
      _controller
        ..reset()
        ..forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _format(double value) {
    if (widget.decimalPlaces == 0) {
      return value.toInt().toString();
    }
    return value.toStringAsFixed(widget.decimalPlaces);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        final formatted = _format(_animation.value);
        final text = '${widget.prefix ?? ''}$formatted${widget.suffix ?? ''}';
        return Text(text, style: widget.style);
      },
    );
  }
}
