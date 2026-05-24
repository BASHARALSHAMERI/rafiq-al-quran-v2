import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rafiq_mobile/presentation/context/role_navigation.dart';
import 'package:rafiq_mobile/presentation/shared/widgets/premium_bottom_bar.dart';

void main() {
  testWidgets('renders safely when items are empty', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: PremiumBottomBar(
            items: const [],
            selectedIndex: 0,
            onItemSelected: (_) {},
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
  });

  testWidgets('renders safely when selected index is out of range',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: PremiumBottomBar(
            items: const [
              PremiumBottomBarItem(
                label: 'Home',
                icon: Icons.home_outlined,
                selectedIcon: Icons.home,
              ),
            ],
            selectedIndex: 2,
            onItemSelected: (_) {},
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Home'), findsOneWidget);
  });
}
