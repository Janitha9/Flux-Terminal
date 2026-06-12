<div align="center">

<img src="icons/Flux.png" alt="Flux Terminal" width="120"/>

# Flux Terminal

**A modern, beautiful SSH & SFTP client built with Electron + React**

![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-orange?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)

[📦 Download Latest Release](../../releases/latest) · [🐛 Report Bug](../../issues) · [💡 Request Feature](../../issues)

</div>

---

## ✨ Features

- 🖥️ **SSH Terminal** — Full xterm.js terminal with multi-tab support
- 📁 **SFTP File Manager** — Browse, upload, download, rename & delete remote files
- ⚡ **Multi-Session** — Open multiple SSH sessions simultaneously in tabs
- 🎨 **Beautiful Themes** — Multiple dark themes (Midnight Ocean, Cyberpunk, Forest Night & more)
- 🔐 **Secure Backup** — Export/import sessions with optional AES-256 encryption (`.flx` format)
- 🔑 **PPK Key Support** — PuTTY private key authentication
- ⌨️ **SSH Keepalive** — Configurable keepalive to prevent disconnects
- 📊 **Transfer Progress** — Real-time speed, size & progress for uploads/downloads
- 🚫 **Cancel Transfers** — Cancel any in-progress upload or download
- 🪟 **Custom Title Bar** — Frameless window with custom minimize/maximize/close controls

---

## 📸 Screenshots

> _Coming soon_

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- Windows 10 / 11

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/flux-terminal.git
cd flux-terminal

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Build for Production

```bash
# Build portable folders (64-bit + 32-bit)
npm run build

# Build + create GitHub release zip files
npm run release:all
```

Output will be in the `release/` folder:
- `win-unpacked/` — 64-bit portable app
- `win-ia32-unpacked/` — 32-bit portable app

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Desktop Shell | Electron 33 |
| Terminal Engine | xterm.js |
| Styling | TailwindCSS |
| Icons | Lucide React |
| SSH/SFTP | PuTTY (plink, pscp, psftp) |
| Storage | electron-store |
| Bundler | Vite + vite-plugin-singlefile |

---

## 📁 Project Structure

```
flux-terminal/
├── electron/               # Electron main process
│   ├── main.js             # App entry, IPC handlers
│   ├── preload.js          # Secure bridge (contextBridge)
│   ├── putty-manager.js    # SSH terminal via plink
│   └── sftp-manager.js     # SFTP transfers via pscp/psftp
├── src/                    # React frontend
│   ├── App.jsx             # Main app component
│   ├── components/
│   │   ├── TitleBar.jsx         # Custom window title bar
│   │   ├── Sidebar.jsx          # Session list sidebar
│   │   ├── TerminalView.jsx     # xterm.js terminal
│   │   ├── FileManager.jsx      # SFTP file browser
│   │   ├── SettingsView.jsx     # App settings + backup
│   │   ├── ConnectionDialog.jsx # New session dialog
│   │   ├── SessionDetailsDialog.jsx
│   │   └── ThemeSelector.jsx    # Theme picker
│   ├── themes/index.js     # Theme definitions
│   └── index.css           # Global styles
├── bin/                    # PuTTY binaries (plink, pscp, psftp)
├── icons/                  # App icons
├── build/                  # Installer assets (BMP files)
├── index.html              # Vite entry point
├── vite.config.js
├── tailwind.config.js
├── electron-builder.config.js
└── make-release.js         # GitHub release zip script
```

---

## 🔧 Development

```bash
# Dev mode (hot reload)
npm run dev

# Build production app
npm run build

# Create GitHub release zips
npm run release:zip
```

---

## 📦 Dependencies

### Runtime (bundled with app)
- `electron-store` — Persistent storage for sessions & settings

### Frontend (compiled into single HTML by Vite)
- `react` + `react-dom` — UI framework
- `@xterm/xterm` + addons — Terminal emulator
- `lucide-react` — Icon library

### Dev Tools
- `electron` + `electron-builder` — App packaging
- `vite` + `vite-plugin-singlefile` — Frontend bundler
- `tailwindcss` — CSS framework
- `concurrently` — Run dev servers in parallel

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ❤️ using Electron + React
</div>
