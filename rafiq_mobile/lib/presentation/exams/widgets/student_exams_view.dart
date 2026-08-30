import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/exam_dtos.dart';
import '../../../application/exams/exam_controller.dart';

class StudentExamsPremiumView extends StatefulWidget {
  final ExamState examState;
  final Future<void> Function() onRefresh;

  const StudentExamsPremiumView({
    super.key,
    required this.examState,
    required this.onRefresh,
  });

  @override
  State<StudentExamsPremiumView> createState() => _StudentExamsPremiumViewState();
}

class _StudentExamsPremiumViewState extends State<StudentExamsPremiumView> {
  String _selectedFilter = 'الكل';

  List<ExamAttemptDto> _filterAttempts(List<ExamAttemptDto> attempts) {
    if (_selectedFilter == 'الكل') return attempts;
    
    return attempts.where((attempt) {
      final title = (attempt.exam?.title ?? '').toLowerCase();
      if (_selectedFilter == 'حفظ') return title.contains('حفظ');
      if (_selectedFilter == 'مراجعة') return title.contains('مراجعة');
      if (_selectedFilter == 'شهري') return title.contains('شهري');
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final rawAttempts = widget.examState.attempts;
    final filteredAttempts = _filterAttempts(rawAttempts);
    final primary = Theme.of(context).colorScheme.primary;
    final custom = context.customColors;
    
    // Calculate Metrics
    final completedAttempts = rawAttempts.where((a) => a.totalScore != null && a.exam != null).toList();
    double averageScore = 0;
    double highestScore = 0;
    if (completedAttempts.isNotEmpty) {
      final percentages = completedAttempts.map((a) => (a.totalScore! / a.exam!.maxScore) * 100).toList();
      averageScore = percentages.reduce((a, b) => a + b) / percentages.length;
      highestScore = percentages.reduce((a, b) => a > b ? a : b);
    }
    
    final upcomingExams = filteredAttempts.where((a) {
      final s = a.status.toUpperCase();
      return s == 'SCHEDULED' || s == 'IN_PROGRESS' || s == 'PENDING';
    }).toList();
    
    final pastExams = filteredAttempts.where((a) {
      final s = a.status.toUpperCase();
      return s == 'EVALUATED' || s == 'APPROVED' || s == 'PUBLISHED' || s == 'REVIEWED' || s == 'COMPLETED';
    }).toList();

    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      color: primary,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        children: [
          // 1. Metrics Grid (Top)
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  label: 'المعدل العام',
                  value: '${averageScore.round()}%',
                  color: primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MetricCard(
                  label: 'أعلى درجة',
                  value: '${highestScore.round()}%',
                  color: custom.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MetricCard(
                  label: 'اختبارات قادمة',
                  value: '${upcomingExams.length}',
                  color: custom.warning,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 2. Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: 'الكل', 
                  isSelected: _selectedFilter == 'الكل',
                  onTap: () => setState(() => _selectedFilter = 'الكل'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'حفظ', 
                  isSelected: _selectedFilter == 'حفظ',
                  onTap: () => setState(() => _selectedFilter = 'حفظ'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'مراجعة', 
                  isSelected: _selectedFilter == 'مراجعة',
                  onTap: () => setState(() => _selectedFilter = 'مراجعة'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'شهري', 
                  isSelected: _selectedFilter == 'شهري',
                  onTap: () => setState(() => _selectedFilter = 'شهري'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // 3. Upcoming Exams Section
          if (upcomingExams.isNotEmpty) ...[
            const _SectionHeader(title: 'الاختبارات القادمة'),
            const SizedBox(height: 16),
            ...upcomingExams.map((exam) => _UpcomingExamCard(attempt: exam)),
            const SizedBox(height: 28),
          ] else ...[
            const _SectionHeader(title: 'الاختبارات القادمة'),
            const SizedBox(height: 16),
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'لا توجد اختبارات قادمة مجدولة حالياً',
                  style: TextStyle(
                    color: context.textSecondaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),
          ],

          // 4. Previous Results Section
          const _SectionHeader(title: 'النتائج السابقة'),
          const SizedBox(height: 16),
          if (pastExams.isEmpty)
             const _EmptyResults()
          else
            ...pastExams.map((exam) => _PastResultCard(attempt: exam)),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MetricCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 110,
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: context.isDark ? 0.15 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: context.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label, 
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? primary : context.cardColor,
          borderRadius: BorderRadius.circular(14),
          border: isSelected ? null : Border.all(color: context.borderColor),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : context.textSecondaryColor,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w900,
        color: context.textPrimaryColor,
      ),
    );
  }
}

String _getExamTypeLabel(String? title) {
  if (title == null) return 'اختبار';
  if (title.contains('شهري')) return 'شهري';
  if (title.contains('نهائي')) return 'نهائي';
  if (title.contains('حفظ')) return 'حفظ';
  if (title.contains('مراجعة')) return 'مراجعة';
  return 'اختبار';
}

class _UpcomingExamCard extends StatelessWidget {
  final ExamAttemptDto attempt;
  const _UpcomingExamCard({required this.attempt});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final dateStr = attempt.examDate != null 
        ? DateFormat('d MMMM y', 'ar').format(DateTime.parse(attempt.examDate!))
        : (attempt.updatedAt != null ? DateFormat('d MMMM y', 'ar').format(DateTime.parse(attempt.updatedAt!)) : 'قريباً');

    final typeLabel = _getExamTypeLabel(attempt.exam?.title);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: primary.withValues(alpha: context.isDark ? 0.16 : 0.06),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Badges (Right/Start)
          Column(
            children: [
              _MiniBadge(label: 'قادم', color: primary, bgColor: primary.withValues(alpha: context.isDark ? 0.22 : 0.12)),
              const SizedBox(height: 6),
              _MiniBadge(label: typeLabel, color: context.textSecondaryColor, bgColor: context.cardColor),
            ],
          ),
          const SizedBox(width: 16),
          // Content (Middle)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (attempt.student != null && attempt.student!.fullName.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      attempt.student!.fullName,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: primary,
                      ),
                    ),
                  ),
                Text(
                  attempt.exam?.title ?? 'اختبار مجدول',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: context.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 13,
                    color: context.textSecondaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (attempt.exam?.examBranch != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.menu_book_rounded, size: 12, color: context.textSecondaryColor),
                      const SizedBox(width: 4),
                      Text(
                        attempt.exam!.examBranch!,
                        style: TextStyle(
                          fontSize: 12,
                          color: context.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          // Icon (Left/End)
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: primary.withValues(alpha: context.isDark ? 0.22 : 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.access_time_filled_rounded, color: primary, size: 26),
          ),
        ],
      ),
    );
  }
}

class _PastResultCard extends StatelessWidget {
  final ExamAttemptDto attempt;
  const _PastResultCard({required this.attempt});

  @override
  Widget build(BuildContext context) {
    final custom = context.customColors;
    final primary = Theme.of(context).colorScheme.primary;
    final scorePercent = attempt.exam != null && attempt.totalScore != null 
        ? (attempt.totalScore! / attempt.exam!.maxScore * 100).round() 
        : 0;
        
    final dateStr = attempt.updatedAt != null 
        ? DateFormat('d MMMM y', 'ar').format(DateTime.parse(attempt.updatedAt!))
        : '';

    final typeLabel = _getExamTypeLabel(attempt.exam?.title);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: context.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: context.isDark ? 0.15 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        children: [
          // Score Section (Right/Start)
          SizedBox(
            width: 60,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  '$scorePercent%',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: custom.success,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  attempt.gradeLabel ?? '-',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: custom.success,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Content (Middle)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (attempt.student != null && attempt.student!.fullName.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      attempt.student!.fullName,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: primary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        attempt.exam?.title ?? 'نتيجة اختبار',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: context.textPrimaryColor,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _MiniBadge(label: typeLabel, color: context.textSecondaryColor, bgColor: context.surfaceColor),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 12,
                    color: context.textSecondaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Icon (Left/End)
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: custom.success.withValues(alpha: context.isDark ? 0.20 : 0.10),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.check_circle_outline_rounded, color: custom.success, size: 24),
          ),
        ],
      ),
    );
  }
}

class _MiniBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color? bgColor;
  const _MiniBadge({required this.label, required this.color, this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor ?? color.withValues(alpha: context.isDark ? 0.20 : 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(Icons.assignment_turned_in_outlined, size: 64, color: context.textSecondaryColor.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(
              'لا توجد نتائج مطابقة لبحثك حالياً',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: context.textSecondaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
