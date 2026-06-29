import 'package:flutter_test/flutter_test.dart';
import 'package:rafiq_mobile/presentation/exams/widgets/exam_shared_widgets.dart';

void main() {
  test('splitListText supports Arabic and western separators', () {
    expect(
      splitListText('جمال الصوت، قوة الحفظ, إتقان التجويد;\nجمال الصوت'),
      ['جمال الصوت', 'قوة الحفظ', 'إتقان التجويد'],
    );
  });
}
