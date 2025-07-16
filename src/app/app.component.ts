import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { WizLight } from './models/wiz-light.interface';
import { WizLightService } from './services/wiz-light.service';
import { LightCardComponent } from './components/light-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LightCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'WiZ Light Controller';
  lights$: Observable<WizLight[]>;
  isDiscovering = false;

  constructor(private wizLightService: WizLightService) {
    this.lights$ = this.wizLightService.getLights();
  }

  ngOnInit(): void {
    this.discoverLights();
  }

  discoverLights(): void {
    this.isDiscovering = true;
    this.wizLightService.discoverLights().subscribe({
      next: (lights) => {
        console.log('Discovered lights:', lights);
        this.isDiscovering = false;
      },
      error: (error) => {
        console.error('Error discovering lights:', error);
        this.isDiscovering = false;
      }
    });
  }

  onTogglePower(lightId: string): void {
    this.wizLightService.toggleLight(lightId).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to toggle light:', lightId);
        }
      }
    });
  }

  onBrightnessChange(event: {lightId: string, brightness: number}): void {
    this.wizLightService.setBrightness(event.lightId, event.brightness).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to set brightness for light:', event.lightId);
        }
      }
    });
  }

  onColorTempChange(event: {lightId: string, colorTemp: number}): void {
    this.wizLightService.setColorTemperature(event.lightId, event.colorTemp).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to set color temperature for light:', event.lightId);
        }
      }
    });
  }

  onRgbChange(event: {lightId: string, r: number, g: number, b: number}): void {
    this.wizLightService.setRgbColor(event.lightId, event.r, event.g, event.b).subscribe({
      next: (success) => {
        if (!success) {
          console.error('Failed to set RGB color for light:', event.lightId);
        }
      }
    });
  }

  trackByLightId(index: number, light: WizLight): string {
    return light.id;
  }
}
