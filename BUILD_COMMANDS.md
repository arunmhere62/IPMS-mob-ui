# Build & Development Commands

Complete reference for all npm scripts available in the PG Management mobile app.

---

## Table of Contents

1. [Development Commands](#development-commands)
2. [Build Commands](#build-commands)
3. [Cleanup Commands](#cleanup-commands)
4. [Utility Commands](#utility-commands)
5. [Command Workflows](#command-workflows)

---

## Development Commands

### Start Development Server

```bash
npm start
# or
npm run start
```
- Starts Expo Metro bundler
- Opens in Expo Go app
- For quick testing without native builds

### Start Dev Client

```bash
npm run start:dev
```
- Starts Metro bundler for Expo Dev Client
- Use with development builds (built with `build:dev`)
- Enables hot reload and debugging
- **Requires:** Development build APK installed on device

### Run on Android (Local)

```bash
npm run android
```
- Builds and runs app on connected Android device/emulator
- Uses local Gradle build
- Automatically runs typecheck before building

### Run on iOS (Local)

```bash
npm run ios
```
- Builds and runs app on iOS simulator
- Uses local Xcode build
- Automatically runs typecheck before building

### Start Web Version

```bash
npm run web
```
- Starts web version of the app
- Opens in browser at http://localhost:19006

---

## Build Commands

### Development Build (EAS)

```bash
npm run build:dev
```

**Profile:** `development`

**Features:**
- ✅ Expo Dev Client included (launcher screen)
- ✅ Hot reload enabled
- ✅ Debugging tools available
- ✅ Requires dev server to run

**Output:**
- APK file (~80MB)
- Opens to Expo launcher screen
- Connect to dev server to load app

**Use case:** Active development with frequent code changes

**EAS Command:**
```bash
eas build -p android --profile development
```

---

### Standalone Production Build

```bash
npm run build:standalone
```

**Profile:** `standalone-apk`

**Features:**
- ❌ No Expo Dev Client (opens directly to app)
- ✅ Optimized and minified
- ✅ Works without dev server
- ✅ Production-ready

**Output:**
- APK file (~30-40MB)
- Opens directly to PG Management app
- Standalone, no dependencies

**Use case:** Testing production build, distributing to testers

**EAS Command:**
```bash
eas build -p android --profile standalone-apk
```

---

### Minimal Production Build

```bash
npm run build:minimal
```

**Profile:** `minimal-apk`

**Features:**
- ❌ No Expo Dev Client
- ✅ Minimal size optimization
- ✅ Production configuration

**Output:**
- APK file (~30-40MB)
- Direct app launch
- Optimized for size

**Use case:** Size-constrained distribution

**EAS Command:**
```bash
eas build -p android --profile minimal-apk
```

---

### Production APK Build

```bash
npm run build:apk
```

**Profile:** `apk`

**Features:**
- ❌ No Expo Dev Client
- ✅ Full optimization (R8, resource shrinking)
- ✅ Production credentials
- ✅ Signed APK

**Output:**
- APK file (~30-40MB)
- Fully optimized
- Ready for distribution

**Use case:** Final production APK for sideloading

**EAS Command:**
```bash
eas build -p android --profile apk
```

---

### Production AAB Build (Google Play)

```bash
npm run build:aab
```

**Profile:** `production`

**Features:**
- ❌ No Expo Dev Client
- ✅ Android App Bundle format
- ✅ Maximum optimization
- ✅ Auto-incremented version
- ✅ Signed with production keystore

**Output:**
- AAB file (~20-30MB)
- Google Play optimized
- Smallest download size for users

**Use case:** Publishing to Google Play Store

**EAS Command:**
```bash
eas build -p android --profile production
```

---

### Local Clean Build

```bash
npm run build:clean
```

**Features:**
- Cleans build artifacts first
- Runs local Gradle build
- Creates release APK locally

**Steps:**
1. Runs `npm run clean`
2. Executes `gradlew assembleRelease`

**Output:**
- APK at `android/app/build/outputs/apk/release/app-release.apk`

**Use case:** Quick local release build for testing

---

## Cleanup Commands

### Basic Clean

```bash
npm run clean
```

**Removes:**
- `android/app/.cxx` (C++ build artifacts)
- `android/app/build` (App build output)
- `android/build` (Project build output)
- `node_modules/.cache` (Metro cache)

**Size freed:** ~500MB - 1GB

**Use case:** 
- Before new builds
- After switching branches
- Build errors

**Safe:** Yes, doesn't affect source code

---

### Deep Clean

```bash
npm run clean:deep
```

**Removes:**
- Everything from `clean`
- `android/.gradle` (Gradle cache)
- `.expo` (Expo cache)

**Size freed:** ~1-2GB

**Use case:**
- Persistent build errors
- Gradle cache corruption
- Switching Expo SDK versions

**Safe:** Yes, caches will regenerate

---

### Full Clean

```bash
npm run clean:all
```

**Removes:**
- Everything from `clean:deep`
- `node_modules` (All dependencies)

**Size freed:** ~2-3GB

**Use case:**
- Complete reset
- Dependency conflicts
- Major version upgrades

**⚠️ Requires:** Run `npm install` after this command

---

## Utility Commands

### Type Check

```bash
npm run typecheck
```
- Runs TypeScript compiler in check mode
- No output files generated
- Reports type errors

### Type Check (Watch Mode)

```bash
npm run typecheck:watch
```
- Continuous type checking
- Watches for file changes
- Real-time error reporting

### Lint

```bash
npm run lint
```
- Runs TypeScript type check
- Runs ESLint on `.ts` and `.tsx` files
- Reports code quality issues

---

## Command Workflows

### Starting Fresh Development

```bash
# 1. Clean everything
npm run clean:deep

# 2. Install dependencies (if needed)
npm install

# 3. Start dev server
npm run start:dev
```

### Building for Testing

```bash
# 1. Clean build artifacts
npm run clean

# 2. Build standalone APK
npm run build:standalone

# 3. Wait for build to complete (~10-15 min)
# 4. Download APK from EAS
# 5. Install on device
```

### Fixing Build Issues

```bash
# 1. Deep clean
npm run clean:deep

# 2. Rebuild with cache cleared
eas build -p android --profile standalone-apk --clear-cache
```

### Complete Reset

```bash
# 1. Full clean
npm run clean:all

# 2. Reinstall dependencies
npm install

# 3. Rebuild
npm run build:standalone
```

### Local Development Cycle

```bash
# 1. Make code changes
# 2. Type check
npm run typecheck

# 3. Test locally
npm run start:dev

# 4. Build for device testing
npm run build:dev
```

### Production Release Workflow

```bash
# 1. Clean
npm run clean

# 2. Type check
npm run typecheck

# 3. Lint
npm run lint

# 4. Build AAB for Play Store
npm run build:aab

# 5. Submit to Play Store
eas submit -p android --latest
```

---

## Build Profile Comparison

| Command | Profile | Dev Client | Size | Build Time | Use Case |
|---------|---------|------------|------|------------|----------|
| `build:dev` | development | ✅ Yes | ~80MB | 10-15 min | Active development |
| `build:standalone` | standalone-apk | ❌ No | ~30-40MB | 10-15 min | Testing production |
| `build:minimal` | minimal-apk | ❌ No | ~30-40MB | 10-15 min | Size-optimized testing |
| `build:apk` | apk | ❌ No | ~30-40MB | 10-15 min | Production APK |
| `build:aab` | production | ❌ No | ~20-30MB | 15-20 min | Google Play Store |
| `build:clean` | local | ❌ No | ~40-50MB | 5-10 min | Local quick build |

---

## Environment Variables

Commands respect these environment variables from `eas.json`:

### Development Profile
```json
{
  "NODE_ENV": "development",
  "EXPO_USE_COMMUNITY_AUTOLINKING": "1"
}
```

### Production Profiles
```json
{
  "NODE_ENV": "production",
  "EXPO_USE_COMMUNITY_AUTOLINKING": "1",
  "EXPO_OPTIMIZE_SIZE": "1",
  "EXPO_NO_DEV": "1"
}
```

---

## Build Optimization Settings

All builds use these optimizations (from `android/gradle.properties`):

```properties
# Only arm64-v8a architecture (saves ~60% size)
reactNativeArchitectures=arm64-v8a

# Disable unnecessary formats
expo.gif.enabled=false
expo.webp.enabled=false

# Enable R8 minification
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true

# Hermes JS engine
hermesEnabled=true

# New Architecture
newArchEnabled=true
```

---

## Troubleshooting Commands

### Build Fails

```bash
# Try deep clean + clear cache
npm run clean:deep
eas build -p android --profile standalone-apk --clear-cache
```

### Metro Bundler Issues

```bash
# Clear Metro cache
npm run clean
npm run start:dev -- --clear
```

### Gradle Issues

```bash
# Clean Gradle cache
npm run clean:deep

# Or manually:
cd android
./gradlew clean
cd ..
```

### Dependency Issues

```bash
# Full reset
npm run clean:all
npm install
```

---

## Quick Reference

### Most Common Commands

```bash
# Development
npm run start:dev              # Start dev server
npm run build:dev              # Build dev client

# Production
npm run build:standalone       # Build standalone APK
npm run build:aab              # Build for Play Store

# Cleanup
npm run clean                  # Quick clean
npm run clean:deep             # Deep clean
```

### Build + Install Workflow

```bash
# 1. Build
npm run build:standalone

# 2. Download APK from EAS build page

# 3. Install on device
adb install path/to/app.apk

# Or drag-drop APK to device
```

---

## Additional Resources

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Expo CLI Docs:** https://docs.expo.dev/workflow/expo-cli/
- **Android Build Docs:** https://docs.expo.dev/build-reference/android-builds/

---

**Last Updated:** December 30, 2025  
**Package Version:** 1.0.0  
**Expo SDK:** 54.0.30
