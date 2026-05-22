// بيانات القرآن الكريم الثابتة — 114 سورة
// يحتوي على اسم كل سورة، رقمها، عدد آياتها، وصفحة البداية في المصحف (طبعة المدينة).

class QuranSurah {
  final int number;
  final String name;
  final int ayahCount;
  final int startPage;

  const QuranSurah({
    required this.number,
    required this.name,
    required this.ayahCount,
    required this.startPage,
  });

  @override
  String toString() => '$number. $name';
}

abstract class QuranData {
  /// كل سور القرآن الكريم (114 سورة)
  static const List<QuranSurah> surahs = [
    QuranSurah(number: 1, name: 'الفاتحة', ayahCount: 7, startPage: 1),
    QuranSurah(number: 2, name: 'البقرة', ayahCount: 286, startPage: 2),
    QuranSurah(number: 3, name: 'آل عمران', ayahCount: 200, startPage: 50),
    QuranSurah(number: 4, name: 'النساء', ayahCount: 176, startPage: 77),
    QuranSurah(number: 5, name: 'المائدة', ayahCount: 120, startPage: 106),
    QuranSurah(number: 6, name: 'الأنعام', ayahCount: 165, startPage: 128),
    QuranSurah(number: 7, name: 'الأعراف', ayahCount: 206, startPage: 151),
    QuranSurah(number: 8, name: 'الأنفال', ayahCount: 75, startPage: 177),
    QuranSurah(number: 9, name: 'التوبة', ayahCount: 129, startPage: 187),
    QuranSurah(number: 10, name: 'يونس', ayahCount: 109, startPage: 208),
    QuranSurah(number: 11, name: 'هود', ayahCount: 123, startPage: 221),
    QuranSurah(number: 12, name: 'يوسف', ayahCount: 111, startPage: 235),
    QuranSurah(number: 13, name: 'الرعد', ayahCount: 43, startPage: 249),
    QuranSurah(number: 14, name: 'إبراهيم', ayahCount: 52, startPage: 255),
    QuranSurah(number: 15, name: 'الحجر', ayahCount: 99, startPage: 262),
    QuranSurah(number: 16, name: 'النحل', ayahCount: 128, startPage: 267),
    QuranSurah(number: 17, name: 'الإسراء', ayahCount: 111, startPage: 282),
    QuranSurah(number: 18, name: 'الكهف', ayahCount: 110, startPage: 293),
    QuranSurah(number: 19, name: 'مريم', ayahCount: 98, startPage: 305),
    QuranSurah(number: 20, name: 'طه', ayahCount: 135, startPage: 312),
    QuranSurah(number: 21, name: 'الأنبياء', ayahCount: 112, startPage: 322),
    QuranSurah(number: 22, name: 'الحج', ayahCount: 78, startPage: 332),
    QuranSurah(number: 23, name: 'المؤمنون', ayahCount: 118, startPage: 342),
    QuranSurah(number: 24, name: 'النور', ayahCount: 64, startPage: 350),
    QuranSurah(number: 25, name: 'الفرقان', ayahCount: 77, startPage: 359),
    QuranSurah(number: 26, name: 'الشعراء', ayahCount: 227, startPage: 367),
    QuranSurah(number: 27, name: 'النمل', ayahCount: 93, startPage: 377),
    QuranSurah(number: 28, name: 'القصص', ayahCount: 88, startPage: 385),
    QuranSurah(number: 29, name: 'العنكبوت', ayahCount: 69, startPage: 396),
    QuranSurah(number: 30, name: 'الروم', ayahCount: 60, startPage: 404),
    QuranSurah(number: 31, name: 'لقمان', ayahCount: 34, startPage: 411),
    QuranSurah(number: 32, name: 'السجدة', ayahCount: 30, startPage: 415),
    QuranSurah(number: 33, name: 'الأحزاب', ayahCount: 73, startPage: 418),
    QuranSurah(number: 34, name: 'سبأ', ayahCount: 54, startPage: 428),
    QuranSurah(number: 35, name: 'فاطر', ayahCount: 45, startPage: 434),
    QuranSurah(number: 36, name: 'يس', ayahCount: 83, startPage: 440),
    QuranSurah(number: 37, name: 'الصافات', ayahCount: 182, startPage: 446),
    QuranSurah(number: 38, name: 'ص', ayahCount: 88, startPage: 453),
    QuranSurah(number: 39, name: 'الزمر', ayahCount: 75, startPage: 458),
    QuranSurah(number: 40, name: 'غافر', ayahCount: 85, startPage: 467),
    QuranSurah(number: 41, name: 'فصلت', ayahCount: 54, startPage: 477),
    QuranSurah(number: 42, name: 'الشورى', ayahCount: 53, startPage: 483),
    QuranSurah(number: 43, name: 'الزخرف', ayahCount: 89, startPage: 489),
    QuranSurah(number: 44, name: 'الدخان', ayahCount: 59, startPage: 496),
    QuranSurah(number: 45, name: 'الجاثية', ayahCount: 37, startPage: 499),
    QuranSurah(number: 46, name: 'الأحقاف', ayahCount: 35, startPage: 502),
    QuranSurah(number: 47, name: 'محمد', ayahCount: 38, startPage: 507),
    QuranSurah(number: 48, name: 'الفتح', ayahCount: 29, startPage: 511),
    QuranSurah(number: 49, name: 'الحجرات', ayahCount: 18, startPage: 515),
    QuranSurah(number: 50, name: 'ق', ayahCount: 45, startPage: 518),
    QuranSurah(number: 51, name: 'الذاريات', ayahCount: 60, startPage: 520),
    QuranSurah(number: 52, name: 'الطور', ayahCount: 49, startPage: 523),
    QuranSurah(number: 53, name: 'النجم', ayahCount: 62, startPage: 526),
    QuranSurah(number: 54, name: 'القمر', ayahCount: 55, startPage: 528),
    QuranSurah(number: 55, name: 'الرحمن', ayahCount: 78, startPage: 531),
    QuranSurah(number: 56, name: 'الواقعة', ayahCount: 96, startPage: 534),
    QuranSurah(number: 57, name: 'الحديد', ayahCount: 29, startPage: 537),
    QuranSurah(number: 58, name: 'المجادلة', ayahCount: 22, startPage: 542),
    QuranSurah(number: 59, name: 'الحشر', ayahCount: 24, startPage: 545),
    QuranSurah(number: 60, name: 'الممتحنة', ayahCount: 13, startPage: 549),
    QuranSurah(number: 61, name: 'الصف', ayahCount: 14, startPage: 551),
    QuranSurah(number: 62, name: 'الجمعة', ayahCount: 11, startPage: 553),
    QuranSurah(number: 63, name: 'المنافقون', ayahCount: 11, startPage: 554),
    QuranSurah(number: 64, name: 'التغابن', ayahCount: 18, startPage: 556),
    QuranSurah(number: 65, name: 'الطلاق', ayahCount: 12, startPage: 558),
    QuranSurah(number: 66, name: 'التحريم', ayahCount: 12, startPage: 560),
    QuranSurah(number: 67, name: 'الملك', ayahCount: 30, startPage: 562),
    QuranSurah(number: 68, name: 'القلم', ayahCount: 52, startPage: 564),
    QuranSurah(number: 69, name: 'الحاقة', ayahCount: 52, startPage: 566),
    QuranSurah(number: 70, name: 'المعارج', ayahCount: 44, startPage: 568),
    QuranSurah(number: 71, name: 'نوح', ayahCount: 28, startPage: 570),
    QuranSurah(number: 72, name: 'الجن', ayahCount: 28, startPage: 572),
    QuranSurah(number: 73, name: 'المزمل', ayahCount: 20, startPage: 574),
    QuranSurah(number: 74, name: 'المدثر', ayahCount: 56, startPage: 575),
    QuranSurah(number: 75, name: 'القيامة', ayahCount: 40, startPage: 577),
    QuranSurah(number: 76, name: 'الإنسان', ayahCount: 31, startPage: 578),
    QuranSurah(number: 77, name: 'المرسلات', ayahCount: 50, startPage: 580),
    QuranSurah(number: 78, name: 'النبأ', ayahCount: 40, startPage: 582),
    QuranSurah(number: 79, name: 'النازعات', ayahCount: 46, startPage: 583),
    QuranSurah(number: 80, name: 'عبس', ayahCount: 42, startPage: 585),
    QuranSurah(number: 81, name: 'التكوير', ayahCount: 29, startPage: 586),
    QuranSurah(number: 82, name: 'الانفطار', ayahCount: 19, startPage: 587),
    QuranSurah(number: 83, name: 'المطففين', ayahCount: 36, startPage: 587),
    QuranSurah(number: 84, name: 'الانشقاق', ayahCount: 25, startPage: 589),
    QuranSurah(number: 85, name: 'البروج', ayahCount: 22, startPage: 590),
    QuranSurah(number: 86, name: 'الطارق', ayahCount: 17, startPage: 591),
    QuranSurah(number: 87, name: 'الأعلى', ayahCount: 19, startPage: 591),
    QuranSurah(number: 88, name: 'الغاشية', ayahCount: 26, startPage: 592),
    QuranSurah(number: 89, name: 'الفجر', ayahCount: 30, startPage: 593),
    QuranSurah(number: 90, name: 'البلد', ayahCount: 20, startPage: 594),
    QuranSurah(number: 91, name: 'الشمس', ayahCount: 15, startPage: 595),
    QuranSurah(number: 92, name: 'الليل', ayahCount: 21, startPage: 595),
    QuranSurah(number: 93, name: 'الضحى', ayahCount: 11, startPage: 596),
    QuranSurah(number: 94, name: 'الشرح', ayahCount: 8, startPage: 596),
    QuranSurah(number: 95, name: 'التين', ayahCount: 8, startPage: 597),
    QuranSurah(number: 96, name: 'العلق', ayahCount: 19, startPage: 597),
    QuranSurah(number: 97, name: 'القدر', ayahCount: 5, startPage: 598),
    QuranSurah(number: 98, name: 'البينة', ayahCount: 8, startPage: 598),
    QuranSurah(number: 99, name: 'الزلزلة', ayahCount: 8, startPage: 599),
    QuranSurah(number: 100, name: 'العاديات', ayahCount: 11, startPage: 599),
    QuranSurah(number: 101, name: 'القارعة', ayahCount: 11, startPage: 600),
    QuranSurah(number: 102, name: 'التكاثر', ayahCount: 8, startPage: 600),
    QuranSurah(number: 103, name: 'العصر', ayahCount: 3, startPage: 601),
    QuranSurah(number: 104, name: 'الهمزة', ayahCount: 9, startPage: 601),
    QuranSurah(number: 105, name: 'الفيل', ayahCount: 5, startPage: 601),
    QuranSurah(number: 106, name: 'قريش', ayahCount: 4, startPage: 602),
    QuranSurah(number: 107, name: 'الماعون', ayahCount: 7, startPage: 602),
    QuranSurah(number: 108, name: 'الكوثر', ayahCount: 3, startPage: 602),
    QuranSurah(number: 109, name: 'الكافرون', ayahCount: 6, startPage: 603),
    QuranSurah(number: 110, name: 'النصر', ayahCount: 3, startPage: 603),
    QuranSurah(number: 111, name: 'المسد', ayahCount: 5, startPage: 603),
    QuranSurah(number: 112, name: 'الإخلاص', ayahCount: 4, startPage: 604),
    QuranSurah(number: 113, name: 'الفلق', ayahCount: 5, startPage: 604),
    QuranSurah(number: 114, name: 'الناس', ayahCount: 6, startPage: 604),
  ];

  /// عدد صفحات المصحف الشريف (طبعة المدينة)
  static const int totalPages = 604;

  /// البحث عن سورة بالرقم
  static QuranSurah? findByNumber(int number) {
    if (number < 1 || number > 114) return null;
    return surahs[number - 1];
  }

  /// البحث عن سورة بالاسم
  static QuranSurah? findByName(String name) {
    final trimmed = name.trim();
    try {
      return surahs.firstWhere((s) => s.name == trimmed);
    } catch (_) {
      return null;
    }
  }

  /// حساب عدد الصفحات التقريبي بناءً على السورة ونطاق الآيات
  /// يحسب النسبة من آيات السورة ثم يضربها بعدد صفحات السورة
  static double estimatePages({
    required int surahNumber,
    required int fromAyah,
    required int toAyah,
  }) {
    final surah = findByNumber(surahNumber);
    if (surah == null) return 0;

    // حساب عدد الآيات المحددة
    final clampedFrom = fromAyah.clamp(1, surah.ayahCount);
    final clampedTo = toAyah.clamp(clampedFrom, surah.ayahCount);
    final selectedAyahs = clampedTo - clampedFrom + 1;

    // حساب عدد صفحات السورة الكلي
    final nextSurah = findByNumber(surahNumber + 1);
    final surahPages = nextSurah != null
        ? nextSurah.startPage - surah.startPage
        : (totalPages - surah.startPage + 1);

    // النسبة = (الآيات المحددة / إجمالي آيات السورة) × عدد صفحات السورة
    if (surah.ayahCount == 0) return 0;
    final ratio = selectedAyahs / surah.ayahCount;
    final double maxPages = surahPages > 0 ? surahPages.toDouble() : 0.5;
    return (ratio * maxPages).clamp(0.1, maxPages);
  }

  /// حساب عدد الصفحات عبر نطاق من سورة إلى سورة أخرى
  /// مثال: من سورة البقرة آية 285 إلى سورة آل عمران آية 5
  static double estimatePagesRange({
    required int fromSurahNumber,
    required int fromAyah,
    required int toSurahNumber,
    required int toAyah,
  }) {
    // إذا كانت نفس السورة، نستخدم الحساب البسيط
    if (fromSurahNumber == toSurahNumber) {
      final startAyah = fromAyah < toAyah ? fromAyah : toAyah;
      final endAyah = fromAyah < toAyah ? toAyah : fromAyah;
      return estimatePages(
        surahNumber: fromSurahNumber,
        fromAyah: startAyah,
        toAyah: endAyah,
      );
    }

    final isReversed = fromSurahNumber > toSurahNumber;
    final startSurah = isReversed ? toSurahNumber : fromSurahNumber;
    final startAyah = isReversed ? toAyah : fromAyah;
    final endSurah = isReversed ? fromSurahNumber : toSurahNumber;
    final endAyah = isReversed ? fromAyah : toAyah;

    double total = 0;

    // الصفحات من السورة الأولى (من آية البداية حتى نهاية السورة)
    final firstSurah = findByNumber(startSurah);
    if (firstSurah != null) {
      total += estimatePages(
        surahNumber: startSurah,
        fromAyah: startAyah,
        toAyah: firstSurah.ayahCount,
      );
    }

    // الصفحات من السور الوسطى كاملة
    for (int i = startSurah + 1; i < endSurah; i++) {
      final midSurah = findByNumber(i);
      if (midSurah != null) {
        final nextSurah = findByNumber(i + 1);
        final pages = nextSurah != null
            ? nextSurah.startPage - midSurah.startPage
            : (totalPages - midSurah.startPage + 1);
        total += pages;
      }
    }

    // الصفحات من السورة الأخيرة (من بداية السورة حتى آية النهاية)
    total += estimatePages(
      surahNumber: endSurah,
      fromAyah: 1,
      toAyah: endAyah,
    );

    return total;
  }

  /// أسماء السور فقط (للبحث السريع)
  static List<String> get surahNames => surahs.map((s) => s.name).toList();

  /// تسمية التقدير بناءً على قيمة النجوم (1-5)
  static String gradeLabel(int stars) {
    switch (stars) {
      case 5:
        return 'ممتاز';
      case 4:
        return 'جيد جداً';
      case 3:
        return 'جيد';
      case 2:
        return 'مقبول';
      default:
        return 'ضعيف';
    }
  }
}
