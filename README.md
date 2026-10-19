# Camera Background Studio v2

GitHub Pages Flutter Web app with:
- Device camera permission and live camera preview
- Capture / retake photo
- Background choices: Original, White, Blue, Green, Studio
- Actual client-side background compositing for selected presets

## Note
For a GitHub-only, no-backend MVP, this version uses a lightweight centered portrait mask when replacing the background. It visibly changes the captured photo, but it is not AI-grade person segmentation. A browser-compatible segmentation model is needed for accurate hair/body edge removal.
