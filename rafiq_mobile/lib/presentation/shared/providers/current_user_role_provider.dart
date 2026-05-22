import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../application/auth/auth_controller.dart';
import '../../../core/enums/user_role.dart';

final currentUserRoleProvider = Provider<UserRole?>((ref) {
  final rawRole = ref.watch(
    authControllerProvider.select((state) => state.user?.role),
  );
  return parseUserRole(rawRole);
});
