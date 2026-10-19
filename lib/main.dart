import 'dart:ui_web' as ui_web; import 'package:flutter/material.dart'; import 'package:web/web.dart' as web;
void main(){WidgetsFlutterBinding.ensureInitialized();ui_web.platformViewRegistry.registerViewFactory('studio',(id)=>web.document.createElement('portrait-stable'));runApp(const MaterialApp(debugShowCheckedModeBanner:false,home:Scaffold(body:HtmlElementView(viewType:'studio'))));}
