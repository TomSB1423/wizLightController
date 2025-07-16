const express = require('express');
const cors = require('cors');
const dgram = require('dgram');
const os = require('os');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

// Test specific WiZ light
function testWizLight(ip) {
    return new Promise((resolve) => {
        const message = JSON.stringify({
            method: "getPilot",
            params: {}
        });

        const client = dgram.createSocket('udp4');

        // Set a timeout
        const timeout = setTimeout(() => {
            resolve({ success: false, error: 'Timeout' });
            client.close();
        }, 2000);

        client.on('message', (data, rinfo) => {
            try {
                const response = JSON.parse(data.toString());
                if (response.result) {
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
                    clearTimeout(timeout);
                    resolve({ success: true, light });
                } else {
                    clearTimeout(timeout);
                    resolve({ success: false, error: 'No result in response' });
                }
            } catch (error) {
                clearTimeout(timeout);
                resolve({ success: false, error: 'Invalid JSON response' });
            }
            client.close();
        });

        client.on('error', (error) => {
            clearTimeout(timeout);
            resolve({ success: false, error: error.message });
            client.close();
        });

        client.send(message, 38899, ip, (error) => {
            if (error) {
                resolve({ success: false, error: error.message });
                client.close();
            }
        });
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

// API Routes
app.get('/api/discover', async (req, res) => {
    try {
        console.log('Starting WiZ light discovery...');
        const lights = await discoverWizLights();
        res.json({ success: true, lights });
    } catch (error) {
        console.error('Discovery error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/test/:ip', async (req, res) => {
    try {
        const { ip } = req.params;
        console.log(`Testing WiZ light at ${ip}...`);
        const result = await testWizLight(ip);
        res.json(result);
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/command/:ip', async (req, res) => {
    try {
        const { ip } = req.params;
        const command = req.body;
        console.log(`API: Received command for ${ip}:`, command);

        // Send the command first
        const result = await sendCommandToLight(ip, command);
        console.log(`API: Command result for ${ip}:`, result);

        // If command was successful, get the updated light status
        if (result.success) {
            console.log(`Fetching updated status for ${ip} after command execution...`);
            const statusResult = await testWizLight(ip);

            if (statusResult.success && statusResult.light) {
                console.log(`Updated light status for ${ip}:`, statusResult.light);
                // Return both the command result and the updated light status
                res.json({
                    success: true,
                    commandResponse: result.response,
                    updatedLight: statusResult.light
                });
            } else {
                console.log(`Failed to get updated status for ${ip}:`, statusResult.error);
                // Still return success but note that status fetch failed
                res.json({
                    success: true,
                    commandResponse: result.response,
                    statusFetchError: statusResult.error
                });
            }
        } else {
            // Command failed, return the original error
            res.json(result);
        }
    } catch (error) {
        console.error('Command error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        server: 'WiZ Discovery Server',
        version: '1.0.0',
        localIP: getLocalIP()
    });
});

app.listen(PORT, () => {
    console.log(`WiZ Discovery Server running on http://localhost:${PORT}`);
    console.log(`Local IP: ${getLocalIP()}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/discover     - Discover all WiZ lights');
    console.log('  GET  /api/test/:ip     - Test specific light');
    console.log('  POST /api/command/:ip  - Send command to light');
    console.log('  GET  /api/status       - Server status');
});
