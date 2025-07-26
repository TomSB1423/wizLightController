# 🔆 WiZ Light Controller

A modern desktop application for discovering and controlling WiZ smart lights on your local network. Built with Angular 18 and Electron for seamless UDP networking.

![WiZ Light Controller](https://img.shields.io/badge/Angular-18-red?style=flat-square&logo=angular)
![Electron](https://img.shields.io/badge/Electron-32-blue?style=flat-square&logo=electron)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)

## 📸 Screenshots

![WiZ Light Controller App](demos/app.png)

## ✨ Features

- 🔍 **Auto-Discovery**: Automatically discover WiZ lights on your network (works even when lights are turned off)
- 💡 **Complete Light Control**: Power, brightness, RGB colors, and color temperature
- 🎨 **Color Tools**: HTML5 color picker and random color generator
- ✏️ **Custom Names**: Editable light names with persistent storage
- 🌙 **Modern Dark UI**: Clean, minimal interface with smooth animations
- 🖥️ **Native Desktop App**: Cross-platform Electron application with direct UDP networking
- ⚡ **Real-time Updates**: Live status monitoring and responsive controls

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or later)
- **npm** (v9 or later)
- **WiZ lights** connected to the same network

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/TomSB1423/wizLightController.git
cd wizLightController
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the application**

```bash
npm run electron-dev
```

### Production Build

```bash
# Build for production
npm run build

# Create executable
npm run pack

# Create installer
npm run dist
```

## 📖 Usage

1. Launch the application
2. Click "Discover Lights" to find WiZ lights on your network
3. Control your lights using the intuitive interface:
   - Toggle power with the switch
   - Adjust brightness with the slider
   - Change colors using RGB sliders or color picker
   - Randomize colors with one click
   - Edit light names by clicking on the title

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/wizLightController.git
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

- **Code Style**: Follow existing TypeScript and Angular conventions
- **Commits**: Use clear, descriptive commit messages
- **Testing**: Test your changes thoroughly with actual WiZ lights
- **Documentation**: Update documentation for new features

### Submitting Changes

1. **Commit your changes**:
   ```bash
   git commit -am 'Add: brief description of your feature'
   ```
2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Create a Pull Request** on GitHub with:
   - Clear description of changes
   - Screenshots/videos for UI changes
   - Testing information

### Areas for Contribution

- 🐛 **Bug Fixes**: Report and fix issues
- ✨ **New Features**: Light scheduling, scenes, groups
- 🎨 **UI/UX**: Design improvements and accessibility
- 📚 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Add automated tests
- 🌍 **Localization**: Multi-language support

## 🐛 Troubleshooting

**No lights found?**

- Ensure lights are on the same network
- Check firewall settings for UDP port 38899
- Verify lights are powered (they can be discovered when off)

**App won't start?**

- Update Node.js and npm to latest versions
- Try `npm install` again
- Check for port conflicts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WiZ Connected](https://www.wizconnected.com/) for the smart light protocol
- [Angular Team](https://angular.io/) for the excellent framework
- [Electron](https://electronjs.org/) for cross-platform desktop development

---

**Made with ❤️ for smart home enthusiasts**
