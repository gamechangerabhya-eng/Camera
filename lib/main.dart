import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;
import 'dart:ui_web' as ui_web;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  ui_web.platformViewRegistry.registerViewFactory('ai-camera-studio', (int id) {
    final element = web.document.createElement('ai-camera-studio');
    element.id = 'ai-camera-studio-$id';
    return element;
  });
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Realtime AI Background Studio',
        theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff5b5bd6)), useMaterial3: true),
        home: const Scaffold(
          body: SafeArea(child: HtmlElementView(viewType: 'ai-camera-studio')),
        ),
      );
}
