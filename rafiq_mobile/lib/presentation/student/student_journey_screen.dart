import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student/student_dashboard_provider.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/data_parsing_helper.dart';
import '../shared/widgets/page_state_view.dart';
import '../shared/widgets/premium_app_bar.dart';
import '../shared/widgets/section_header.dart';

class StudentJourneyScreen extends ConsumerStatefulWidget {
  const StudentJourneyScreen({super.key});

  @override
  ConsumerState<StudentJourneyScreen> createState() => _StudentJourneyScreenState();
}

class _StudentJourneyScreenState extends ConsumerState<StudentJourneyScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Future.microtask(
      () => ref.read(studentDashboardProvider.notifier).loadProfile(),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(studentDashboardProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8F5),
      appBar: const PremiumAppBar(title: 'رحلتي القرآنية'),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(StudentDashboardState state) {
    if (state.isLoading) {
      return const PageStateView.loading();
    }

    if (state.error != null) {
      return PageStateView.error(
        title: 'تعذر تحميل البيانات',
        message: state.error!,
        actionLabel: 'إعادة المحاولة',
        onAction: () => ref.read(studentDashboardProvider.notifier).loadProfile(),
      );
    }

    final data = state.profileData;
    if (data == null) {
      return const PageStateView.empty(
        title: 'لا توجد بيانات',
        message: 'لم يتم العثور على بيانات تقدم مرتبطة بهذا الحساب.',
      );
    }

    final metrics = DataParsingHelper.asMap(data['metrics']);
    final profile = DataParsingHelper.asMap(data['studentProfile']);
    final followUps = DataParsingHelper.asMapList(data['followUpsAsStudent']);

    return Column(
      children: [
        _buildHeader(profile, followUps),
        _buildTabBar(),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _OverviewTab(metrics: metrics, followUps: followUps, profile: profile),
              _HistoryTab(followUps: followUps),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(Map<String, dynamic> profile, List<Map<String, dynamic>> followUps) {
    final name = DataParsingHelper.readString(profile['fullName'], fallback: 'الطالب');
    final averageScore = _calculateAvgRating(followUps);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.8)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            _Avatar(name: name),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
                  ),
                  const Text(
                    'طالب قرآن',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondaryLight, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            _RatingPill(score: averageScore),
          ],
        ),
      ).animate().fadeIn().slideY(begin: -0.1, end: 0),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: AppColors.primaryLight,
          borderRadius: BorderRadius.circular(12),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: AppColors.textSecondaryLight,
        labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
        tabs: const [
          Tab(text: 'نظرة عامة'),
          Tab(text: 'سجل التسميع'),
        ],
      ),
    );
  }

  String _calculateAvgRating(List<Map<String, dynamic>> followUps) {
    final scores = followUps
        .map((item) => DataParsingHelper.ratingToScore(item['rating']))
        .where((score) => score > 0)
        .toList();

    if (scores.isEmpty) return '-';
    final avg = scores.reduce((a, b) => a + b) / scores.length;
    return avg.toStringAsFixed(1);
  }
}

class _Avatar extends StatelessWidget {
  final String name;
  const _Avatar({required this.name});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.primaryLight.withValues(alpha: 0.2), width: 2),
      ),
      child: CircleAvatar(
        radius: 26,
        backgroundColor: AppColors.primaryLight.withValues(alpha: 0.08),
        child: Text(
          name.isNotEmpty ? name[0] : 'ط',
          style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w900, fontSize: 20),
        ),
      ),
    );
  }
}

class _RatingPill extends StatelessWidget {
  final String score;
  const _RatingPill({required this.score});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF1FAF4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.successLight.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(score, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.successLight)),
          const Text('التقييم', style: TextStyle(fontSize: 10, color: AppColors.successLight, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> metrics;
  final List<Map<String, dynamic>> followUps;
  final Map<String, dynamic> profile;

  const _OverviewTab({required this.metrics, required this.followUps, required this.profile});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        const SectionHeader(title: 'مسار الحفظ'),
        const SizedBox(height: AppSpacing.md),
        
        // The Roadmap Path
        ...List.generate(30, (index) {
          final juzNumber = 30 - index; // Reversing to show 30 down to 1 or 1 to 30
          final isCompleted = (DataParsingHelper.readInt(profile['currentJuz']) ?? 0) >= juzNumber;
          final isCurrent = (DataParsingHelper.readInt(profile['currentJuz']) ?? 0) == juzNumber;
          
          return _JuzMilestone(
            juzNumber: juzNumber,
            isCompleted: isCompleted,
            isCurrent: isCurrent,
            isLast: index == 29,
          );
        }),
        
        const SizedBox(height: 40),
      ],
    ).animate().fadeIn();
  }
}

class _JuzMilestone extends StatelessWidget {
  final int juzNumber;
  final bool isCompleted;
  final bool isCurrent;
  final bool isLast;

  const _JuzMilestone({
    required this.juzNumber,
    required this.isCompleted,
    required this.isCurrent,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final color = isCompleted ? AppColors.successLight : (isCurrent ? AppColors.primaryLight : const Color(0xFFE2E8F0));
    
    return Row(
      children: [
        Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: isCompleted || isCurrent ? 1.0 : 0.1),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isCurrent ? AppColors.primaryLight : Colors.transparent,
                  width: 3,
                ),
                boxShadow: isCurrent ? [
                  BoxShadow(color: AppColors.primaryLight.withValues(alpha: 0.3), blurRadius: 10)
                ] : null,
              ),
              alignment: Alignment.center,
              child: Text(
                '$juzNumber',
                style: TextStyle(
                  color: isCompleted || isCurrent ? Colors.white : const Color(0xFF94A3B8),
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                ),
              ),
            ),
            if (!isLast)
              Container(
                width: 4,
                height: 40,
                color: color.withValues(alpha: 0.3),
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isCurrent ? AppColors.primaryLight.withValues(alpha: 0.3) : AppColors.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'الجزء $juzNumber',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: isCompleted || isCurrent ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
                  ),
                ),
                Text(
                  isCompleted ? 'تم الختم بنجاح 🎉' : (isCurrent ? 'أنت هنا الآن 📍' : 'المحطة القادمة 🔜'),
                  style: TextStyle(
                    fontSize: 11,
                    color: isCompleted ? AppColors.successLight : (isCurrent ? AppColors.primaryLight : const Color(0xFF94A3B8)),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _HistoryTab extends StatelessWidget {
  final List<Map<String, dynamic>> followUps;
  const _HistoryTab({required this.followUps});

  @override
  Widget build(BuildContext context) {
    if (followUps.isEmpty) {
      return const Center(child: Text('لا توجد سجلات سابقة'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: followUps.length,
      itemBuilder: (context, index) {
        final item = followUps[index];
        final dateStr = item['recordDate']?.toString() ?? '';
        final date = dateStr.isNotEmpty ? DateTime.tryParse(dateStr) : null;
        final formattedDate = date != null ? DateFormat('d MMMM y', 'ar').format(date) : '-';

        return Container(
          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: AppColors.primaryLight.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.menu_book_rounded, color: AppColors.primaryLight, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(DataParsingHelper.readString(item['surah'], fallback: 'سورة غير محددة'), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                    Text(formattedDate, style: const TextStyle(color: AppColors.textSecondaryLight, fontSize: 12)),
                  ],
                ),
              ),
              _Stars(rating: DataParsingHelper.ratingToScore(item['rating'])),
            ],
          ),
        );
      },
    );
  }
}

class _Stars extends StatelessWidget {
  final int rating;
  const _Stars({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(5, (index) => Icon(
        index < rating ? Icons.star_rounded : Icons.star_outline_rounded,
        color: index < rating ? Colors.amber : AppColors.borderLight,
        size: 16,
      )),
    );
  }
}
