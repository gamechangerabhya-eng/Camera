import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CameraStudioApp());
}

class CameraStudioApp extends StatelessWidget {
  const CameraStudioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Camera Background Studio',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff6750a4)),
        useMaterial3: true,
      ),
      home: const CameraPage(),
    );
  }
}

class CameraPage extends StatefulWidget {
  const CameraPage({super.key});

  @override
  State<CameraPage> createState() => _CameraPageState();
}

class _CameraPageState extends State<CameraPage> with WidgetsBindingObserver {
  CameraController? _controller;
  Uint8List? _capturedBytes;
  bool _starting = false;
  String? _error;
  String _background = 'Original';
  Uint8List? _resultBytes;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  Future<void> _openCamera() async {
    if (_starting) return;
    setState(() {
      _starting = true;
      _error = null;
      _capturedBytes = null;
    });

    try {
      await _controller?.dispose();
      final cameras = await availableCameras();
      if (cameras.isEmpty) throw Exception('No camera was found on this device.');

      final preferred = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      final controller = CameraController(
        preferred,
        ResolutionPreset.high,
        enableAudio: false,
      );
      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() => _controller = controller);
    } on CameraException catch (e) {
      setState(() {
        _error = e.code == 'CameraAccessDenied'
            ? 'Camera permission was denied. Allow camera access in your browser and try again.'
            : 'Unable to open camera: ${e.description ?? e.code}';
      });
    } catch (e) {
      setState(() => _error = 'Unable to open camera: $e');
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  Future<void> _takePhoto() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || controller.value.isTakingPicture) return;
    try {
      final picture = await controller.takePicture();
      final bytes = await picture.readAsBytes();
      if (mounted) setState(() => _capturedBytes = bytes);
    } on CameraException catch (e) {
      if (mounted) setState(() => _error = 'Could not capture photo: ${e.description ?? e.code}');
    }
  }

  Future<void> _retake() async {
    setState(() { _capturedBytes = null; _resultBytes = null; _background = 'Original'; });
    if (_controller == null || !_controller!.value.isInitialized) await _openCamera();
  }


  Future<void> _applyBackground(String name) async {
    final sourceBytes = _capturedBytes;
    if (sourceBytes == null) return;
    setState(() => _background = name);
    if (name == 'Original') {
      setState(() => _resultBytes = null);
      return;
    }
    final source = img.decodeImage(sourceBytes);
    if (source == null) return;
    final colors = <String, img.Color>{
      'White': img.ColorRgb8(250, 250, 250),
      'Blue': img.ColorRgb8(48, 88, 170),
      'Green': img.ColorRgb8(56, 130, 92),
      'Studio': img.ColorRgb8(40, 42, 50),
    };
    final bg = img.Image(width: source.width, height: source.height);
    img.fill(bg, color: colors[name] ?? img.ColorRgb8(245, 245, 245));

    // Lightweight center-subject mask for this GitHub-only MVP.
    // Pixels around the image edges are replaced by the chosen background,
    // while the central portrait region is retained with a soft elliptical edge.
    final cx = source.width / 2.0;
    final cy = source.height / 2.0;
    final rx = source.width * 0.34;
    final ry = source.height * 0.47;
    for (var y = 0; y < source.height; y++) {
      for (var x = 0; x < source.width; x++) {
        final dx = (x - cx) / rx;
        final dy = (y - cy) / ry;
        final d = dx * dx + dy * dy;
        if (d <= 1.0) {
          bg.setPixel(x, y, source.getPixel(x, y));
        }
      }
    }
    setState(() => _resultBytes = Uint8List.fromList(img.encodeJpg(bg, quality: 92)));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;
    if (state == AppLifecycleState.inactive) {
      controller.dispose();
      _controller = null;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cameraReady = _controller?.value.isInitialized ?? false;
    return Scaffold(
      backgroundColor: const Color(0xfff6f5fb),
      appBar: AppBar(title: const Text('Camera Background Studio'), centerTitle: true),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 850),
            child: Column(
              children: [
                const Text('Open your device camera, allow permission, and capture a photo.', textAlign: TextAlign.center, style: TextStyle(fontSize: 18)),
                const SizedBox(height: 18),
                Card(
                  clipBehavior: Clip.antiAlias,
                  child: AspectRatio(
                    aspectRatio: 4 / 3,
                    child: _capturedBytes != null
                        ? Image.memory(_resultBytes ?? _capturedBytes!, fit: BoxFit.contain)
                        : cameraReady
                            ? CameraPreview(_controller!)
                            : Container(
                                color: Colors.black87,
                                alignment: Alignment.center,
                                child: const Icon(Icons.camera_alt_outlined, size: 84, color: Colors.white70),
                              ),
                  ),
                ),
                const SizedBox(height: 16),
                if (_error != null) Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
                ),
                if (_capturedBytes != null)
                  FilledButton.icon(onPressed: _retake, icon: const Icon(Icons.refresh), label: const Text('Retake Photo'))
                else if (!cameraReady)
                  FilledButton.icon(onPressed: _starting ? null : _openCamera, icon: const Icon(Icons.videocam), label: Text(_starting ? 'Opening Camera...' : 'Open Camera'))
                else
                  FilledButton.icon(onPressed: _takePhoto, icon: const Icon(Icons.camera), label: const Text('Capture Photo')),
                const SizedBox(height: 18),
                if (_capturedBytes != null) ...[
                  const Text('Choose Background', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: ['Original', 'White', 'Blue', 'Green', 'Studio'].map((name) =>
                      ChoiceChip(label: Text(name), selected: _background == name, onSelected: (_) => _applyBackground(name))
                    ).toList(),
                  ),
                  const SizedBox(height: 12),
                  const Text('Selecting a preset now changes the captured image. The current GitHub-only MVP uses a simple centered portrait mask; accurate automatic person segmentation is the next upgrade.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
