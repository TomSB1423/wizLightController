import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    this.dimming = Math.max(10, Math.min(100, dimming));
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

@Injectable({
  providedIn: 'root'
})
export class WizLightService {
  private lightsSubject = new BehaviorSubject<WizLight[]>([]);
  public lights$ = this.lightsSubject.asObservable();
  
  private discoveredLights: Map<string, WizLight> = new Map();
  private readonly discoveryServerUrl = 'http://localhost:3001/api';
  private readonly LIGHT_NAMES_STORAGE_KEY = 'wizLightController_lightNames';
  
  constructor(private http: HttpClient) {
    // Start with real discovery instead of mock lights
    this.discoverLights().subscribe();
    
    // Set up periodic status updates
    interval(30000).subscribe(() => {
      this.updateLightStatuses();
    });
  }

  discoverLights(): Observable<WizLight[]> {
    console.log('Discovering WiZ lights...');
    
    return this.http.get<DiscoveryServerResponse>(`${this.discoveryServerUrl}/discover`).pipe(
      map(response => {
        if (response.success && response.lights) {
          // Load stored custom names
          const storedNames = this.loadStoredLightNames();
          
          return response.lights.map((lightData) => {
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
        }
        return [];
      }),
      tap(lights => {
        console.log(`Discovered ${lights.length} lights`);
        
        // Clear existing lights and add discovered ones
        this.discoveredLights.clear();
        lights.forEach(light => {
          this.discoveredLights.set(light.id, light);
        });
        
        this.lightsSubject.next(Array.from(this.discoveredLights.values()));
      }),
      catchError(error => {
        console.error('Error discovering lights:', error);
        return of([]);
      })
    );
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

  getLights(): Observable<WizLight[]> {
    return this.lights$;
  }

  getLightById(id: string): Observable<WizLight | undefined> {
    return this.lights$.pipe(
      map(lights => lights.find(light => light.id === id))
    );
  }

  toggleLight(lightId: string): Observable<boolean> {
    const light = this.discoveredLights.get(lightId) as WizLightImpl;
    if (!light) {
      return of(false);
    }

    // Use setPilot method with state parameter
    return this.sendCommand(light.ip, {
      method: 'setPilot',
      params: { state: !light.state }
    }).pipe(
      map(() => true), // State will be updated by sendCommand via server response
      catchError(() => of(false))
    );
  }

  setBrightness(lightId: string, brightness: number): Observable<boolean> {
    const light = this.discoveredLights.get(lightId) as WizLightImpl;
    if (!light) {
      return of(false);
    }

    brightness = Math.max(10, Math.min(100, brightness)); // WiZ range: 10-100

    // Make sure light is on when setting brightness
    const params: any = { dimming: brightness };
    if (!light.state) {
      params.state = true;
    }

    return this.sendCommand(light.ip, {
      method: 'setPilot',
      params: params
    }).pipe(
      map(() => true), // State will be updated by sendCommand via server response
      catchError(() => of(false))
    );
  }

  setColorTemperature(lightId: string, colorTemp: number): Observable<boolean> {
    const light = this.discoveredLights.get(lightId) as WizLightImpl;
    if (!light) {
      return of(false);
    }

    colorTemp = Math.max(2200, Math.min(6500, colorTemp)); // WiZ range: 2200-6500K

    // Make sure light is on when setting color temperature
    const params: any = { temp: colorTemp };
    if (!light.state) {
      params.state = true;
    }

    return this.sendCommand(light.ip, {
      method: 'setPilot',
      params: params
    }).pipe(
      map(() => true), // State will be updated by sendCommand via server response
      catchError(() => of(false))
    );
  }

  setRgbColor(lightId: string, r: number, g: number, b: number): Observable<boolean> {
    const light = this.discoveredLights.get(lightId) as WizLightImpl;
    if (!light) {
      return of(false);
    }

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // Make sure light is on when setting RGB color
    const params: any = { r, g, b };
    if (!light.state) {
      params.state = true;
    }

    return this.sendCommand(light.ip, {
      method: 'setPilot',
      params: params
    }).pipe(
      map(() => true), // State will be updated by sendCommand via server response
      catchError(() => of(false))
    );
  }

  randomizeLight(lightId: string): Observable<boolean> {
    const light = this.discoveredLights.get(lightId) as WizLightImpl;
    if (!light) {
      return of(false);
    }

    // Generate random RGB values (0-255)
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    // Send command with random values and ensure light is on
    return this.sendCommand(light.ip, {
      method: 'setPilot',
      params: { 
        state: true,
        r, 
        g, 
        b,
      }
    }).pipe(
      map(() => true), // State will be updated by sendCommand via server response
      catchError(() => of(false))
    );
  }

  setLightName(lightId: string, name: string): Observable<boolean> {
    const light = this.discoveredLights.get(lightId) as WizLightImpl;
    if (!light) {
      return of(false);
    }

    // Update the light name locally
    light.name = name.trim() || `WiZ Light ${light.ip.split('.').pop()}`;
    light.lastSeen = new Date();
    
    // Update the light in our store
    this.updateLightInStore(light);
    
    // Save all light names to localStorage
    this.saveLightNamesToStorage();
    
    return of(true);
  }

  private sendCommand(ip: string, command: WizLightCommand): Observable<WizLightResponse> {
    console.log(`Sending command to ${ip}:`, command);
    
    return this.http.post<CommandResponse>(
      `${this.discoveryServerUrl}/command/${ip}`, 
      command
    ).pipe(
      map(response => {
        if (response.success) {
          // If we have updated light data, use it to update our local state
          if (response.updatedLight) {
            console.log(`Updating local light state from server response:`, response.updatedLight);
            this.updateLightFromServerData(ip, response.updatedLight);
          }
          
          // Return the command response (either new format or legacy)
          const commandResponse = response.commandResponse || response.response;
          if (commandResponse) {
            // Check if the WiZ light response indicates success
            if (commandResponse.result && commandResponse.result.success) {
              return commandResponse;
            } else if (commandResponse.error) {
              throw new Error(`WiZ light error: ${commandResponse.error.message || 'Unknown error'}`);
            } else {
              return commandResponse; // Assume success if no error field
            }
          } else {
            throw new Error('No command response received');
          }
        } else {
          throw new Error(response.error || 'Command failed');
        }
      }),
      catchError(error => {
        console.error(`Failed to send command to ${ip}:`, error);
        throw error; // Re-throw the error instead of returning an Observable
      })
    );
  }

  private updateLightFromServerData(ip: string, lightData: any): void {
    // Find the light by IP and update it with fresh server data
    const existingLight = Array.from(this.discoveredLights.values()).find(light => light.ip === ip);
    if (existingLight) {
      const lightImpl = existingLight as WizLightImpl;
      
      // Update all properties with fresh data from server
      lightImpl.state = lightData.state;
      lightImpl.dimming = lightData.dimming;
      lightImpl.temp = lightData.temp;
      lightImpl.r = lightData.r ?? lightImpl.r ?? 0;
      lightImpl.g = lightData.g ?? lightImpl.g ?? 0;
      lightImpl.b = lightData.b ?? lightImpl.b ?? 0;
      lightImpl.c = lightData.c;
      lightImpl.w = lightData.w;
      lightImpl.sceneId = lightData.sceneId;
      lightImpl.rssi = lightData.rssi;
      lightImpl.lastSeen = new Date(lightData.lastSeen);
      lightImpl.isConnected = true;
      
      console.log(`Light ${ip} updated:`, {
        state: lightImpl.state,
        brightness: lightImpl.dimming,
        temp: lightImpl.temp,
        rgb: lightImpl.rgb,
        lastSeen: lightImpl.lastSeen
      });
      
      this.updateLightInStore(lightImpl);
    }
  }

  private updateLightInStore(light: WizLight): void {
    this.discoveredLights.set(light.id, light);
    this.lightsSubject.next(Array.from(this.discoveredLights.values()));
  }

  private updateLightStatuses(): void {
    const lights = Array.from(this.discoveredLights.values());
    
    lights.forEach(light => {
      this.http.get<LightTestResponse>(
        `${this.discoveryServerUrl}/test/${light.ip}`
      ).pipe(
        catchError(() => of({ success: false, error: 'Connection failed' } as LightTestResponse))
      ).subscribe(response => {
        const lightImpl = light as WizLightImpl;
        
        if (response.success && response.light) {
          // Update light status with fresh data from discovery server
          lightImpl.state = response.light.state;
          lightImpl.dimming = response.light.dimming;
          lightImpl.temp = response.light.temp;
          lightImpl.r = response.light.r ?? 0;
          lightImpl.g = response.light.g ?? 0;
          lightImpl.b = response.light.b ?? 0;
          lightImpl.c = response.light.c;
          lightImpl.w = response.light.w;
          lightImpl.sceneId = response.light.sceneId;
          lightImpl.rssi = response.light.rssi;
          lightImpl.lastSeen = new Date(response.light.lastSeen);
          lightImpl.isConnected = true;
          
          this.updateLightInStore(lightImpl);
        } else {
          // Mark light as disconnected
          lightImpl.updateConnectionStatus(false);
          this.updateLightInStore(lightImpl);
        }
      });
    });
  }
}