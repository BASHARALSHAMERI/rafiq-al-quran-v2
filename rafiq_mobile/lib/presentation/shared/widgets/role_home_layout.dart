import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import 'dashboard_stat_card.dart';
import 'enterprise_card.dart';
import 'home_hero_card.dart';
import 'quick_action_card.dart';

enum FeatureAvailability { available, webOnly, later }

class MetricData {
  final String title;
  final String value;
  final IconData icon;
  final StatColor color;

  const MetricData({
    required this.title,
    required this.value,
    required this.icon,
    this.color = StatColor.primary,
  });
}

class ActionData {
  final String title;
  final IconData icon;
  final VoidCallback? onTap;
  final bool highlighted;
  final FeatureAvailability availability;

  const ActionData({
    required this.title,
    required this.icon,
    this.onTap,
    this.highlighted = false,
    this.availability = FeatureAvailability.available,
  });
}

class HomeUpdateData {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const HomeUpdateData({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    this.onTap,
  });
}

class RoleHomeLayout extends StatelessWidget {
  final String greeting;
  final String subtitle;
  final String dateLabel;
  final List<MetricData> metrics;
  final List<ActionData> actions;
  final List<HomeUpdateData> updates;
  final int unreadCount;
  final VoidCallback onNotificationTap;
  final Future<void> Function() onRefresh;
  final Future<void> Function()? onSyncTap;
  final String emptyTitle;
  final String emptySubtitle;
  final bool isLoading;

  const RoleHomeLayout({
    super.key,
    required this.greeting,
    required this.subtitle,
    required this.dateLabel,
    required this.metrics,
    required this.actions,
    required this.updates,
    required this.unreadCount,
    required this.onNotificationTap,
    required this.onRefresh,
    required this.emptyTitle,
    required this.emptySubtitle,
    this.onSyncTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      body: SafeArea(
        bottom: false,
        top: false,
        child: RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  HomeHeroCard(
                    greeting: greeting,
                    subtitle: subtitle,
                    dateLabel: dateLabel,
                    unreadCount: unreadCount,
                    onNotificationTap: onNotificationTap,
                    onSyncTap: onSyncTap,
                  ),
                  Positioned(
                    bottom: -32,
                    left: 16,
                    right: 16,
                    child: MetricGrid(metrics: metrics),
                  ),
                ],
              ),
              const SizedBox(height: 44),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionTitle(title: 'إجراءات سريعة'),
                    const SizedBox(height: 12),
                    ActionGrid(actions: actions),
                    const SizedBox(height: 24),
                    if (updates.isNotEmpty) ...[
                      const SectionTitle(title: 'آخر التحديثات'),
                      const SizedBox(height: AppSpacing.sm),
                      ...updates.map(
                        (update) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                          child: HomeUpdateCard(data: update),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 120),
            ],
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;

  const SectionTitle({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 18,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                fontFamily: 'Cairo',
              ),
        ),
      ],
    );
  }
}

class MetricGrid extends StatelessWidget {
  final List<MetricData> metrics;

  const MetricGrid({super.key, required this.metrics});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final crossAxisCount = width >= 720 ? 3 : 3; // Force 3 columns as requested
        final childAspectRatio = width >= 720 ? 1.8 : 1.35;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: metrics.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: childAspectRatio,
          ),
          itemBuilder: (context, index) {
            final item = metrics[index];
            return DashboardStatCardTeacher(
              icon: item.icon,
              label: item.title,
              value: item.value,
              color: item.color,
            )
                .animate()
                .fadeIn(delay: (100 + index * 50).ms)
                .slideY(begin: 0.1, end: 0, duration: 300.ms);
          },
        );
      },
    );
  }
}

class ActionGrid extends StatelessWidget {
  final List<ActionData> actions;

  const ActionGrid({super.key, required this.actions});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final crossAxisCount = width >= 720 ? 3 : 3; // Force 3 columns
        const childAspectRatio = 1.18; // Shorter cards

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: actions.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: childAspectRatio,
          ),
          itemBuilder: (context, index) {
            return ActionTile(
              data: actions[index],
              compact: true,
            )
                .animate()
                .fadeIn(delay: (200 + index * 50).ms)
                .slideY(begin: 0.1, end: 0, duration: 400.ms);
          },
        );
      },
    );
  }
}

class ActionTile extends StatelessWidget {
  final ActionData data;
  final bool compact;

  const ActionTile({
    super.key,
    required this.data,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = data.availability == FeatureAvailability.available &&
        data.onTap != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: IgnorePointer(
            ignoring: !enabled,
            child: Opacity(
              opacity: enabled ? 1 : 0.65,
              child: compact
                  ? QuickActionCardSmall(
                      icon: data.icon,
                      title: data.title,
                      onTap: data.onTap ?? () {},
                      variant: data.highlighted
                          ? QuickActionVariant.primary
                          : QuickActionVariant.secondary,
                    )
                  : QuickActionCard(
                      icon: data.icon,
                      title: data.title,
                      onTap: data.onTap ?? () {},
                      variant: data.highlighted
                          ? QuickActionVariant.primary
                          : QuickActionVariant.secondary,
                    ),
            ),
          ),
        ),
        if (data.availability != FeatureAvailability.available) ...[
          const SizedBox(height: AppSpacing.xs),
          FeatureAvailabilityChip(availability: data.availability),
        ],
      ],
    );
  }
}

class FeatureAvailabilityChip extends StatelessWidget {
  final FeatureAvailability availability;

  const FeatureAvailabilityChip({super.key, required this.availability});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (availability) {
      FeatureAvailability.available => ('متاح', AppColors.successLight),
      FeatureAvailability.webOnly => ('من الويب', AppColors.infoLight),
      FeatureAvailability.later => ('قريبًا', AppColors.warningLight),
    };

    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xs,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ),
    );
  }
}

class HomeUpdateCard extends StatelessWidget {
  final HomeUpdateData data;

  const HomeUpdateCard({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return EnterpriseCard(
      accentColor: data.color,
      onTap: data.onTap,
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: data.color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(data.icon, color: data.color),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  data.subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondaryLight,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
