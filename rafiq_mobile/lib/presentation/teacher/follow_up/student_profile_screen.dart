import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/enums/user_role.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/entities/student_profile.dart';
import '../../shared/providers/current_user_role_provider.dart';
import 'providers/follow_up_providers.dart';
import '../../shared/widgets/standard_app_bar.dart';
import 'widgets/student_follow_up_tab.dart';
import 'widgets/student_profile_sections.dart';

class StudentProfileScreen extends ConsumerStatefulWidget {
  final int studentId;

  const StudentProfileScreen({super.key, required this.studentId});

  @override
  ConsumerState<StudentProfileScreen> createState() =>
      _StudentProfileScreenState();
}

class _StudentProfileScreenState extends ConsumerState<StudentProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(studentProfileProvider(widget.studentId));

    return Scaffold(
      backgroundColor: context.surfaceColor,
      appBar: StandardAppBar(
        title: 'متابعة الطالب',
        actions: [
          IconButton(
            icon: Icon(
              Icons.refresh_rounded,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            onPressed: () =>
                ref.invalidate(studentProfileProvider(widget.studentId)),
          ),
        ],
      ),
      body: profileAsync.when(
        data: _buildBody,
        loading: () => Center(
          child: CircularProgressIndicator(
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        error: (error, _) => StudentProfileErrorState(
          error: error,
          onRetry: () =>
              ref.invalidate(studentProfileProvider(widget.studentId)),
        ),
      ),
    );
  }

  Widget _buildBody(StudentProfile profile) {
    final currentRole = ref.watch(currentUserRoleProvider);
    final canRecordFollowUp = currentRole?.canEvaluateStudents ?? false;

    return Column(
      children: [
        StudentProfileHeaderCard(profile: profile),
        Expanded(
          child: StudentFollowUpTab(
            studentId: widget.studentId,
            readOnly: !canRecordFollowUp,
          ),
        ),
      ],
    );
  }
}
