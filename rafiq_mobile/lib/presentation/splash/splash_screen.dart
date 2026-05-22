import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/auth/auth_controller.dart';
import '../../application/bootstrap/app_bootstrap_provider.dart';
import '../../application/context/context_controller.dart';
import '../../core/router/route_names.dart';
import '../../core/theme/app_animations.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_gradients.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  static const Duration _minimumVisibleDuration = Duration(milliseconds: 900);
  static const Duration _exitDuration = Duration(milliseconds: 320);

  late final AnimationController _introController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  );
  late final AnimationController _ambientController = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 14),
  )..repeat();
  late final AnimationController _pulseController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  )..repeat(reverse: true);

  late final Animation<double> _eyebrowOpacity = CurvedAnimation(
    parent: _introController,
    curve: const Interval(0.00, 0.22, curve: Curves.easeOut),
  );
  late final Animation<Offset> _eyebrowSlide = Tween<Offset>(
    begin: const Offset(0, 0.25),
    end: Offset.zero,
  ).animate(
    CurvedAnimation(
      parent: _introController,
      curve: const Interval(0.00, 0.28, curve: AppCurves.decelerate),
    ),
  );
  late final Animation<double> _brandOpacity = CurvedAnimation(
    parent: _introController,
    curve: const Interval(0.08, 0.42, curve: Curves.easeOut),
  );
  late final Animation<double> _brandScale = Tween<double>(
    begin: 0.78,
    end: 1.0,
  ).animate(
    CurvedAnimation(
      parent: _introController,
      curve: const Interval(0.08, 0.50, curve: AppCurves.spring),
    ),
  );
  late final Animation<double> _contentOpacity = CurvedAnimation(
    parent: _introController,
    curve: const Interval(0.24, 0.72, curve: Curves.easeOut),
  );
  late final Animation<Offset> _contentSlide = Tween<Offset>(
    begin: const Offset(0, 0.18),
    end: Offset.zero,
  ).animate(
    CurvedAnimation(
      parent: _introController,
      curve: const Interval(0.24, 0.82, curve: AppCurves.decelerate),
    ),
  );
  late final Animation<double> _panelOpacity = CurvedAnimation(
    parent: _introController,
    curve: const Interval(0.48, 1.00, curve: Curves.easeOut),
  );

  bool _isLeaving = false;
  double _statusProgress = 0.12;
  String _statusLabel = _SplashCopy.stageBooting;

  @override
  void initState() {
    super.initState();
    _playIntro();
    _runBootstrap();
  }

  Future<void> _playIntro() async {
    try {
      await Future<void>.delayed(AppDurations.fast);
      if (!mounted) {
        return;
      }
      await _introController.forward();
    } catch (_) {
      // Controller may be disposed during hot reload or route changes.
    }
  }

  Future<void> _runBootstrap() async {
    final startedAt = DateTime.now();
    var nextRoute = RouteNames.login;

    try {
      _updateStatus(_SplashCopy.stageBooting, 0.20);
      final bootstrap = await ref.read(appBootstrapProvider.future);
      nextRoute = bootstrap.nextRoute;

      _updateStatus(_SplashCopy.stageSession, 0.52);
      await _waitForAuthInitialization();

      _updateStatus(_SplashCopy.stageContext, 0.84);
      await _waitForContextInitialization();

      _updateStatus(_SplashCopy.stageReady, 1.00);
    } catch (_) {
      _updateStatus(_SplashCopy.stageFallback, 0.92);
      await _waitForAuthInitialization();
      await _waitForContextInitialization();
    }

    final elapsed = DateTime.now().difference(startedAt);
    final remaining = _minimumVisibleDuration - elapsed;
    if (remaining > Duration.zero) {
      await Future<void>.delayed(remaining);
    }

    if (!mounted) {
      return;
    }

    await _leaveSplash(nextRoute);
  }

  Future<void> _leaveSplash(String nextRoute) async {
    if (_isLeaving || !mounted) {
      return;
    }

    setState(() {
      _isLeaving = true;
    });

    await Future<void>.delayed(_exitDuration);
    if (!mounted) {
      return;
    }

    context.go(nextRoute);
  }

  void _updateStatus(String label, double progress) {
    if (!mounted) {
      return;
    }

    setState(() {
      _statusLabel = label;
      _statusProgress = progress.clamp(0.0, 1.0);
    });
  }

  Future<void> _waitForAuthInitialization() async {
    while (mounted) {
      if (ref.read(authControllerProvider).isInitialized) {
        return;
      }
      await Future<void>.delayed(const Duration(milliseconds: 50));
    }
  }

  Future<void> _waitForContextInitialization() async {
    while (mounted) {
      if (ref.read(contextControllerProvider).isInitialized) {
        return;
      }
      await Future<void>.delayed(const Duration(milliseconds: 50));
    }
  }

  @override
  void dispose() {
    _introController.dispose();
    _ambientController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.sizeOf(context);
    final compact = size.shortestSide < 380;
    final medallionSize = compact ? 150.0 : 176.0;

    return Scaffold(
      body: AnimatedOpacity(
        opacity: _isLeaving ? 0 : 1,
        duration: _exitDuration,
        curve: AppCurves.exit,
        child: Stack(
          fit: StackFit.expand,
          children: [
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF0C2E1B),
                    Color(0xFF14532D),
                    Color(0xFF1A6A42),
                  ],
                ),
              ),
            ),
            AnimatedBuilder(
              animation: Listenable.merge([
                _ambientController,
                _pulseController,
              ]),
              builder: (context, _) {
                return CustomPaint(
                  painter: _SplashBackdropPainter(
                    ambientProgress: _ambientController.value,
                    pulse: _pulseController.value,
                  ),
                );
              },
            ),
            PositionedDirectional(
              top: -80,
              end: -56,
              child: _BlurOrb(
                size: compact ? 220 : 280,
                color: const Color(0x33F6C453),
                offsetX: math.cos(_ambientController.value * math.pi * 2) * 18,
                offsetY: math.sin(_ambientController.value * math.pi * 2) * 12,
              ),
            ),
            PositionedDirectional(
              bottom: -120,
              start: -68,
              child: _BlurOrb(
                size: compact ? 260 : 320,
                color: const Color(0x1AFFFFFF),
                offsetX:
                    math.sin(_ambientController.value * math.pi * 2.2) * 20,
                offsetY:
                    math.cos(_ambientController.value * math.pi * 2.2) * 16,
              ),
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 20,
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 560),
                    child: Column(
                      children: [
                        FadeTransition(
                          opacity: _eyebrowOpacity,
                          child: SlideTransition(
                            position: _eyebrowSlide,
                            child: const _SplashBadge(
                              label: _SplashCopy.eyebrow,
                            ),
                          ),
                        ),
                        SizedBox(height: compact ? 20 : 28),
                        FadeTransition(
                          opacity: _brandOpacity,
                          child: ScaleTransition(
                            scale: _brandScale,
                            child: _BrandMedallion(
                              size: medallionSize,
                              ambientProgress: _ambientController.value,
                              pulse: _pulseController.value,
                            ),
                          ),
                        ),
                        SizedBox(height: compact ? 26 : 34),
                        FadeTransition(
                          opacity: _contentOpacity,
                          child: SlideTransition(
                            position: _contentSlide,
                            child: Column(
                              children: [
                                Text(
                                  _SplashCopy.title,
                                  textAlign: TextAlign.center,
                                  style: theme.textTheme.displaySmall?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.4,
                                    fontSize: compact ? 34 : 40,
                                    height: 1.05,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  _SplashCopy.subtitle,
                                  textAlign: TextAlign.center,
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.86),
                                    height: 1.6,
                                    fontSize: compact ? 14 : 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(height: compact ? 22 : 30),
                        FadeTransition(
                          opacity: _panelOpacity,
                          child: _StatusPanel(
                            statusLabel: _statusLabel,
                            statusProgress: _statusProgress,
                            pulse: _pulseController.value,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            PositionedDirectional(
              bottom: 20,
              start: 24,
              end: 24,
              child: FadeTransition(
                opacity: _contentOpacity,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 68,
                      height: 1,
                      color: Colors.white.withValues(alpha: 0.20),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _SplashCopy.footer,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.64),
                        fontSize: 12.5,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SplashBadge extends StatelessWidget {
  const _SplashBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white.withValues(alpha: 0.16),
            Colors.white.withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.auto_awesome_rounded,
            size: 16,
            color: Color(0xFFF3D27A),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.90),
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}

class _BrandMedallion extends StatelessWidget {
  const _BrandMedallion({
    required this.size,
    required this.ambientProgress,
    required this.pulse,
  });

  final double size;
  final double ambientProgress;
  final double pulse;

  @override
  Widget build(BuildContext context) {
    final glowScale = 0.96 + (pulse * 0.06);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Transform.scale(
            scale: glowScale,
            child: Container(
              width: size * 0.92,
              height: size * 0.92,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xB3F2D27A).withValues(alpha: 0.20),
                    blurRadius: 44,
                    spreadRadius: 8,
                  ),
                ],
              ),
            ),
          ),
          CustomPaint(
            size: Size.square(size),
            painter: _MedallionPainter(
              ambientProgress: ambientProgress,
              pulse: pulse,
            ),
          ),
          Container(
            width: size * 0.56,
            height: size * 0.56,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0x33FFFFFF),
                  Color(0x1AF3D27A),
                ],
              ),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.32),
                width: 1.6,
              ),
            ),
            child: DecoratedBox(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppGradients.gold,
              ),
              child: Icon(
                Icons.auto_stories_rounded,
                size: size * 0.18,
                color: const Color(0xFF114227),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPanel extends StatelessWidget {
  const _StatusPanel({
    required this.statusLabel,
    required this.statusProgress,
    required this.pulse,
  });

  final String statusLabel;
  final double statusProgress;
  final double pulse;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(30),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(30),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white.withValues(alpha: 0.16),
                Colors.white.withValues(alpha: 0.06),
              ],
            ),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.14),
            ),
          ),
          child: Column(
            children: [
              const Wrap(
                alignment: WrapAlignment.center,
                spacing: 10,
                runSpacing: 10,
                children: [
                  _FeatureChip(
                    icon: Icons.menu_book_rounded,
                    label: _SplashCopy.pillarHifz,
                  ),
                  _FeatureChip(
                    icon: Icons.insights_rounded,
                    label: _SplashCopy.pillarFollowUp,
                  ),
                  _FeatureChip(
                    icon: Icons.verified_rounded,
                    label: _SplashCopy.pillarMastery,
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _LoadingRail(
                label: statusLabel,
                progress: statusProgress,
                pulse: pulse,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureChip extends StatelessWidget {
  const _FeatureChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: Colors.white.withValues(alpha: 0.08),
        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFFF3D27A)),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.92),
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}

class _LoadingRail extends StatelessWidget {
  const _LoadingRail({
    required this.label,
    required this.progress,
    required this.pulse,
  });

  final String label;
  final double progress;
  final double pulse;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AnimatedSwitcher(
          duration: AppDurations.normal,
          child: Text(
            label,
            key: ValueKey(label),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.90),
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        const SizedBox(height: 14),
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0.0, end: progress),
          duration: AppDurations.medium,
          curve: AppCurves.standard,
          builder: (context, animatedProgress, _) {
            final orbAlignment = (animatedProgress * 2) - 1;
            return Column(
              children: [
                SizedBox(
                  height: 16,
                  child: Stack(
                    alignment: Alignment.centerLeft,
                    children: [
                      Container(
                        height: 6,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(999),
                          color: Colors.white.withValues(alpha: 0.10),
                        ),
                      ),
                      FractionallySizedBox(
                        widthFactor: animatedProgress.clamp(0.0, 1.0),
                        child: Container(
                          height: 6,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(999),
                            gradient: const LinearGradient(
                              colors: [
                                Color(0xFFE8C96E),
                                AppColors.successLight,
                              ],
                            ),
                          ),
                        ),
                      ),
                      Align(
                        alignment: Alignment(orbAlignment, 0),
                        child: Container(
                          width: 16 + (pulse * 2),
                          height: 16 + (pulse * 2),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFE8C96E)
                                    .withValues(alpha: 0.45),
                                blurRadius: 14,
                                spreadRadius: 1.5,
                              ),
                            ],
                          ),
                          child: const DecoratedBox(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [
                                  Color(0xFFFFFFFF),
                                  Color(0xFFE8C96E),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${(animatedProgress * 100).round()}%',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.62),
                        letterSpacing: 0.4,
                      ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _BlurOrb extends StatelessWidget {
  const _BlurOrb({
    required this.size,
    required this.color,
    required this.offsetX,
    required this.offsetY,
  });

  final double size;
  final Color color;
  final double offsetX;
  final double offsetY;

  @override
  Widget build(BuildContext context) {
    return Transform.translate(
      offset: Offset(offsetX, offsetY),
      child: IgnorePointer(
        child: ImageFiltered(
          imageFilter: ui.ImageFilter.blur(sigmaX: 36, sigmaY: 36),
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  color,
                  color.withValues(alpha: 0.0),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SplashBackdropPainter extends CustomPainter {
  const _SplashBackdropPainter({
    required this.ambientProgress,
    required this.pulse,
  });

  final double ambientProgress;
  final double pulse;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.34);
    final shortestSide = size.shortestSide;

    final glowPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0x40F6C453),
          Colors.white.withValues(alpha: 0.0),
        ],
      ).createShader(
        Rect.fromCircle(center: center, radius: shortestSide * 0.70),
      );
    canvas.drawCircle(center, shortestSide * 0.70, glowPaint);

    final orbitPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final orbitRect = Rect.fromCenter(
      center: center,
      width: shortestSide * 1.22,
      height: shortestSide * 0.86,
    );

    for (var i = 0; i < 3; i++) {
      orbitPaint.color = Colors.white.withValues(alpha: 0.08 - (i * 0.02));
      canvas.drawOval(
        orbitRect.inflate(i * 28),
        orbitPaint,
      );
    }

    final movingPaint = Paint()
      ..color = const Color(0xFFF2D587).withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;
    for (var i = 0; i < 5; i++) {
      final angle = (ambientProgress * math.pi * 2) + (i * 1.15);
      final offset = Offset(
        center.dx + math.cos(angle) * shortestSide * 0.34,
        center.dy + math.sin(angle) * shortestSide * 0.18,
      );
      canvas.drawCircle(offset, 2.4 + (pulse * 1.4), movingPaint);
    }

    final ribbonPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = shortestSide * 0.17
      ..color = Colors.white.withValues(alpha: 0.035);
    canvas.save();
    canvas.translate(size.width * 0.98, size.height * 0.04);
    canvas.rotate((ambientProgress * math.pi * 2) * 0.08);
    canvas.drawArc(
      Rect.fromCircle(center: Offset.zero, radius: size.width * 0.70),
      math.pi * 0.18,
      math.pi * 1.08,
      false,
      ribbonPaint,
    );
    canvas.restore();

    _drawRosette(
      canvas,
      center: Offset(size.width * 0.14, size.height * 0.16),
      radius: shortestSide * 0.08,
      rotation: -ambientProgress * math.pi * 0.8,
      color: Colors.white.withValues(alpha: 0.06),
    );
    _drawRosette(
      canvas,
      center: Offset(size.width * 0.86, size.height * 0.84),
      radius: shortestSide * 0.10,
      rotation: ambientProgress * math.pi * 0.9,
      color: const Color(0xFFF2D587).withValues(alpha: 0.10),
    );
  }

  void _drawRosette(
    Canvas canvas, {
    required Offset center,
    required double radius,
    required double rotation,
    required Color color,
  }) {
    final path = _buildStarPath(
      center: center,
      points: 8,
      outerRadius: radius,
      innerRadius: radius * 0.58,
      rotation: rotation,
    );
    final fillPaint = Paint()
      ..color = color.withValues(alpha: color.a * 0.38)
      ..style = PaintingStyle.fill;
    final strokePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1;

    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _SplashBackdropPainter oldDelegate) {
    return oldDelegate.ambientProgress != ambientProgress ||
        oldDelegate.pulse != pulse;
  }
}

class _MedallionPainter extends CustomPainter {
  const _MedallionPainter({
    required this.ambientProgress,
    required this.pulse,
  });

  final double ambientProgress;
  final double pulse;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final outerRadius = size.shortestSide * 0.48;
    final innerRadius = size.shortestSide * 0.35;

    final softRingPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..color = Colors.white.withValues(alpha: 0.20);
    canvas.drawCircle(center, outerRadius * 0.96, softRingPaint);

    final starPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..color =
          const Color(0xFFF2D587).withValues(alpha: 0.32 + (pulse * 0.10));
    final starPath = _buildStarPath(
      center: center,
      points: 8,
      outerRadius: outerRadius,
      innerRadius: innerRadius,
      rotation: ambientProgress * math.pi * 2 * 0.18,
    );
    canvas.drawPath(starPath, starPaint);

    final orbitPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.82)
      ..style = PaintingStyle.fill;
    for (var i = 0; i < 4; i++) {
      final angle = (ambientProgress * math.pi * 2) + (i * math.pi / 2);
      final point = Offset(
        center.dx + math.cos(angle) * innerRadius * 1.12,
        center.dy + math.sin(angle) * innerRadius * 0.84,
      );
      canvas.drawCircle(point, 2.8 + (pulse * 1.0), orbitPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _MedallionPainter oldDelegate) {
    return oldDelegate.ambientProgress != ambientProgress ||
        oldDelegate.pulse != pulse;
  }
}

Path _buildStarPath({
  required Offset center,
  required int points,
  required double outerRadius,
  required double innerRadius,
  double rotation = 0,
}) {
  final path = Path();
  final step = math.pi / points;

  for (var i = 0; i < points * 2; i++) {
    final radius = i.isEven ? outerRadius : innerRadius;
    final angle = (i * step) - (math.pi / 2) + rotation;
    final point = Offset(
      center.dx + math.cos(angle) * radius,
      center.dy + math.sin(angle) * radius,
    );

    if (i == 0) {
      path.moveTo(point.dx, point.dy);
    } else {
      path.lineTo(point.dx, point.dy);
    }
  }

  path.close();
  return path;
}

abstract class _SplashCopy {
  static const String title =
      '\u0631\u0641\u064a\u0642 \u0627\u0644\u0642\u0631\u0622\u0646';
  static const String eyebrow =
      '\u0628\u062f\u0627\u064a\u0629 \u0645\u0644\u0647\u0645\u0629 \u0644\u0631\u062d\u0644\u0629 \u0627\u0644\u062d\u0641\u0638';
  static const String subtitle =
      '\u0645\u0631\u0627\u0641\u0642\u0643 \u0627\u0644\u064a\u0648\u0645\u064a \u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062d\u0644\u0642\u0627\u062a\u060c \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629\u060c \u0648\u0628\u0646\u0627\u0621 \u062a\u062c\u0631\u0628\u0629 \u062a\u0639\u0644\u064a\u0645\u064a\u0629 \u0645\u0637\u0645\u0626\u0646\u0629.';
  static const String pillarHifz = '\u062d\u0641\u0638';
  static const String pillarFollowUp = '\u0645\u062a\u0627\u0628\u0639\u0629';
  static const String pillarMastery = '\u0625\u062a\u0642\u0627\u0646';
  static const String stageBooting =
      '\u064a\u062c\u0631\u064a \u062a\u062c\u0647\u064a\u0632 \u0628\u064a\u0626\u0629 \u0627\u0644\u062d\u0641\u0638.';
  static const String stageSession =
      '\u062c\u0627\u0631\u064a \u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u062c\u0644\u0633\u0629 \u0648\u0627\u0644\u0647\u0648\u064a\u0629.';
  static const String stageContext =
      '\u064a\u062c\u0631\u064a \u062a\u062d\u0636\u064a\u0631 \u0633\u064a\u0627\u0642 \u0627\u0644\u062d\u0644\u0642\u0629 \u0648\u0627\u0644\u0645\u0631\u0643\u0632.';
  static const String stageReady =
      '\u0627\u0643\u062a\u0645\u0644 \u0627\u0644\u062a\u062c\u0647\u064a\u0632\u060c \u0646\u0646\u062a\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u062a\u062c\u0631\u0628\u0629.';
  static const String stageFallback =
      '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0625\u0644\u0649 \u0634\u0627\u0634\u0629 \u0627\u0644\u062f\u062e\u0648\u0644.';
  static const String footer =
      '\u0627\u0642\u0631\u0623 \u0648\u0627\u0631\u062a\u0642 \u2022 \u0628\u062f\u0627\u064a\u0629 \u0647\u0627\u062f\u0626\u0629 \u0644\u062a\u062c\u0631\u0628\u0629 \u0623\u0648\u0636\u062d';
}
