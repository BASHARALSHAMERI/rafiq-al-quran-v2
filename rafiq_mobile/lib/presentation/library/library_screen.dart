import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:open_filex/open_filex.dart';

import '../../application/context/context_controller.dart';
import '../../application/library/library_controller.dart';
import '../../core/config/env_config.dart';
import '../../core/enums/user_role.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/library_dtos.dart';
import '../shared/providers/current_user_role_provider.dart';
import '../shared/states/app_empty_state.dart';
import '../shared/widgets/premium_app_bar.dart';

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  int? _selectedCategoryId;
  String? _selectedType;
  String _lastLoadKey = '';

  bool _usesContextFilters(UserRole? role) {
    return role == UserRole.superAdmin ||
        role == UserRole.centerAdmin ||
        role == UserRole.supervisor ||
        role == UserRole.teacher;
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _ensureDataLoaded() {
    final contextState = ref.read(contextControllerProvider);
    final currentRole = ref.read(currentUserRoleProvider);
    final usesContextFilters = _usesContextFilters(currentRole);
    final centerId = usesContextFilters
        ? int.tryParse(contextState.selectedCenterId ?? '')
        : null;
    final circleId = usesContextFilters
        ? int.tryParse(contextState.selectedCircleId ?? '')
        : null;
    final search = _searchController.text.trim();
    final key =
        '${usesContextFilters ? 'scoped' : 'global'}:$centerId:$circleId:${_selectedCategoryId ?? 0}:${_selectedType ?? 'ALL'}:$search';
    if (_lastLoadKey == key) {
      return;
    }
    _lastLoadKey = key;
    Future.microtask(
      () => ref.read(libraryControllerProvider.notifier).loadLibrary(
            centerId: centerId,
            circleId: circleId,
            categoryId: _selectedCategoryId,
            q: search.isEmpty ? null : search,
            type: _selectedType,
          ),
    );
  }

  Future<void> _refresh() async {
    _lastLoadKey = '';
    _ensureDataLoaded();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) {
        return;
      }
      _lastLoadKey = '';
      _ensureDataLoaded();
    });
    setState(() {});
  }

  Future<void> _handleItemAction(
    LibraryItemDto item, {
    required bool openAfterDownload,
  }) async {
    final path =
        await ref.read(libraryControllerProvider.notifier).downloadItem(item);
    if (!mounted) {
      return;
    }

    if (path == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تعذر تنزيل الملف أو حفظه محليًا.'),
        ),
      );
      return;
    }

    if (!openAfterDownload) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم حفظ الملف: ${item.fileName}')),
      );
      return;
    }

    final result = await OpenFilex.open(path);
    if (!mounted) {
      return;
    }

    if (result.type == ResultType.done) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم فتح ${item.fileName}')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.message.trim().isEmpty
              ? 'تم تنزيل الملف، لكن لم يتم العثور على تطبيق مناسب لفتحه.'
              : result.message,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final libraryState = ref.watch(libraryControllerProvider);
    final contextState = ref.watch(contextControllerProvider);
    _ensureDataLoaded();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF8),
      appBar: PremiumAppBar(
        title: 'المكتبة الرقمية',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF334155)),
            onPressed: _refresh,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: _SearchField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                onClear: () {
                  _searchController.clear();
                  _lastLoadKey = '';
                  _ensureDataLoaded();
                  setState(() {});
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _ContextHeader(
                centerName: contextState.selectedCenterName ?? 'المركز الحالي',
                circleName: contextState.selectedCircleName ?? 'الحلقة الحالية',
              ),
            ),
            const SizedBox(height: 16),
            _TypeFilterRow(
              selectedType: _selectedType,
              onTypeSelected: (type) {
                setState(() => _selectedType = type);
                _lastLoadKey = '';
                _ensureDataLoaded();
              },
            ),
            const SizedBox(height: 16),
            libraryState.when(
              initial: () => const SizedBox.shrink(),
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (message) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: AppEmptyState(
                  title: 'تعذر تحميل المكتبة',
                  subtitle: message,
                  icon: Icons.error_outline_rounded,
                  actionLabel: 'إعادة المحاولة',
                  onAction: _refresh,
                ),
              ),
              loaded: (categories, items, categoriesError, itemsError) {
                final resolvedCategoryId = categories
                        .any((category) => category.id == _selectedCategoryId)
                    ? _selectedCategoryId
                    : null;
                if (resolvedCategoryId != _selectedCategoryId) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) {
                      setState(() => _selectedCategoryId = resolvedCategoryId);
                    }
                  });
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(
                      height: 44,
                      child: _CategoriesRow(
                        categories: categories,
                        selectedCategoryId: resolvedCategoryId,
                        onCategorySelected: (categoryId) {
                          setState(() => _selectedCategoryId = categoryId);
                          _lastLoadKey = '';
                          _ensureDataLoaded();
                        },
                      ),
                    ),
                    if (categoriesError != null) ...[
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _LoadIssueBanner(
                          icon: Icons.folder_off_rounded,
                          message: categoriesError,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'العناصر المتاحة',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            '${items.length} عنصر',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (itemsError != null) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _LoadIssueBanner(
                          icon: Icons.cloud_off_rounded,
                          message: itemsError,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (items.isEmpty && itemsError == null)
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: AppEmptyState(
                          title: 'لا توجد عناصر',
                          subtitle:
                              'جرّب تغيير عبارة البحث أو الفئة المختارة لعرض نتائج أخرى.',
                          icon: Icons.library_books_outlined,
                        ),
                      )
                    else if (items.isEmpty && itemsError != null)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: AppEmptyState(
                          title: 'تعذر تحميل عناصر المكتبة',
                          subtitle: itemsError,
                          icon: Icons.error_outline_rounded,
                          actionLabel: 'إعادة المحاولة',
                          onAction: _refresh,
                        ),
                      )
                    else
                      ...items.map(
                        (item) => Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _LibraryItemCard(
                            item: item,
                            onOpen: () => _handleItemAction(
                              item,
                              openAfterDownload: true,
                            ),
                            onDownload: () => _handleItemAction(
                              item,
                              openAfterDownload: false,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  const _SearchField({
    required this.controller,
    required this.onChanged,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        textAlign: TextAlign.right,
        decoration: InputDecoration(
          hintText: 'ابحث عن الكتب أو الملفات أو المناهج...',
          hintStyle: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 14,
          ),
          suffixIcon: controller.text.trim().isEmpty
              ? const Icon(
                  Icons.search_rounded,
                  color: Color(0xFF7A9F78),
                  size: 24,
                )
              : IconButton(
                  onPressed: onClear,
                  icon: const Icon(
                    Icons.close_rounded,
                    color: Color(0xFF7A9F78),
                  ),
                ),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }
}

class _ContextHeader extends StatelessWidget {
  final String centerName;
  final String circleName;

  const _ContextHeader({
    required this.centerName,
    required this.circleName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          _ContextPill(icon: Icons.apartment_rounded, text: centerName),
          _ContextPill(icon: Icons.groups_rounded, text: circleName),
        ],
      ),
    );
  }
}

class _ContextPill extends StatelessWidget {
  final IconData icon;
  final String text;

  const _ContextPill({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF537A5A)),
          const SizedBox(width: 6),
          Text(text),
        ],
      ),
    );
  }
}

class _LoadIssueBanner extends StatelessWidget {
  final IconData icon;
  final String message;

  const _LoadIssueBanner({
    required this.icon,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF92400E)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF78350F),
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoriesRow extends StatelessWidget {
  final List<LibraryCategoryDto> categories;
  final int? selectedCategoryId;
  final ValueChanged<int?> onCategorySelected;

  const _CategoriesRow({
    required this.categories,
    required this.selectedCategoryId,
    required this.onCategorySelected,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      scrollDirection: Axis.horizontal,
      itemCount: categories.length + 1,
      separatorBuilder: (_, __) => const SizedBox(width: 8),
      itemBuilder: (context, index) {
        if (index == 0) {
          return _CategoryChip(
            label: 'الكل',
            isSelected: selectedCategoryId == null,
            onTap: () => onCategorySelected(null),
          );
        }
        final category = categories[index - 1];
        return _CategoryChip(
          label: category.name,
          isSelected: selectedCategoryId == category.id,
          onTap: () => onCategorySelected(category.id),
        );
      },
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF7A9F78) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? Colors.transparent : const Color(0xFFE2E8F0),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF7A9F78).withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF475569),
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}

class _LibraryItemCard extends StatelessWidget {
  final LibraryItemDto item;
  final VoidCallback onOpen;
  final VoidCallback onDownload;

  const _LibraryItemCard({
    required this.item,
    required this.onOpen,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    final description = item.description?.trim().isNotEmpty == true
        ? item.description!.trim()
        : 'بدون وصف';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight, width: 0.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Row(
            children: [
              _ActionButton(
                icon: Icons.file_download_outlined,
                color: const Color(0xFF7A9F78),
                isSolid: false,
                onTap: onDownload,
              ),
              const SizedBox(width: 8),
              _ActionButton(
                icon: item.type == 'AUDIO'
                    ? Icons.play_arrow_rounded
                    : item.type == 'VIDEO'
                        ? Icons.play_circle_outline_rounded
                        : Icons.visibility_rounded,
                color: const Color(0xFF334155),
                isSolid: true,
                onTap: onOpen,
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  item.title,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$description • ${(item.fileSize / 1024 / 1024).toStringAsFixed(1)} MB',
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.end,
                  children: [
                    _TypeBadge(text: _labelForType(item.type)),
                    _TypeBadge(text: _labelForVisibility(item.visibility)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          _CoverThumbnail(
            itemId: item.id,
            hasCover: item.hasCover,
            type: item.type,
            fallbackColor: _colorForType(item.type),
            fallbackIcon: _iconForType(item.type),
          ),
        ],
      ),
    );
  }

  String _labelForType(String type) {
    switch (type) {
      case 'DOCUMENT':
        return 'مستند';
      case 'AUDIO':
        return 'صوتي';
      case 'VIDEO':
        return 'فيديو';
      default:
        return 'ملف';
    }
  }

  String _labelForVisibility(String visibility) {
    switch (visibility) {
      case 'ORG':
        return 'عام';
      case 'CENTER':
        return 'المركز';
      case 'CIRCLE':
        return 'الحلقة';
      default:
        return visibility;
    }
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'AUDIO':
        return Icons.headphones_rounded;
      case 'VIDEO':
        return Icons.play_circle_filled_rounded;
      case 'DOCUMENT':
        return Icons.menu_book_rounded;
      default:
        return Icons.insert_drive_file_rounded;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'AUDIO':
        return const Color(0xFF7C3AED); // Violet
      case 'VIDEO':
        return const Color(0xFFF59E0B); // Amber
      case 'DOCUMENT':
        return const Color(0xFF1B5E20); // Green
      default:
        return const Color(0xFF64748B); // Slate
    }
  }
}

class _TypeFilterRow extends StatelessWidget {
  final String? selectedType;
  final ValueChanged<String?> onTypeSelected;

  const _TypeFilterRow({
    required this.selectedType,
    required this.onTypeSelected,
  });

  @override
  Widget build(BuildContext context) {
    final types = [
      (null, 'الكل', Icons.all_inclusive_rounded),
      ('DOCUMENT', 'مستندات', Icons.description_rounded),
      ('AUDIO', 'صوتيات', Icons.audiotrack_rounded),
      ('VIDEO', 'مرئيات', Icons.play_circle_outline_rounded),
    ];

    return SizedBox(
      height: 40,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: types.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final type = types[index];
          final isSelected = selectedType == type.$1;
          return GestureDetector(
            onTap: () => onTypeSelected(type.$1),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF7A9F78) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color:
                      isSelected ? Colors.transparent : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    type.$3,
                    size: 16,
                    color: isSelected ? Colors.white : const Color(0xFF64748B),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    type.$2,
                    style: TextStyle(
                      color:
                          isSelected ? Colors.white : const Color(0xFF475569),
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String text;

  const _TypeBadge({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF7A9F78),
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// يعرض صورة الغلاف إذا وُجدت، وإلا يعرض مستطيلاً ملوناً مع أيقونة.
/// يقرأ الـ JWT token من SecureStorage ويُلحقه بالرابط للمصادقة.
class _CoverThumbnail extends StatefulWidget {
  final int itemId;
  final bool hasCover;
  final String type;
  final Color fallbackColor;
  final IconData fallbackIcon;

  const _CoverThumbnail({
    required this.itemId,
    required this.hasCover,
    required this.type,
    required this.fallbackColor,
    required this.fallbackIcon,
  });

  @override
  State<_CoverThumbnail> createState() => _CoverThumbnailState();
}

class _CoverThumbnailState extends State<_CoverThumbnail> {
  static const _storage = FlutterSecureStorage();
  String? _coverUrl;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.hasCover) {
      _buildUrl();
    } else {
      _loading = false;
    }
  }

  Future<void> _buildUrl() async {
    final token = await _storage.read(key: 'access_token');
    final base = EnvConfig.baseUrl;
    final url = '$base/library/items/${widget.itemId}/cover'
        '${token != null && token.isNotEmpty ? '?token=$token' : ''}';
    if (mounted) {
      setState(() {
        _coverUrl = url;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 70,
        height: 90,
        decoration: BoxDecoration(
          color: widget.fallbackColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 4,
              offset: const Offset(-2, 2),
            ),
          ],
        ),
        child: _loading
            ? Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
              )
            : (_coverUrl != null
                ? Image.network(
                    _coverUrl!,
                    fit: BoxFit.cover,
                    width: 70,
                    height: 90,
                    errorBuilder: (_, __, ___) => _FallbackIcon(
                      icon: widget.fallbackIcon,
                      color: widget.fallbackColor,
                    ),
                    loadingBuilder: (_, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white.withValues(alpha: 0.7),
                          ),
                        ),
                      );
                    },
                  )
                : _FallbackIcon(
                    icon: widget.fallbackIcon,
                    color: widget.fallbackColor,
                  )),
      ),
    );
  }
}

class _FallbackIcon extends StatelessWidget {
  final IconData icon;
  final Color color;

  const _FallbackIcon({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Icon(
        icon,
        color: Colors.white.withValues(alpha: 0.8),
        size: 32,
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final bool isSolid;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.color,
    required this.isSolid,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isSolid ? color.withValues(alpha: 0.1) : Colors.transparent,
          shape: BoxShape.circle,
          border:
              isSolid ? null : Border.all(color: color.withValues(alpha: 0.24)),
        ),
        child: Center(
          child: Icon(icon, color: color, size: 20),
        ),
      ),
    );
  }
}
