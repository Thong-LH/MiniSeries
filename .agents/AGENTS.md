# Project Custom Rules

- **Android APK Releases**: Always output or copy compiled standalone APK files to `D:\APK_MINI` instead of keeping them in the project workspace or root directory. Make sure to preserve the version number in the output filename (e.g., `MiniSeries-v1.0.0.apk`) by using wildcard copy commands (like `*.apk`) since the Expo build plugin automatically injects the active version name into the filename.
