import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { WizLight } from './models/wiz-light.interface';
import { WizLightService } from './services/wiz-light.service';
import { WizLightElectronService } from './services/wiz-light-electron.service';
import { LightControlService } from './services/light-control.interface';
import { LightCardComponent } from './components/light-card.component';

// Factory function to provide the right service based on environment
export function lightServiceFactory(): LightControlService {
  // Check if running in Electron
  const isElectron = !!(window && (window as any).electronAPI);
  
  if (isElectron) {
    return new WizLightElectronService();
  } else {
    // For now, return a mock service or throw an error
    throw new Error('HTTP-based service not yet adapted to the common interface');
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LightCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [
    {
      provide: 'LightService',
      useFactory: lightServiceFactory
    }
  ]
})
export class AppComponent implements OnInit {
  title = 'WiZ Light Controller';
  lights$: Observable<WizLight[]>;
  isDiscovering = false;

  constructor(@Inject('LightService') private lightService: LightControlService) {
    this.lights$ = this.lightService.lights$;
  }

  ngOnInit(): void {
    this.discoverLights();
  }

  discoverLights(): void {
    this.isDiscovering = true;
    this.lightService.discoverLights().subscribe({
      next: (lights: WizLight[]) => {
        console.log('Discovered lights:', lights);
        this.isDiscovering = false;
      },
      error: (error: any) => {
        console.error('Error discovering lights:', error);
        this.isDiscovering = false;
      }
    });
  }

  async onTogglePower(lightId: string): Promise<void> {
    try {
      const success = await this.lightService.toggleLight(lightId);
      if (!success) {
        console.error('Failed to toggle light:', lightId);
      }
    } catch (error) {
      console.error('Error toggling light:', error);
    }
  }

  async onBrightnessChange(event: {lightId: string, brightness: number}): Promise<void> {
    try {
      const success = await this.lightService.setBrightness(event.lightId, event.brightness);
      if (!success) {
        console.error('Failed to set brightness for light:', event.lightId);
      }
    } catch (error) {
      console.error('Error setting brightness:', error);
    }
  }

  async onColorTempChange(event: {lightId: string, colorTemp: number}): Promise<void> {
    try {
      const success = await this.lightService.setColorTemp(event.lightId, event.colorTemp);
      if (!success) {
        console.error('Failed to set color temperature for light:', event.lightId);
      }
    } catch (error) {
      console.error('Error setting color temperature:', error);
    }
  }

  async onRgbChange(event: {lightId: string, r: number, g: number, b: number}): Promise<void> {
    try {
      const success = await this.lightService.setRGB(event.lightId, event.r, event.g, event.b);
      if (!success) {
        console.error('Failed to set RGB color for light:', event.lightId);
      }
    } catch (error) {
      console.error('Error setting RGB color:', error);
    }
  }

  async onRandomize(lightId: string): Promise<void> {
    try {
      const success = await this.lightService.setRandomColor(lightId);
      if (!success) {
        console.error('Failed to randomize light:', lightId);
      }
    } catch (error) {
      console.error('Error randomizing light:', error);
    }
  }

  onNameChange(event: {lightId: string, name: string}): void {
    const success = this.lightService.updateLightName(event.lightId, event.name);
    if (!success) {
      console.error('Failed to set name for light:', event.lightId);
    }
  }

  trackByLightId(index: number, light: WizLight): string {
    return light.id;
  }
}
