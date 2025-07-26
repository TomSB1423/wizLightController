import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { 
  WizLight, 
  WizLightCommand, 
  WizLightResponse, 
  DiscoveryServerResponse,
  LightTestResponse,
  CommandResponse,
  DiscoveredLightData,
  WizPilotParams
} from '../models/wiz-light.interface';
import { LightControlService } from './light-control.interface';

// WizLight implementation class
class WizLightImpl implements WizLight {
  public r: number;
  public g: number;
  public b: number;

  constructor(
    public id: string,
    public ip: string,
    public state: boolean,
    public dimming: number,
    public lastSeen: Date,
    public isConnected: boolean,
    public mac?: string,
    public name?: string,
    public temp?: number,
    r?: number,
    g?: number,
    b?: number,
    public c?: number,
    public w?: number,
    public sceneId?: number,
    public speed?: number,
    public ratio?: number,
    public rssi?: number
  ) {
    // Ensure RGB values are always defined
    this.r = r ?? 0;
    this.g = g ?? 0;
    this.b = b ?? 0;
  }

  get isOn(): boolean {
    return this.state;
  }

  get brightness(): number {
    return this.dimming;
  }

  get colorTemp(): number | undefined {
    return this.temp;
  }

  get rgb(): { r: number; g: number; b: number } {
    return { r: this.r, g: this.g, b: this.b };
  }

  // Update methods for mutable properties
  updateState(state: boolean) {
    this.state = state;
    this.lastSeen = new Date();
  }

  updateDimming(dimming: number) {
    this.dimming = Math.max(1, Math.min(100, dimming));
    this.lastSeen = new Date();
  }

  updateTemp(temp: number) {
    this.temp = Math.max(2200, Math.min(6500, temp));
    this.r = this.g = this.b = 0; // Clear RGB when using temp
    this.lastSeen = new Date();
  }

  updateRGB(r: number, g: number, b: number) {
    this.r = Math.max(0, Math.min(255, r));
    this.g = Math.max(0, Math.min(255, g));
    this.b = Math.max(0, Math.min(255, b));
    this.temp = undefined; // Clear temp
    this.lastSeen = new Date();
  }

  updateConnectionStatus(connected: boolean) {
    this.isConnected = connected;
    if (connected) {
      this.lastSeen = new Date();
    }
  }
}

// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: {
      discoverLights: () => Promise<DiscoveryServerResponse>;
      sendCommand: (ip: string, command: any) => Promise<CommandResponse>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class WizLightElectronService implements LightControlService {
  private lightsSubject = new BehaviorSubject<WizLight[]>([]);
  public lights$ = this.lightsSubject.asObservable();
  
  private discoveredLights: Map<string, WizLight> = new Map();
  private readonly LIGHT_NAMES_STORAGE_KEY = 'wizLightController_lightNames';
  private isElectron = false;
  
  constructor() {
    // Check if running in Electron
    this.isElectron = !!(window && window.electronAPI);
    
    if (!this.isElectron) {
      console.warn('Not running in Electron environment - WiZ light functionality will be limited');
      return;
    }
    
    // Start with real discovery
    this.discoverLights().subscribe();
    
    // Set up periodic status updates
    interval(30000).subscribe(() => {
      this.updateLightStatuses();
    });
  }

  discoverLights(): Observable<WizLight[]> {
    if (!this.isElectron || !window.electronAPI) {
      console.error('Electron API not available');
      return of([]);
    }

    console.log('Discovering WiZ lights via Electron...');
    
    return new Observable(observer => {
      window.electronAPI!.discoverLights()
        .then(response => {
          if (response.success && response.lights) {
            // Load stored custom names
            const storedNames = this.loadStoredLightNames();
            
            const lights = response.lights.map((lightData) => {
              const lightId = lightData.mac || lightData.ip;
              const storedName = storedNames[lightId];
              const lightName = storedName || this.generateLightName(lightData.ip);
              
              return new WizLightImpl(
                lightId, // Use MAC as ID, fallback to IP
                lightData.ip,
                lightData.state,
                lightData.dimming,
                new Date(lightData.lastSeen),
                true, // isConnected
                lightData.mac,
                lightName, // Use stored name if available
                lightData.temp,
                lightData.r,
                lightData.g,
                lightData.b,
                lightData.c,
                lightData.w,
                lightData.sceneId,
                undefined, // speed
                undefined, // ratio
                lightData.rssi
              );
            });

            console.log(`Discovered ${lights.length} lights`);
            
            // Clear existing lights and add discovered ones
            this.discoveredLights.clear();
            lights.forEach(light => {
              this.discoveredLights.set(light.id, light);
            });
            
            this.lightsSubject.next(Array.from(this.discoveredLights.values()));
            observer.next(lights);
            observer.complete();
          } else {
            observer.next([]);
            observer.complete();
          }
        })
        .catch(error => {
          console.error('Error discovering lights:', error);
          observer.next([]);
          observer.complete();
        });
    });
  }

  private generateLightName(ip: string): string {
    const lastOctet = ip.split('.').pop();
    return `WiZ Light ${lastOctet}`;
  }

  private loadStoredLightNames(): { [lightId: string]: string } {
    try {
      const stored = localStorage.getItem(this.LIGHT_NAMES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load stored light names:', error);
      return {};
    }
  }

  private saveLightNamesToStorage(): void {
    try {
      const lightNames: { [lightId: string]: string } = {};
      this.discoveredLights.forEach((light) => {
        if (light.name && light.name !== this.generateLightName(light.ip)) {
          // Only store custom names, not generated ones
          lightNames[light.id] = light.name;
        }
      });
      localStorage.setItem(this.LIGHT_NAMES_STORAGE_KEY, JSON.stringify(lightNames));
    } catch (error) {
      console.warn('Failed to save light names to storage:', error);
    }
  }

  updateLightName(lightId: string, newName: string): boolean {
    const light = this.discoveredLights.get(lightId);
    if (light) {
      light.name = newName;
      this.saveLightNamesToStorage();
      this.lightsSubject.next(Array.from(this.discoveredLights.values()));
      return true;
    }
    return false;
  }

  private updateLightStatuses(): void {
    if (!this.isElectron) return;

    const lights = Array.from(this.discoveredLights.values());
    console.log(`Updating status for ${lights.length} lights...`);
    
    lights.forEach(async (light) => {
      try {
        const result = await this.testLight(light.ip);
        if (result.success && result.light) {
          this.updateLightFromData(light.id, result.light);
        } else {
          if (light instanceof WizLightImpl) {
            light.updateConnectionStatus(false);
          }
        }
      } catch (error) {
        console.error(`Failed to update status for light ${light.ip}:`, error);
        if (light instanceof WizLightImpl) {
          light.updateConnectionStatus(false);
        }
      }
    });
    
    this.lightsSubject.next(Array.from(this.discoveredLights.values()));
  }

  private async testLight(ip: string): Promise<LightTestResponse> {
    if (!this.isElectron || !window.electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }

    try {
      const command = { method: "getPilot", params: {} };
      const result = await window.electronAPI.sendCommand(ip, command);
      
      if (result.success && result.response && result.response.result) {
        const resultData = result.response.result;
        const light: DiscoveredLightData = {
          ip: ip,
          mac: resultData.mac || '',
          state: resultData.state || false,
          dimming: resultData.dimming || 10,
          temp: resultData.temp,
          r: resultData.r || 0,
          g: resultData.g || 0,
          b: resultData.b || 0,
          c: resultData.c || 0,
          w: resultData.w || 0,
          sceneId: resultData.sceneId || 0,
          rssi: resultData.rssi || 0,
          lastSeen: new Date().toISOString()
        };
        
        return { success: true, light };
      } else {
        return { success: false, error: 'No result in response' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private updateLightFromData(lightId: string, lightData: DiscoveredLightData): void {
    const light = this.discoveredLights.get(lightId);
    if (light && light instanceof WizLightImpl) {
      light.updateState(lightData.state);
      light.updateDimming(lightData.dimming);
      if (lightData.temp) {
        light.updateTemp(lightData.temp);
      } else {
        light.updateRGB(lightData.r || 0, lightData.g || 0, lightData.b || 0);
      }
      light.updateConnectionStatus(true);
    }
  }

  // Control methods
  async toggleLight(lightId: string): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      console.error('Electron API not available');
      return false;
    }

    const light = this.discoveredLights.get(lightId);
    if (!light) {
      console.error(`Light with ID ${lightId} not found`);
      return false;
    }

    const newState = !light.state;
    console.log(`Toggling light ${light.ip} to ${newState ? 'ON' : 'OFF'}`);

    try {
      const command: WizLightCommand = {
        method: "setPilot",
        params: { state: newState }
      };

      const result = await window.electronAPI.sendCommand(light.ip, command);
      
      if (result.success) {
        if (light instanceof WizLightImpl) {
          light.updateState(newState);
        }
        this.lightsSubject.next(Array.from(this.discoveredLights.values()));
        return true;
      } else {
        console.error(`Failed to toggle light ${light.ip}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`Error toggling light ${light.ip}:`, error);
      return false;
    }
  }

  async setBrightness(lightId: string, brightness: number): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      console.error('Electron API not available');
      return false;
    }

    const light = this.discoveredLights.get(lightId);
    if (!light) {
      console.error(`Light with ID ${lightId} not found`);
      return false;
    }

    const clampedBrightness = Math.max(1, Math.min(100, brightness));
    console.log(`Setting brightness for light ${light.ip} to ${clampedBrightness}%`);

    try {
      const command: WizLightCommand = {
        method: "setPilot",
        params: { 
          state: true, // Ensure light is on when setting brightness
          dimming: clampedBrightness 
        }
      };

      const result = await window.electronAPI.sendCommand(light.ip, command);
      
      if (result.success) {
        if (light instanceof WizLightImpl) {
          light.updateState(true);
          light.updateDimming(clampedBrightness);
        }
        this.lightsSubject.next(Array.from(this.discoveredLights.values()));
        return true;
      } else {
        console.error(`Failed to set brightness for light ${light.ip}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`Error setting brightness for light ${light.ip}:`, error);
      return false;
    }
  }

  async setColorTemp(lightId: string, temp: number): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      console.error('Electron API not available');
      return false;
    }

    const light = this.discoveredLights.get(lightId);
    if (!light) {
      console.error(`Light with ID ${lightId} not found`);
      return false;
    }

    const clampedTemp = Math.max(2200, Math.min(6500, temp));
    console.log(`Setting color temperature for light ${light.ip} to ${clampedTemp}K`);

    try {
      const command: WizLightCommand = {
        method: "setPilot",
        params: { 
          state: true,
          temp: clampedTemp 
        }
      };

      const result = await window.electronAPI.sendCommand(light.ip, command);
      
      if (result.success) {
        if (light instanceof WizLightImpl) {
          light.updateState(true);
          light.updateTemp(clampedTemp);
        }
        this.lightsSubject.next(Array.from(this.discoveredLights.values()));
        return true;
      } else {
        console.error(`Failed to set color temperature for light ${light.ip}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`Error setting color temperature for light ${light.ip}:`, error);
      return false;
    }
  }

  async setRGB(lightId: string, r: number, g: number, b: number): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      console.error('Electron API not available');
      return false;
    }

    const light = this.discoveredLights.get(lightId);
    if (!light) {
      console.error(`Light with ID ${lightId} not found`);
      return false;
    }

    const clampedR = Math.max(0, Math.min(255, r));
    const clampedG = Math.max(0, Math.min(255, g));
    const clampedB = Math.max(0, Math.min(255, b));
    
    console.log(`Setting RGB for light ${light.ip} to (${clampedR}, ${clampedG}, ${clampedB})`);

    try {
      const command: WizLightCommand = {
        method: "setPilot",
        params: { 
          state: true,
          r: clampedR,
          g: clampedG,
          b: clampedB
        }
      };

      const result = await window.electronAPI.sendCommand(light.ip, command);
      
      if (result.success) {
        if (light instanceof WizLightImpl) {
          light.updateState(true);
          light.updateRGB(clampedR, clampedG, clampedB);
        }
        this.lightsSubject.next(Array.from(this.discoveredLights.values()));
        return true;
      } else {
        console.error(`Failed to set RGB for light ${light.ip}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`Error setting RGB for light ${light.ip}:`, error);
      return false;
    }
  }

  async setRandomColor(lightId: string): Promise<boolean> {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    return this.setRGB(lightId, r, g, b);
  }

  getLights(): WizLight[] {
    return Array.from(this.discoveredLights.values());
  }

  getLight(lightId: string): WizLight | undefined {
    return this.discoveredLights.get(lightId);
  }

  isElectronEnvironment(): boolean {
    return this.isElectron;
  }
}
