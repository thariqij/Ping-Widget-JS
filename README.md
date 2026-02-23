# Ping Widget

A lightweight Electron desktop widget that monitors internet connectivity in real-time with visual latency indicators.

## Features

- 🎯 **Real-time Ping Monitoring** - Continuously monitors latency to www.google.com.br
- 🎨 **Color-Coded Status** - Visual feedback using OKLCH color space:
  - 🟢 Green (0-50ms) - Excellent connection
  - 🟡 Yellow (51-150ms) - Good connection
  - 🔴 Red (151ms+) - Poor connection
- 📍 **Draggable Widget** - Move the window anywhere on your screen
- 📊 **Real-time Tooltip** - Hover to see current ping latency
- 🪟 **Always On Top** - Stays visible above other windows
- 🔄 **Transparent Background** - Minimal visual footprint
- ⚡ **Fast & Lightweight** - Built with Electron and Node.js

## Installation

### Requirements
- Node.js (v12 or higher)
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/thariqij/Ping-Widget-JS.git
cd Ping-Widget-JS
```

2. Install dependencies:
```bash
npm install
```

3. Run the app:
```bash
npm start
```

## How It Works

The widget continuously pings a target host and maps the latency (in milliseconds) to a color gradient:

- **0-50ms**: Bright green - Excellent latency
- **51-150ms**: Yellow to orange - Acceptable latency  
- **151-300ms**: Orange to red - Poor latency
- **300ms+**: Dark red - Very poor connection
- **Timeout/Error**: Gray - Connection failed

Hover over the circle to see the exact ping time in milliseconds.

## Architecture

- **main.js** - Main Electron process, window management, OS-level mouse tracking
- **renderer.js** - UI logic, drag handling, ping result visualization
- **ping-service.js** - OS native ping command wrapper (cross-platform)
- **styles.css** - Widget styling and animations
- **index.html** - HTML structure

## Technical Highlights

- Uses OS native `ping` command via Node.js `child_process` (no admin required)
- Transparent Electron window with manual JavaScript-based dragging
- OKLCH color space for smooth perceptual color transitions
- IPC communication between main and renderer processes
- Hot reload support during development with electron-reload

## Platform Support

Currently optimized for **Windows**. Can be adapted for macOS and Linux.

## Future Enhancements

- Multi-target ping monitoring
- Historical latency graphs
- Custom ping targets
- Settings/preferences UI
- System tray integration

## License

MIT License - See LICENSE file for details

## Author

Thariq - [GitHub](https://github.com/thariqij)

## Contributing

Feel free to fork, submit issues, or create pull requests!