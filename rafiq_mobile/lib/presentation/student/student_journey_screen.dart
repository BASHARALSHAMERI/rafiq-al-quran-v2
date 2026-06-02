import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../application/student/student_dashboard_provider.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/quran_data.dart';
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
    final monthlyPlans = DataParsingHelper.asMapList(data['monthlyPlansAsStudent']);
    final activePlan = monthlyPlans.isNotEmpty ? monthlyPlans.first : null;

    return Column(
      children: [
        _buildHeader(profile, followUps),
        _buildTabBar(),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _OverviewTab(
                metrics: metrics,
                followUps: followUps,
                profile: profile,
                activePlan: activePlan,
              ),
              _HistoryTab(
                followUps: followUps,
                activePlan: activePlan,
              ),
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
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  const Text(
                    'طالب قرآن',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondaryLight, fontWeight: FontWeight.w600, fontFamily: 'Cairo'),
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
        labelStyle: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, fontFamily: 'Cairo'),
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
          style: const TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w900, fontSize: 20, fontFamily: 'Cairo'),
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
          Text(score, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.successLight, fontFamily: 'Cairo')),
          const Text('التقييم', style: TextStyle(fontSize: 10, color: AppColors.successLight, fontWeight: FontWeight.w700, fontFamily: 'Cairo')),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> metrics;
  final List<Map<String, dynamic>> followUps;
  final Map<String, dynamic> profile;
  final Map<String, dynamic>? activePlan;

  const _OverviewTab({
    required this.metrics,
    required this.followUps,
    required this.profile,
    this.activePlan,
  });

  String _formatPages(double val) {
    if (val == val.roundToDouble()) {
      return val.toStringAsFixed(0);
    }
    return val.toStringAsFixed(1);
  }

  bool _isJuzTargeted(int juzNum, Map<String, dynamic>? plan) {
    if (plan == null) return false;
    final fromSurah = DataParsingHelper.readInt(plan['hifzFromSurah']) ?? 0;
    final toSurah = DataParsingHelper.readInt(plan['hifzToSurah']) ?? 0;
    if (fromSurah == 0 || toSurah == 0) return false;

    final startSurahObj = QuranData.findByNumber(fromSurah);
    final toSurahObj = QuranData.findByNumber(toSurah);
    if (startSurahObj == null || toSurahObj == null) return false;

    final planStartPage = startSurahObj.startPage;
    final nextSurahObj = QuranData.findByNumber(toSurah + 1);
    final planEndPage = nextSurahObj != null ? nextSurahObj.startPage - 1 : 604;

    final juzStartPage = juzNum == 1 ? 1 : (juzNum - 1) * 20 + 2;
    final juzEndPage = juzNum == 30 ? 604 : juzNum * 20 + 1;

    return !(planStartPage > juzEndPage || planEndPage < juzStartPage);
  }

  @override
  Widget build(BuildContext context) {
    double executedPages = 0;
    double targetPages = 0;
    double dailyRate = 0;
    String rangeLabel = '';
    double progressPercent = 0;

    if (activePlan != null) {
      final planMonth = DataParsingHelper.readInt(activePlan!['month']);
      final planYear = DataParsingHelper.readInt(activePlan!['year']);
      targetPages = DataParsingHelper.asDouble(activePlan!['hifzTargetPages']) ?? 0.0;
      dailyRate = DataParsingHelper.asDouble(activePlan!['hifzDailyRate']) ?? 0.0;
      final fromSurah = DataParsingHelper.readInt(activePlan!['hifzFromSurah']) ?? 0;
      final fromAyah = DataParsingHelper.readInt(activePlan!['hifzFromAyah']) ?? 0;
      final toSurah = DataParsingHelper.readInt(activePlan!['hifzToSurah']) ?? 0;
      final toAyah = DataParsingHelper.readInt(activePlan!['hifzToAyah']) ?? 0;

      final fromSurahName = QuranData.findByNumber(fromSurah)?.name ?? 'سورة $fromSurah';
      final toSurahName = QuranData.findByNumber(toSurah)?.name ?? 'سورة $toSurah';
      rangeLabel = '$fromSurahName ($fromAyah) ← $toSurahName ($toAyah)';

      for (final followUp in followUps) {
        final dateStr = followUp['recordDate']?.toString() ?? '';
        final date = DateTime.tryParse(dateStr);
        if (date != null && date.month == planMonth && date.year == planYear) {
          final type = followUp['type']?.toString().toUpperCase();
          if (type == 'HIFZ') {
            executedPages += DataParsingHelper.asDouble(followUp['pagesCount']) ?? 0.0;
          }
        }
      }
      progressPercent = targetPages > 0 ? (executedPages / targetPages).clamp(0.0, 1.0) : 0.0;
    }

    final currentJuz = DataParsingHelper.readInt(profile['currentJuzz']) ??
        DataParsingHelper.readInt(profile['currentJuz']) ??
        0;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        if (activePlan != null) ...[
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F766E), Color(0xFF115E59)],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F766E).withValues(alpha: 0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.stars_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'خطة الحفظ للشهر الحالي',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${(progressPercent * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  'النطاق المستهدف:',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  rangeLabel,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'معدل الإنجاز: ${_formatPages(executedPages)} من ${_formatPages(targetPages)} صفحة',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    Text(
                      'المعدل اليومي: ${_formatPages(dailyRate)} صفحة',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: progressPercent,
                    minHeight: 8,
                    backgroundColor: Colors.white.withValues(alpha: 0.15),
                    color: const Color(0xFF34D399),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
        const SectionHeader(title: 'مسار الحفظ'),
        const SizedBox(height: AppSpacing.md),
        
        ...List.generate(30, (index) {
          final juzNumber = 30 - index;
          final isCompleted = currentJuz > juzNumber;
          final isCurrent = currentJuz == juzNumber;
          final isTargeted = _isJuzTargeted(juzNumber, activePlan);
          
          return _JuzMilestone(
            juzNumber: juzNumber,
            isCompleted: isCompleted,
            isCurrent: isCurrent,
            isTargeted: isTargeted,
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
  final bool isTargeted;

  const _JuzMilestone({
    required this.juzNumber,
    required this.isCompleted,
    required this.isCurrent,
    required this.isTargeted,
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
                  fontFamily: 'Cairo',
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
                Row(
                  children: [
                    Text(
                      'الجزء $juzNumber',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Cairo',
                        color: isCompleted || isCurrent ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
                      ),
                    ),
                    if (isTargeted) ...[
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primaryLight.withValues(alpha: 0.25)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.gps_fixed_rounded, color: AppColors.primaryLight, size: 10),
                            SizedBox(width: 4),
                            Text(
                              'مستهدف هذا الشهر',
                              style: TextStyle(
                                fontSize: 9,
                                color: AppColors.primaryLight,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  isCompleted ? 'تم الختم بنجاح 🎉' : (isCurrent ? 'أنت هنا الآن 📍' : 'المحطة القادمة 🔜'),
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'Cairo',
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
  final Map<String, dynamic>? activePlan;

  const _HistoryTab({
    required this.followUps,
    this.activePlan,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        _RecitationTargetCard(followUps: followUps, activePlan: activePlan),
        const SizedBox(height: AppSpacing.sm),
        if (followUps.isEmpty)
          const SizedBox(
            height: 200,
            child: Center(
              child: Text(
                'لا توجد سجلات سابقة',
                style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
              ),
            ),
          )
        else
          ...followUps.map((item) {
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
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.menu_book_rounded, color: AppColors.primaryLight, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DataParsingHelper.readString(item['surah'], fallback: 'سورة غير محددة'),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, fontFamily: 'Cairo'),
                        ),
                        Text(
                          formattedDate,
                          style: const TextStyle(color: AppColors.textSecondaryLight, fontSize: 12, fontFamily: 'Cairo'),
                        ),
                      ],
                    ),
                  ),
                  _Stars(rating: DataParsingHelper.ratingToScore(item['rating'])),
                ],
              ),
            );
          }),
      ],
    );
  }
}

class _RecitationTargetCard extends StatelessWidget {
  final List<Map<String, dynamic>> followUps;
  final Map<String, dynamic>? activePlan;

  const _RecitationTargetCard({
    required this.followUps,
    this.activePlan,
  });

  @override
  Widget build(BuildContext context) {
    if (followUps.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: const Column(
          children: [
            Icon(Icons.info_outline_rounded, color: AppColors.primaryLight, size: 24),
            SizedBox(height: 8),
            Text(
              'ابدأ رحلتك القرآنية اليوم بالتسميع مع معلمك ليظهر لك هنا ورد الغد المقترح والتحفيز اليومي.',
              textAlign: TextAlign.center,
              style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w600, fontSize: 13, height: 1.4),
            ),
          ],
        ),
      );
    }

    final latest = followUps.first;
    final dateStr = latest['recordDate']?.toString() ?? '';
    final latestDate = DateTime.tryParse(dateStr);
    
    bool hasRecitedToday = false;
    if (latestDate != null) {
      final now = DateTime.now();
      hasRecitedToday = latestDate.year == now.year &&
          latestDate.month == now.month &&
          latestDate.day == now.day;
    }

    final now = DateTime.now();
    final dayOfYear = now.difference(DateTime(now.year, 1, 1)).inDays;
    final quotes = [
      '«خيركم من تعلم القرآن وعلمه» - حلقة اليوم بانتظارك، لا تدع يومك يمضي دون ورد من كتاب الله 📖✨',
      'حفظ القرآن رحلة ممتدة خطوة بخطوة، غيابك اليوم ليس نهاية المطاف، بادر بالتسميع وعاود مسيرتك المباركة! 💪🌱',
      '«ورتّل القرآن ترتيلاً» - ننتظرك لتنير يومك بالقرآن الكريم، عُد إلى وردك بنشاط وتسميع جديد! ☀️💡',
      'كلام الله ربيع القلوب، بانتظارك غداً لتسميع وردك الجديد ومواصلة طريق النور 🌹🌟',
      '«إن هذا القرآن يهدي للتي هي أقوم» - خطوة صغيرة اليوم تصنع إنجازاً عظيماً غداً، لا تتوقف عن وردك اليومي 🎯💫',
    ];
    final quote = quotes[dayOfYear % quotes.length];

    final lastSurahName = DataParsingHelper.readString(latest['surah']);
    final lastToAyah = DataParsingHelper.readInt(latest['toAyah']) ?? 0;
    
    String nextTargetLabel = '';
    final surahDetail = QuranData.findByName(lastSurahName);
    if (surahDetail != null) {
      if (lastToAyah < surahDetail.ayahCount) {
        nextTargetLabel = 'متابعة حفظ سورة $lastSurahName بدءاً من آية ${lastToAyah + 1}';
      } else {
        final nextSurahNum = surahDetail.number + 1;
        final nextSurah = QuranData.findByNumber(nextSurahNum);
        if (nextSurah != null) {
          nextTargetLabel = 'البدء في حفظ سورة ${nextSurah.name} من آية 1';
        } else {
          nextTargetLabel = 'مبارك الختم! استمر في تثبيت ومراجعة السور 💐';
        }
      }
    } else {
      nextTargetLabel = 'متابعة الورد التالي من خطتك النشطة مع معلمك';
    }

    final cardColor = hasRecitedToday ? const Color(0xFFF1FAF4) : const Color(0xFFFFF8EC);
    final borderColor = hasRecitedToday ? AppColors.successLight : AppColors.warningLight;
    final iconColor = hasRecitedToday ? AppColors.successLight : AppColors.warningLight;
    final title = hasRecitedToday ? 'تم إنجاز ورد اليوم! 🎉' : 'توجيه وتحفيز اليوم 💡';

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderColor.withValues(alpha: 0.25), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(hasRecitedToday ? Icons.check_circle_outline_rounded : Icons.lightbulb_outline_rounded, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  color: iconColor,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            hasRecitedToday 
                ? 'أحسنت! لقد قمت بالتسميع اليوم وخطوت خطوة مباركة نحو إتمام خطتك. استمر على هذه الهمة العالية! 🚀🌟'
                : quote,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              fontFamily: 'Cairo',
              color: Color(0xFF475569),
              height: 1.4,
            ),
          ),
          const Divider(height: 24, thickness: 1, color: Color(0xFFE2E8F0)),
          Row(
            children: [
              const Icon(Icons.gps_fixed_rounded, color: Color(0xFF64748B), size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  hasRecitedToday ? 'ورد الغد المقترح:' : 'الورد المتبقي/المقترح للتسميع:',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(right: 24),
            child: Text(
              nextTargetLabel,
              style: const TextStyle(
                color: Color(0xFF1E293B),
                fontWeight: FontWeight.w900,
                fontSize: 14,
                fontFamily: 'Cairo',
              ),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(right: 24),
            child: Text(
              'آخر تسميع: $lastSurahName (آية $lastToAyah)',
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w700,
                fontSize: 11,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ],
      ),
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
