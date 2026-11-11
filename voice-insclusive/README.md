# VoxInclusiva 🎙️📱🌐

**VoxInclusiva** is a cross-platform application built with React Native and Expo SDK, designed to provide seamless speech-to-text transcription, translation, and audio management across **Android, iOS, and Web**.

Powered by **Whisper.rn** for native high-performance device inference and Web Assembly (WASM) fallback for the browser, VoxInclusiva bridges the gap between desktop-grade AI speech recognition and mobile accessibility.

## 🚀 Key Features

* **Multi-Platform Support**: Fully optimized for Android, iOS, and Web.

* **On-Device Speech Recognition**:

  * Uses `whisper.rn` with C++ JSI bindings on Android & iOS.

  * Uses `@huggingface/transformers` (WASM/Whisper-tiny) on Web.

* **Robust Audio & File Permissions**: Graceful handling of microphone permissions and file system access across all operating systems.

* **Legacy File System Integration**: Fully adapted for modern Expo SDK 58 file system patterns.

* **History & Sharing**: Local session history storage and native file export/sharing capabilities.

## 🤖 Language Model Setup

For native mobile devices (Android & iOS), the app relies on GGML binary models provided by `whisper.cpp`.

* **Model Source**: Download models directly from the [ggerganov/whisper.cpp Hugging Face Repository](https://huggingface.co/ggerganov/whisper.cpp/tree/main).
* **Required File**: Download `ggml-base.bin` (or `ggml-tiny.bin` for lower memory usage) and place it in the root directory of the project before running native builds.

## 🛠️ Tech Stack

* **Framework**: [Expo SDK 58](https://expo.dev/) (Managed & Native Development Builds)

* **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)

* **Core Libraries**:

  * `expo-av` (Audio recording and playback)

  * `expo-file-system` (Legacy compatibility storage)

  * `whisper.rn` (High-performance native JSI Whisper bindings)

  * `react-native-reanimated` & `react-native-gesture-handler`

## ⚙️ Prerequisites & Setup

Ensure you have the following installed on your development machine:

* Node.js (LTS recommended)

* `pnpm` (Package Manager)

* Expo CLI (`npm install -g expo-cli`)

* Android Studio (for Android builds) or Xcode (for iOS builds on macOS)

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/voice-insclusive.git
cd voice-insclusive
pnpm install
```

### 2. Download Language Model

Download `ggml-base.bin` from [Hugging Face](https://huggingface.co/ggerganov/whisper.cpp/tree/main) and save it to the root of your project folder.

### 3. Configure Native Permissions (`app.json`)

The application requires explicit permissions declared in `app.json` for microphone recording and file storage:

* **Android**: `RECORD_AUDIO`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`

* **iOS**: `NSMicrophoneUsageDescription`

## 🏃 Running the Project

Because this project utilizes custom C++ native modules (`whisper.rn`), **it cannot run inside standard Expo Go**. You must use a **Development Build**.

### For Web

```bash
pnpm web
```

### For Android (Development Build)

```bash
npx expo prebuild --clean
npx expo run:android
```

### For iOS (Development Build - macOS required)

```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
npx expo run:ios
```

## 📁 Project Structure

```
├── ggml-base.bin         # Whisper GGML language model (downloaded from Hugging Face)
src/
├── app/                  # Expo Router file-based screens and layout (_layout.tsx, index.tsx)
├── components/
│   ├── lib/
│   │   ├── io.ts         # Cross-platform file system operations & history management
│   │   ├── perm.ts       # Secure microphone permission handlers
│   │   ├── whisper.ts    # Platform entry point (web vs native dispatcher)
│   │   ├── whisper.native.ts # Native Whisper JSI implementation
│   │   └── whisper.web.ts    # Web Transformers/WASM Whisper implementation
│   └── screens.tsx       # Main UI screens (Recorder, Editor, Translation)
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check issues page or submit a pull request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).