# Timbuk Synthesizer Assets

This directory contains icons and assets for the Timbuk Analog Modelling Synthesizer.

## Icons

- `icon.png` - Main application icon (512x512 PNG)
- `icon.ico` - Windows icon file
- `icon.icns` - macOS icon file

## Audio Files

The synthesizer generates all audio programmatically using Tone.js, no external audio files are needed.

## Images

All visual elements are created with CSS and canvas, no external image files are required.

## File Structure

```
assets/
├── README.md
├── icon.png
├── icon.ico
└── icon.icns
```

## Usage

Icons are automatically used by Electron Builder during the packaging process for Windows and Mac applications.