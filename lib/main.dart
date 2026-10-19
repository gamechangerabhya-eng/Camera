import 'dart:ui_web' as ui_web;
import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;
void main(){WidgetsFlutterBinding.ensureInitialized();ui_web.platformViewRegistry.registerViewFactory('portrait-studio',(id)=>web.document.createElement('portrait-studio-pro'));runApp(const App());}
class App extends StatelessWidget{const App({super.key});@override Widget build(BuildContext context)=>const MaterialApp(debugShowCheckedModeBanner:false,home:Scaffold(body:HtmlElementView(viewType:'portrait-studio')));}
