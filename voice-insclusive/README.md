# VoxInclusiva 🎙️📱🌐

[![Expo SDK](https://img.shields.io/badge/Expo-SDK_58-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.78+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**VoxInclusiva** is a high-performance, cross-platform accessibility application built with **React Native** and **Expo SDK 58**. It provides on-device speech-to-text transcription, accessible text processing, inclusive communication tools (Sign Language & Digital Braille interfaces), and dynamic translation across **Android, iOS, and Web**.

The app addresses modern performance and privacy demands by running local machine learning models directly on the client device—utilizing native C++ JSI bindings on mobile and WebAssembly (WASM) on web environments.

---

## 📱 Application Interface & Features

| Grabar (Recorder) | Editor & Post-Processing | Inclusión (Accessibility) | Traducir (Translation) |
| :---: | :---: | :---: | :---: |
| <img src="assets/images/pantalla%20grabar.png" width="220" alt="Pantalla Grabar"/> | <img src="assets/images/pantalla%20editor.png" width="220" alt="Pantalla Editor"/> | <img src="assets/images/pantalla%20inclusion.png" width="220" alt="Pantalla Inclusión"/> | <img src="assets/images/pantalla%20traducir.png" width="220" alt="Pantalla Traducir"/> |

### Core Modules

1. **Grabar (Speech-to-Text Engine)**
   * Real-time audio recording with mode selection (*Reunión*, *Conversación*, *Nota personal*, *Conferencia*).
   * Local offline audio file processing up to 150 MB.
   * Persistent session storage using localized storage wrappers.

2. **Editor (Processing & Export)**
   * Real-time word count and text refinement.
   * One-touch formatting, punctuation enhancement, and system clipboard operations.
   * Cross-platform export (`.txt`) and native OS share target integration.

3. **Inclusión (Accessibility Tools)**
   * Conversion pipelines for **Lengua de señas** (Sign Language translation interfaces).
   * **Braille digital** translation for tactile and assistive reading devices.

4. **Traducir (On-Device Translation)**
   * Instant cross-lingual conversion supporting English, French, Portuguese, Catalan, Spanish, and more.
   * Zero-latency processing executed directly on-device.

---

## 🏗️ Technical Architecture & Highlights

VoxInclusiva utilizes a clean platform-agnostic architecture written in strict **TypeScript** and modular Expo architecture.

```
                  ┌──────────────────────────────┐
                  │   Platform Engine Dispatcher │
                  │      (src/lib/whisper.ts)    │
                  └──────────────┬───────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌───────────────────────────┐             ┌───────────────────────────┐
│     Native Mobile Engine    │             │        Web Engine         │
│  (whisper.native.ts)      │             │    (whisper.web.ts)       │
├───────────────────────────┤             ├───────────────────────────┤
│ • C++ JSI Bindings        │             │ • WebAssembly (WASM)      │
│ • Local ggml-base.bin     │             │ • HuggingFace Transformers│
└───────────────────────────┘             └───────────────────────────┘
```

### Key Technical Implementations

* **Platform-Specific Dynamic Dispatching (`.native.ts` vs `.web.ts`)**: To avoid web runtime crashes caused by native binary references, execution pipelines are split at build time using Metro bundler extension resolution.
* **C++ JSI Bindings for Mobile**: Uses `whisper.rn` over C++ JavaScript Interface (JSI) to bypass standard React Native bridge bottlenecks during heavy ML inference.
* **Modern Expo Storage Abstraction**: File operations (`io.ts`) utilize `expo-file-system/legacy` wrappers to ensure compatibility across Expo SDK 58 and traditional mobile storage access APIs.
* **Resilient Audio Permissions (`perm.ts`)**: Dynamically queries and requests native audio permissions (`RECORD_AUDIO`, `NSMicrophoneUsageDescription`) gracefully without blocking the UI main thread.

---

## 🤖 AI Model Configuration

Native execution requires a GGML binary model built for `whisper.cpp`.

1. Download `ggml-base.bin` (or `ggml-tiny.bin`) directly from the official repository:
   👉 **[ggerganov/whisper.cpp on Hugging Face](https://huggingface.co/ggerganov/whisper.cpp/tree/main)**
2. Save the `.bin` file in your local root assets directory:
   ```path
   assets/ggml-base.bin
   ```
*(Note: Binary `.bin` files are excluded from Git tracking via `.gitignore` to maintain repository lightweight boundaries).*

---

## ⚙️ Development & Local Setup

### Prerequisites
* **Node.js**: `v18+`
* **Package Manager**: `pnpm` (recommended)
* **Mobile Toolchains**: Android Studio (for Android SDKs) or Xcode (for iOS on macOS)

### 1. Installation

```bash
git clone https://github.com/reikem/voice-insclusive.git
cd voice-insclusive
pnpm install
```

### 2. Running Web

```bash
pnpm web
```

### 3. Native Builds (Android & iOS)

Because native C++ JSI dependencies are used, **Expo Go is not supported**. You must generate a Development Build:

* **Android**:
  ```bash
  npx expo prebuild --clean
  npx expo run:android
  ```

* **iOS** (macOS required):
  ```bash
  npx expo prebuild --clean
  cd ios && pod install && cd ..
  npx expo run:ios
  ```

---

## 📂 Project Structure

```
voice-insclusive/
├── assets/
│   └── images/              # Application screenshots & branding
├── src/
│   ├── app/                 # Expo Router file-based routing stack
│   └── components/
│       ├── lib/
│       │   ├── io.ts        # Storage abstraction & file exporter
│       │   ├── perm.ts      # Hardware & dynamic permissions guard
│       │   ├── whisper.ts   # Platform abstract entry point
│       │   ├── whisper.native.ts # Native JSI Whisper integration
│       │   └── whisper.web.ts    # WebAssembly Transformers pipeline
│       └── screens.tsx      # Core modular application UI screens
├── app.json                 # Native Expo SDK configuration & plugin definitions
└── package.json
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/reikem/voice-insclusive/issues).

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.