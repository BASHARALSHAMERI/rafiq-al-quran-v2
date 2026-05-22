import 'package:flutter/material.dart';

/// Badge بتأثير نبض — للإشعارات والتنبيهات
class PulseBadge extends StatefulWidget {
  final Widget child;
  final Color color;
  final double size;
  final bool animate;
  final int? count;

  const PulseBadge({
    super.key,
    required this.child,
    this.color = const Color(0xFFEF4444),
    this.size = 10,
    this.animate = true,
    this.count,
  });

  @override
  State<PulseBadge> createState() => _PulseBadgeState();
}

class _PulseBadgeState extends State<PulseBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 2.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _opacityAnimation = Tween<double>(begin: 0.6, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    if (widget.animate) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        widget.child,
        Positioned(
          top: -4,
          left: -4,
          child: SizedBox(
            width: widget.size + 16,
            height: widget.size + 16,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Pulse ring
                if (widget.animate)
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) {
                      return Opacity(
                        opacity: _opacityAnimation.value,
                        child: Transform.scale(
                          scale: _scaleAnimation.value,
                          child: child,
                        ),
                      );
                    },
                    child: Container(
                      width: widget.size,
                      height: widget.size,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: widget.color,
                      ),
                    ),
                  ),
                // Badge dot
                Container(
                  width: widget.count != null ? null : widget.size,
                  height: widget.count != null ? null : widget.size,
                  padding: widget.count != null
                      ? const EdgeInsets.symmetric(horizontal: 4, vertical: 2)
                      : null,
                  decoration: BoxDecoration(
                    color: widget.color,
                    shape: widget.count != null
                        ? BoxShape.rectangle
                        : BoxShape.circle,
                    borderRadius:
                        widget.count != null ? BorderRadius.circular(10) : null,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: widget.count != null
                      ? Text(
                          widget.count! > 99 ? '99+' : '${widget.count}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
