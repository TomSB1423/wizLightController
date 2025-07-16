export interface WizLight {
  id: string;
  ip: string;
  mac?: string;
  name?: string;
  state: boolean; // WiZ uses 'state' instead of 'isOn'
  dimming: number; // WiZ uses 'dimming' instead of 'brightness' (range: 10-100)
  temp?: number; // WiZ uses 'temp' for color temperature (range: 2200-6500K)
  r: number; // Red component (0-255)
  g: number; // Green component (0-255)
  b: number; // Blue component (0-255)
  c?: number; // Cool white component (0-255)
  w?: number; // Warm white component (0-255)
  sceneId?: number; // Scene/light mode ID (1-32)
  speed?: number; // Dynamic mode speed (20-200)
  ratio?: number; // Dual-zone ratio (0-100)
  rssi?: number; // WiFi signal strength
  lastSeen: Date;
  isConnected: boolean;
  
  // Computed properties for backwards compatibility
  get isOn(): boolean;
  get brightness(): number;
  get colorTemp(): number | undefined;
  get rgb(): { r: number; g: number; b: number };
}

// WiZ UDP Protocol Commands
export interface WizLightCommand {
  method: 'getPilot' | 'setPilot' | 'getSystemConfig' | 'syncPilot';
  params?: WizPilotParams;
}

// WiZ Pilot Parameters (for setPilot command)
export interface WizPilotParams {
  state?: boolean; // On/off state
  dimming?: number; // Brightness 10-100
  temp?: number; // Color temperature 2200-6500K
  r?: number; // Red 0-255
  g?: number; // Green 0-255
  b?: number; // Blue 0-255
  c?: number; // Cool white 0-255
  w?: number; // Warm white 0-255
  sceneId?: number; // Scene ID 1-32
  speed?: number; // Dynamic mode speed 20-200
  ratio?: number; // Dual-zone ratio 0-100
}

// WiZ Light Response from UDP
export interface WizLightResponse {
  method: string;
  env?: string;
  result?: WizPilotResult;
  error?: {
    code: number;
    message: string;
  };
}

// WiZ Pilot Result (from getPilot response)
export interface WizPilotResult {
  mac?: string;
  rssi?: number;
  src?: string;
  state?: boolean;
  sceneId?: number;
  temp?: number;
  dimming?: number;
  r?: number;
  g?: number;
  b?: number;
  c?: number;
  w?: number;
  speed?: number;
  ratio?: number;
  success?: boolean; // For setPilot command responses
}

// Discovery Server Response Types
export interface DiscoveryServerResponse {
  success: boolean;
  lights?: DiscoveredLightData[];
  error?: string;
}

export interface DiscoveredLightData {
  ip: string;
  mac: string;
  state: boolean;
  dimming: number;
  temp?: number;
  r?: number;
  g?: number;
  b?: number;
  c?: number;
  w?: number;
  sceneId?: number;
  speed?: number;
  ratio?: number;
  rssi?: number;
  lastSeen: string;
  
  // Legacy field mappings for compatibility
  isOn?: boolean;
  brightness?: number;
  colorTemp?: number;
  rgb?: { r: number; g: number; b: number };
}

export interface LightTestResponse {
  success: boolean;
  light?: DiscoveredLightData;
  error?: string;
}

export interface CommandResponse {
  success: boolean;
  response?: WizLightResponse; // Legacy field for backward compatibility
  commandResponse?: WizLightResponse; // New field for command response
  updatedLight?: DiscoveredLightData; // Updated light status after command
  statusFetchError?: string; // Error if status fetch failed
  error?: string;
}