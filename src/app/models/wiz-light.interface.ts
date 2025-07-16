export interface WizLight {
  id: string;
  ip: string;
  mac?: string;
  name?: string;
  isOn: boolean;
  brightness: number;
  colorTemp?: number;
  rgb?: {
    r: number;
    g: number;
    b: number;
  };
  lastSeen: Date;
  isConnected: boolean;
}

export interface WizLightCommand {
  method: string;
  params: {
    [key: string]: any;
  };
}

export interface WizLightResponse {
  method: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface LightDiscoveryResult {
  ip: string;
  mac: string;
  success: boolean;
}