import 'package:hijri_calendar/hijri_calendar.dart';
import 'package:intl/intl.dart';

String formatGregorianMonthLabel({
  required int month,
  required int year,
}) {
  final date = DateTime(year, month, 1);
  return DateFormat('MMMM y', 'ar').format(date);
}

String formatGregorianDateLabel(
  DateTime date, {
  String pattern = 'd MMMM y',
}) {
  return DateFormat(pattern, 'ar').format(date);
}

String formatDualMonthLabel({
  required int month,
  required int year,
}) {
  final date = DateTime(year, month, 1);
  final nextDate = DateTime(year, month + 1, 0);
  final gregorian = DateFormat('MMMM y', 'ar').format(date);

  HijriCalendarConfig.language = 'ar';
  final hijriStart = HijriCalendarConfig.fromGregorian(date);
  final hijriEnd = HijriCalendarConfig.fromGregorian(nextDate);
  final hijriMonth = hijriStart.hMonth == hijriEnd.hMonth &&
          hijriStart.hYear == hijriEnd.hYear
      ? '${hijriStart.getLongMonthName()} ${hijriStart.hYear} هـ'
      : '${hijriStart.getLongMonthName()} - ${hijriEnd.getLongMonthName()} ${hijriEnd.hYear} هـ';

  return '$hijriMonth • $gregorian';
}
