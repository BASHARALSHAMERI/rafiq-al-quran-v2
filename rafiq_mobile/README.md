# Rafiq Mobile

Flutter mobile app for Rafiq Al-Quran (authentication, context selection, attendance, and daily follow-up).

## Requirements

- Flutter `3.35.x` (Dart `3.9.x`)
- Android Studio / Xcode (for device builds)

## Quick Start

```bash
flutter pub get
flutter analyze
flutter test
```

Run development flavor against local backend:

```bash
flutter run --flavor dev --dart-define=APP_FLAVOR=dev --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

Run production flavor:

```bash
flutter run --flavor prod --dart-define=APP_FLAVOR=prod --dart-define=API_BASE_URL=https://api.example.com
```

## Android Release Signing

Create `android/keystore.properties`:

```properties
storeFile=../keystore/upload-keystore.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=upload
keyPassword=YOUR_KEY_PASSWORD
```

If this file is missing, release builds fall back to debug signing (for local testing only).

## Current Scope

- Login with token refresh
- Center/Circle context selection
- Attendance marking with offline queue and automatic retry when network returns
- Role-based home navigation

## CI

Mobile checks run in `.github/workflows/ci.yml`:

- `flutter analyze`
- `flutter test`
