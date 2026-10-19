# Flutter Background Studio - GitHub Only

You do NOT need Flutter installed locally.

## Upload and deploy entirely in GitHub
1. Create a new empty GitHub repository.
2. Extract the ZIP on your computer.
3. In the repository, use **Add file > Upload files** and upload the extracted project contents, including `.github/workflows/deploy.yml`.
4. Commit directly to the `main` branch.
5. Open **Settings > Pages** and choose **GitHub Actions** as the Pages source.
6. Open **Actions**. The included workflow installs Flutter on the GitHub runner, runs `flutter pub get`, builds the web app, and deploys `build/web` to GitHub Pages.

After initial setup, every push to `main` triggers deployment.

## MVP features
- Device/browser photo capture through `image_picker`
- Photo upload and preview
- Background category selection
- Custom background text field
- Responsive Flutter Web interface

## Important limitation
Automatic person-background removal and prompt-based AI background generation are not faked in this starter. Those require either a browser-compatible ML implementation or a securely hosted AI API. Do not put private API keys in Flutter Web source code or a public GitHub repository.
"# Camera" 
"# Camera" 
