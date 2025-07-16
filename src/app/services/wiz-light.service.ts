import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { WizLight, WizLightCommand, WizLightResponse } from '../models/wiz-light.interface';

@Injectable({
  providedIn: 'root'
})
export class WizLightService {
  private lightsSubject = new BehaviorSubject<WizLight[]>([]);
  public lights$ = this.lightsSubject.asObservable();
  
  private discoveredLights: Map<string, WizLight> = new Map();
  
  constructor(private http: HttpClient) {
    // Start with some mock lights for demonstration
    this.initializeMockLights();
    
    // Set up periodic status updates
    interval(5000).subscribe(() => {
      this.updateLightStatuses();
    });
  }

  private initializeMockLights(): void {
    const mockLights: WizLight[] = [
      {
        id: '1',
        ip: '192.168.1.100',
        mac: '00:11:22:33:44:55',
        name: 'Living Room Light',
        isOn: true,
        brightness: 80,
        colorTemp: 4000,
        lastSeen: new Date(),
        isConnected: true
      },
      {
        id: '2', 
        ip: '192.168.1.101',
        mac: '00:11:22:33:44:56',
        name: 'Bedroom Light',
        isOn: false,
        brightness: 50,
        rgb: { r: 255, g: 100, b: 50 },
        lastSeen: new Date(),
        isConnected: true
      },
      {
        id: '3',
        ip: '192.168.1.102', 
        mac: '00:11:22:33:44:57',
        name: 'Kitchen Light',
        isOn: true,
        brightness: 100,
        colorTemp: 2700,
        lastSeen: new Date(),
        isConnected: false
      }
    ];

    mockLights.forEach(light => {
      this.discoveredLights.set(light.id, light);
    });
    
    this.lightsSubject.next(Array.from(this.discoveredLights.values()));
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
    const light = this.discoveredLights.get(lightId);
    if (!light) {
      return of(false);
    }

    // Simulate API call
    return this.sendCommand(light.ip, {
      method: 'setState',
      params: { state: !light.isOn }
    }).pipe(
      tap(() => {
        light.isOn = !light.isOn;
        light.lastSeen = new Date();
        this.updateLightInStore(light);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  setBrightness(lightId: string, brightness: number): Observable<boolean> {
    const light = this.discoveredLights.get(lightId);
    if (!light) {
      return of(false);
    }

    brightness = Math.max(1, Math.min(100, brightness));

    return this.sendCommand(light.ip, {
      method: 'setState',
      params: { dimming: brightness }
    }).pipe(
      tap(() => {
        light.brightness = brightness;
        light.lastSeen = new Date();
        this.updateLightInStore(light);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  setColorTemperature(lightId: string, colorTemp: number): Observable<boolean> {
    const light = this.discoveredLights.get(lightId);
    if (!light) {
      return of(false);
    }

    colorTemp = Math.max(2200, Math.min(6500, colorTemp));

    return this.sendCommand(light.ip, {
      method: 'setState',
      params: { temp: colorTemp }
    }).pipe(
      tap(() => {
        light.colorTemp = colorTemp;
        light.rgb = undefined; // Clear RGB when setting color temp
        light.lastSeen = new Date();
        this.updateLightInStore(light);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  setRgbColor(lightId: string, r: number, g: number, b: number): Observable<boolean> {
    const light = this.discoveredLights.get(lightId);
    if (!light) {
      return of(false);
    }

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return this.sendCommand(light.ip, {
      method: 'setState',
      params: { r, g, b }
    }).pipe(
      tap(() => {
        light.rgb = { r, g, b };
        light.colorTemp = undefined; // Clear color temp when setting RGB
        light.lastSeen = new Date();
        this.updateLightInStore(light);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  discoverLights(): Observable<WizLight[]> {
    // In a real implementation, this would use UDP broadcast to discover lights
    // For now, we'll simulate discovery by returning the mock lights
    console.log('Discovering WiZ lights...');
    
    return of(Array.from(this.discoveredLights.values())).pipe(
      tap(lights => {
        console.log(`Discovered ${lights.length} lights`);
      })
    );
  }

  private sendCommand(ip: string, command: WizLightCommand): Observable<WizLightResponse> {
    // In a real implementation, this would send UDP packets to the light
    // For now, we'll simulate the API call
    console.log(`Sending command to ${ip}:`, command);
    
    return of({
      method: command.method,
      result: { success: true }
    }).pipe(
      // Simulate network delay
      tap(() => new Promise(resolve => setTimeout(resolve, 100)))
    );
  }

  private updateLightInStore(light: WizLight): void {
    this.discoveredLights.set(light.id, { ...light });
    this.lightsSubject.next(Array.from(this.discoveredLights.values()));
  }

  private updateLightStatuses(): void {
    // In a real implementation, this would ping each light for status
    // For now, we'll just update the lastSeen timestamp for connected lights
    const lights = Array.from(this.discoveredLights.values());
    lights.forEach(light => {
      if (light.isConnected) {
        light.lastSeen = new Date();
        this.updateLightInStore(light);
      }
    });
  }
}