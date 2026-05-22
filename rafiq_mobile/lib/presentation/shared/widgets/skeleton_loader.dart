import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart'; // shimmer package for loading states

/// Skeleton Loader — حالة التحميل بتأثير البريق
class SkeletonLoader extends StatelessWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const SkeletonLoader({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? const Color(0xFF2A3440) : const Color(0xFFE8EEF4),
      highlightColor:
          isDark ? const Color(0xFF3A4A58) : const Color(0xFFF5F8FB),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF2A3440) : const Color(0xFFE8EEF4),
          borderRadius: borderRadius ?? BorderRadius.circular(12),
        ),
      ),
    );
  }
}

/// Skeleton card كاملة — لبطاقات القوائم
class SkeletonCardLoader extends StatelessWidget {
  const SkeletonCardLoader({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? const Color(0xFF2A3440) : const Color(0xFFE8EEF4);
    final highlight =
        isDark ? const Color(0xFF3A4A58) : const Color(0xFFF5F8FB);
    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: base,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(color: base, shape: BoxShape.circle),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 14,
                    width: double.infinity,
                    decoration: BoxDecoration(
                        color: base, borderRadius: BorderRadius.circular(8)),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 10,
                    width: 120,
                    decoration: BoxDecoration(
                        color: base, borderRadius: BorderRadius.circular(8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Skeleton metric card — للإحصائيات
class SkeletonMetricCard extends StatelessWidget {
  const SkeletonMetricCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark ? const Color(0xFF2A3440) : const Color(0xFFE8EEF4);
    final highlight =
        isDark ? const Color(0xFF3A4A58) : const Color(0xFFF5F8FB);
    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: Container(
        height: 110,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: base,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
                height: 12,
                width: 80,
                decoration: BoxDecoration(
                    color: base, borderRadius: BorderRadius.circular(6))),
            const SizedBox(height: 16),
            Container(
                height: 32,
                width: 64,
                decoration: BoxDecoration(
                    color: base, borderRadius: BorderRadius.circular(6))),
            const SizedBox(height: 10),
            Container(
                height: 7,
                width: double.infinity,
                decoration: BoxDecoration(
                    color: base, borderRadius: BorderRadius.circular(4))),
          ],
        ),
      ),
    );
  }
}
