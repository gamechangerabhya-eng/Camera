import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

void main() => runApp(const BackgroundStudioApp());

class BackgroundStudioApp extends StatelessWidget {
  const BackgroundStudioApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Background Studio',
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff6750a4)), useMaterial3: true),
      home: const StudioPage(),
    );
  }
}

class StudioPage extends StatefulWidget {
  const StudioPage({super.key});
  @override
  State<StudioPage> createState() => _StudioPageState();
}

class _StudioPageState extends State<StudioPage> {
  final _picker = ImagePicker();
  final _prompt = TextEditingController();
  Uint8List? _photo;
  String _background = 'Professional';
  final backgrounds = const ['Professional', 'Beach', 'Nature', 'City', 'Studio', 'Gradient'];

  Future<void> _capture() async {
    final file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 90);
    if (file != null) setState(() => _photo = null);
    if (file != null) {
      final bytes = await file.readAsBytes();
      if (mounted) setState(() => _photo = bytes);
    }
  }

  Future<void> _upload() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 90);
    if (file != null) {
      final bytes = await file.readAsBytes();
      if (mounted) setState(() => _photo = bytes);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xfff6f5fb),
      appBar: AppBar(title: const Text('AI Background Studio'), centerTitle: true),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(children: [
              Card(
                clipBehavior: Clip.antiAlias,
                child: SizedBox(
                  height: 440,
                  width: double.infinity,
                  child: _photo == null
                      ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.camera_alt_outlined, size: 80), SizedBox(height: 12), Text('Take or upload a photo')]))
                      : Image.memory(_photo!, fit: BoxFit.contain),
                ),
              ),
              const SizedBox(height: 16),
              Wrap(spacing: 12, runSpacing: 12, alignment: WrapAlignment.center, children: [
                FilledButton.icon(onPressed: _capture, icon: const Icon(Icons.camera_alt), label: const Text('Take Photo')),
                OutlinedButton.icon(onPressed: _upload, icon: const Icon(Icons.upload), label: const Text('Upload Photo')),
              ]),
              const SizedBox(height: 28),
              const Align(alignment: Alignment.centerLeft, child: Text('Choose a background', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: backgrounds.map((b) => ChoiceChip(label: Text(b), selected: _background == b, onSelected: (_) => setState(() => _background = b))).toList()),
              const SizedBox(height: 20),
              TextField(controller: _prompt, decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Describe your own background', hintText: 'Example: modern office with warm natural lighting')),
              const SizedBox(height: 12),
              const Text('MVP note: camera/upload works now. Automatic person cutout and free-text AI background generation require an image-processing/AI service and are intentionally not faked in this GitHub-only build.', style: TextStyle(color: Colors.black54)),
              const SizedBox(height: 18),
              FilledButton.icon(onPressed: _photo == null ? null : () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Selected background: ${_prompt.text.trim().isEmpty ? _background : _prompt.text.trim()}'))), icon: const Icon(Icons.auto_awesome), label: const Text('Apply Background')),
            ]),
          ),
        ),
      ),
    );
  }
}
