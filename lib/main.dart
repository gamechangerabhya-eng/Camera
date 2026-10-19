import 'dart:ui_web' as ui_web; import 'package:flutter/material.dart'; import 'package:web/web.dart' as web;
void main(){WidgetsFlutterBinding.ensureInitialized();ui_web.platformViewRegistry.registerViewFactory('portrait',(id)=>web.document.createElement('portrait-pro'));runApp(const MaterialApp(debugShowCheckedModeBanner:false,home:Scaffold(body:HtmlElementView(viewType:'portrait'))));}
