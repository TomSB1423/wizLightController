# 🔆 WiZ Light Controller

A modern web application for discovering and controlling WiZ smart lights on your local network. Built with Angular 18 and a Node.js discovery server.

![WiZ Light Controller](https://img.shields.io/badge/Angular-18-red?style=flat-square&logo=angular)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)

## ✨ Features

- 🔍 **Auto-Discovery**: Automatically discover WiZ lights on your network (works even when lights are turned off)
- 💡 **Light Control**: Power on/off, brightness adjustment, RGB color control
- 🎨 **Color Picker**: HTML5 color picker with live preview
- 🎲 **Randomize**: Generate random colors with one click
- ✏️ **Custom Names**: Click to edit light names with localStorage persistence
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Updates**: Live status updates and smooth animations
- 🚀 **Debounced Controls**: Optimized performance during manual adjustments

## 🛠️ Technology Stack

### Frontend

- **Angular 18** - Modern web framework with standalone components
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming for real-time updates
- **CSS3** - Modern styling with animations and transitions

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web server framework
- **UDP Broadcasting** - WiZ light discovery protocol
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- **Node.js** (v18 or later)
- **npm** (v9 or later)
- **WiZ lights** connected to the same network as your computer

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/wizLightController.git
cd wizLightController
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd discovery-server
npm install
cd ..
```

## 🏃‍♂️ Running the Application

### Method 1: Start Both Services Manually

1. **Start the Discovery Server** (Terminal 1):

```bash
cd discovery-server
npm start
```

The server will start on `http://localhost:3001`

1. **Start the Angular App** (Terminal 2):

```bash
npm start
```

The app will start on `http://localhost:4200`

### Method 2: Development Scripts

You can also use the npm scripts defined in package.json:

```bash
# Start the Angular development server
npm run start

# Build the project for production
npm run build

# Watch for changes during development
npm run watch
```

## 📖 Usage

### 1. Discover Lights

- Open your browser to `http://localhost:4200`
- Click the "Discover Lights" button
- The app will automatically find WiZ lights on your network

### 2. Control Your Lights

- **Power**: Toggle lights on/off with the switch
- **Brightness**: Use the slider (0-100%)
- **RGB Colors**: Adjust individual R, G, B sliders (0-255)
- **Color Picker**: Click the color square to open a color picker
- **Randomize**: Click "🎨 Randomize" for random colors

### 3. Customize Light Names

- Click on any light title to edit its name
- Press **Enter** to save or **Escape** to cancel
- Names are automatically saved and persist across sessions

## 🔧 Configuration

### Discovery Server Settings

The discovery server can be configured in `discovery-server/server.js`:

```javascript
const PORT = 3001; // Server port
const WIZ_PORT = 38899; // WiZ UDP port
const BROADCAST_TIMEOUT = 3000; // Discovery timeout
```

### Frontend Settings

API endpoint configuration in `src/app/services/wiz-light.service.ts`:

```typescript
private readonly discoveryServerUrl = 'http://localhost:3001/api';
```

## 📁 Project Structure

```
wizLightController/
├── src/                          # Angular frontend
│   ├── app/
│   │   ├── components/           # UI components
│   │   │   └── light-card.component.ts
│   │   ├── models/               # TypeScript interfaces
│   │   │   └── wiz-light.interface.ts
│   │   ├── services/             # Business logic
│   │   │   └── wiz-light.service.ts
│   │   ├── app.component.ts      # Main app component
│   │   └── app.config.ts         # App configuration
│   ├── index.html                # Main HTML file
│   └── styles.css                # Global styles
├── discovery-server/             # Node.js backend
│   ├── server.js                 # Express server
│   └── package.json              # Server dependencies
├── package.json                  # Frontend dependencies
└── README.md                     # Documentation
```

## 🎨 Features in Detail

### Smart Discovery

- UDP broadcast to find WiZ lights automatically
- Real-time connection status monitoring
- Automatic retry and error handling

### Intuitive Controls

- Smooth CSS animations and transitions
- Debounced input for optimal performance
- Visual feedback for all interactions

### Persistent Storage

- Light names saved in localStorage
- Settings persist across browser sessions
- Graceful fallback for storage errors

## 🐛 Troubleshooting

### No Lights Found

1. Ensure WiZ lights are powered on and connected to WiFi (note: lights can be discovered even when turned off)
2. Verify your computer is on the same network as the lights
3. Check that port 38899 (UDP) is not blocked by firewall
4. Try clicking "Discover Lights" again

### Connection Issues

1. Restart the discovery server: `cd discovery-server && npm start`
2. Clear browser cache and refresh the page
3. Check browser console for error messages

### Performance Issues

1. Close other browser tabs consuming resources
2. Ensure Node.js and npm are up to date
3. Try restarting both the server and Angular app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WiZ Connected](https://www.wizconnected.com/) for the smart light protocol
- [Angular Team](https://angular.io/) for the excellent framework
- [Express.js](https://expressjs.com/) for the web server framework

---

**Made with ❤️ for smart home enthusiasts**
