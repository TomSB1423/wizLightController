const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dgram = require('dgram');
const os = require('os');

let mainWindow;

// Get local network IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return '127.0.0.1';
}

// Discover WiZ lights on the network
function discoverWizLights() {
    return new Promise((resolve) => {
        const discoveredLights = [];
        const localIP = getLocalIP();
        const networkBase = localIP.split('.').slice(0, 3).join('.');

        console.log(`Scanning network: ${networkBase}.0/24`);

        const message = JSON.stringify({
            method: "getPilot",
            params: {}
        });

        let completedScans = 0;
        const totalScans = 254;

        // Test each IP in the network range
        for (let i = 1; i <= 254; i++) {
            const targetIP = `${networkBase}.${i}`;

            const client = dgram.createSocket('udp4');

            client.on('message', (data, rinfo) => {
                try {
                    const response = JSON.parse(data.toString());
                    if (response.result) {
                        console.log(`Found WiZ light at ${rinfo.address}`);

                        const light = {
                            ip: rinfo.address,
                            mac: response.result.mac || '',
                            state: response.result.state || false,
                            dimming: response.result.dimming || 10,
                            temp: response.result.temp || null,
                            r: response.result.r || 0,
                            g: response.result.g || 0,
                            b: response.result.b || 0,
                            c: response.result.c || 0,
                            w: response.result.w || 0,
                            sceneId: response.result.sceneId || 0,
                            rssi: response.result.rssi || 0,
                            lastSeen: new Date().toISOString(),
                            // Legacy mappings for compatibility
                            isOn: response.result.state || false,
                            brightness: response.result.dimming || 10,
                            colorTemp: response.result.temp || null,
                            rgb: {
                                r: response.result.r || 0,
                                g: response.result.g || 0,
                                b: response.result.b || 0
                            }
                        };

                        // Avoid duplicates
                        if (!discoveredLights.find(l => l.ip === light.ip)) {
                            discoveredLights.push(light);
                        }
                    }
                } catch (error) {
                    // Ignore parsing errors
                }
                client.close();
            });

            client.on('error', () => {
                client.close();
            });

            // Set a timeout for each client
            const timeout = setTimeout(() => {
                client.close();
            }, 1000);

            client.on('close', () => {
                clearTimeout(timeout);
                completedScans++;
                if (completedScans >= totalScans) {
                    console.log(`Discovery complete. Found ${discoveredLights.length} lights`);
                    resolve(discoveredLights);
                }
            });

            client.send(message, 38899, targetIP, (error) => {
                if (error) {
                    client.close();
                }
            });
        }

        // Fallback timeout
        setTimeout(() => {
            console.log(`Discovery timeout. Found ${discoveredLights.length} lights`);
            resolve(discoveredLights);
        }, 10000);
    });
}

// Send command to WiZ light
function sendCommandToLight(ip, command) {
    return new Promise((resolve) => {
        const message = JSON.stringify(command);
        console.log(`Sending UDP message to ${ip}:38899 - ${message}`);

        const client = dgram.createSocket('udp4');

        // Set a timeout
        const timeout = setTimeout(() => {
            console.log(`Command timeout for ${ip} - no response received within 2 seconds`);
            resolve({ success: false, error: 'Timeout' });
            client.close();
        }, 2000);

        client.on('message', (data, rinfo) => {
            try {
                const response = JSON.parse(data.toString());
                console.log(`Received response from ${rinfo.address}:`, response);
                clearTimeout(timeout);
                resolve({ success: true, response });
            } catch (error) {
                console.log(`Invalid JSON response from ${rinfo.address}:`, data.toString());
                clearTimeout(timeout);
                resolve({ success: false, error: 'Invalid JSON response' });
            }
            client.close();
        });

        client.on('error', (error) => {
            console.log(`UDP client error for ${ip}:`, error.message);
            clearTimeout(timeout);
            resolve({ success: false, error: error.message });
            client.close();
        });

        client.send(message, 38899, ip, (error) => {
            if (error) {
                console.log(`Failed to send UDP message to ${ip}:`, error.message);
                resolve({ success: false, error: error.message });
                client.close();
            } else {
                console.log(`UDP message successfully sent to ${ip}:38899`);
            }
        });
    });
}

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'public/favicon.ico')
    });

    // Load the Angular app from the development server
    // The concurrently script will start Angular first
    mainWindow.loadURL('http://localhost:4200');

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// IPC handlers for WiZ light operations
ipcMain.handle('discover-lights', async () => {
    try {
        const lights = await discoverWizLights();
        return { success: true, lights };
    } catch (error) {
        console.error('Discovery error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('send-command', async (event, ip, command) => {
    try {
        const result = await sendCommandToLight(ip, command);
        return result;
    } catch (error) {
        console.error('Command error:', error);
        return { success: false, error: error.message };
    }
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
