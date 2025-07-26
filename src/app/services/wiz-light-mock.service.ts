import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { WizLight } from '../models/wiz-light.interface';
import { LightControlService } from './light-control.interface';

@Injectable()
export class WizLightMockService implements LightControlService {
  private lightsSubject = new BehaviorSubject<WizLight[]>([]);

  get lights$(): Observable<WizLight[]> {
    return this.lightsSubject.asObservable();
  }

  discoverLights(): Observable<WizLight[]> {
    // Create mock lights for demo
    const mockLights: WizLight[] = [
      {
        id: 'demo-light-1',
        ip: '192.168.1.100',
        mac: 'AA:BB:CC:DD:EE:FF',
        name: 'Demo Light 1',
        state: false,
        dimming: 75,
        r: 255,
        g: 180,
        b: 50,
        lastSeen: new Date(),
        isConnected: true,
        get isOn() { return this.state; },
        get brightness() { return this.dimming; },
        get colorTemp() { return this.temp; },
        get rgb() { return { r: this.r, g: this.g, b: this.b }; }
      },
      {
        id: 'demo-light-2',
        ip: '192.168.1.101',
        mac: 'FF:EE:DD:CC:BB:AA',
        name: 'Demo Light 2',
        state: true,
        dimming: 50,
        r: 100,
        g: 200,
        b: 255,
        lastSeen: new Date(),
        isConnected: true,
        get isOn() { return this.state; },
        get brightness() { return this.dimming; },
        get colorTemp() { return this.temp; },
        get rgb() { return { r: this.r, g: this.g, b: this.b }; }
      }
    ];

    this.lightsSubject.next(mockLights);
    return of(mockLights);
  }

  async toggleLight(lightId: string): Promise<boolean> {
    const lights = this.getLights();
    const light = lights.find(l => l.id === lightId);
    if (light) {
      light.state = !light.state;
      this.lightsSubject.next([...lights]);
      return true;
    }
    return false;
  }

  async setBrightness(lightId: string, brightness: number): Promise<boolean> {
    const lights = this.getLights();
    const light = lights.find(l => l.id === lightId);
    if (light) {
      light.dimming = Math.max(10, Math.min(100, brightness));
      this.lightsSubject.next([...lights]);
      return true;
    }
    return false;
  }

  async setColorTemp(lightId: string, temp: number): Promise<boolean> {
    const lights = this.getLights();
    const light = lights.find(l => l.id === lightId);
    if (light) {
      light.temp = Math.max(2200, Math.min(6500, temp));
      this.lightsSubject.next([...lights]);
      return true;
    }
    return false;
  }

  async setRGB(lightId: string, r: number, g: number, b: number): Promise<boolean> {
    const lights = this.getLights();
    const light = lights.find(l => l.id === lightId);
    if (light) {
      light.r = Math.max(0, Math.min(255, r));
      light.g = Math.max(0, Math.min(255, g));
      light.b = Math.max(0, Math.min(255, b));
      this.lightsSubject.next([...lights]);
      return true;
    }
    return false;
  }

  async setRandomColor(lightId: string): Promise<boolean> {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return this.setRGB(lightId, r, g, b);
  }

  updateLightName(lightId: string, newName: string): boolean {
    const lights = this.getLights();
    const light = lights.find(l => l.id === lightId);
    if (light) {
      light.name = newName;
      this.lightsSubject.next([...lights]);
      return true;
    }
    return false;
  }

  getLights(): WizLight[] {
    return this.lightsSubject.value;
  }

  getLight(lightId: string): WizLight | undefined {
    return this.getLights().find(light => light.id === lightId);
  }
}
