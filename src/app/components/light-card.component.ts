import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WizLight } from '../models/wiz-light.interface';

@Component({
  selector: 'app-light-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="light-card" [class.offline]="!light.isConnected">
      <div class="light-header">
        <h3>{{ light.name || 'Unnamed Light' }}</h3>
        <div class="connection-status" [class.connected]="light.isConnected">
          {{ light.isConnected ? 'Online' : 'Offline' }}
        </div>
      </div>
      
      <div class="light-info">
        <p><strong>IP:</strong> {{ light.ip }}</p>
        <p><strong>Last Seen:</strong> {{ light.lastSeen | date:'short' }}</p>
      </div>

      <div class="light-controls" [class.disabled]="!light.isConnected">
        <!-- Power Toggle -->
        <div class="control-group">
          <label class="power-toggle">
            <input 
              type="checkbox" 
              [checked]="light.isOn" 
              [disabled]="!light.isConnected"
              (change)="onTogglePower()"
            />
            <span class="toggle-slider"></span>
            <span class="toggle-label">{{ light.isOn ? 'ON' : 'OFF' }}</span>
          </label>
        </div>

        <!-- Brightness Control -->
        <div class="control-group">
          <label>Brightness: {{ light.brightness }}%</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            [value]="light.brightness"
            [disabled]="!light.isConnected || !light.isOn"
            (input)="onBrightnessChange($event)"
            class="slider brightness-slider"
          />
        </div>

        <!-- Color Temperature Control (if available) -->
        <div class="control-group" *ngIf="light.colorTemp">
          <label>Color Temperature: {{ light.colorTemp }}K</label>
          <input 
            type="range" 
            min="2200" 
            max="6500" 
            [value]="light.colorTemp"
            [disabled]="!light.isConnected || !light.isOn"
            (input)="onColorTempChange($event)"
            class="slider temp-slider"
          />
        </div>

        <!-- RGB Color Control (if available) -->
        <div class="control-group" *ngIf="light.rgb">
          <label>RGB Color</label>
          <div class="rgb-controls">
            <div class="rgb-input">
              <label>R:</label>
              <input 
                type="range" 
                min="0" 
                max="255" 
                [value]="light.rgb.r"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onRgbChange('r', $event)"
                class="slider rgb-slider red"
              />
              <span>{{ light.rgb.r }}</span>
            </div>
            <div class="rgb-input">
              <label>G:</label>
              <input 
                type="range" 
                min="0" 
                max="255" 
                [value]="light.rgb.g"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onRgbChange('g', $event)"
                class="slider rgb-slider green"
              />
              <span>{{ light.rgb.g }}</span>
            </div>
            <div class="rgb-input">
              <label>B:</label>
              <input 
                type="range" 
                min="0" 
                max="255" 
                [value]="light.rgb.b"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onRgbChange('b', $event)"
                class="slider rgb-slider blue"
              />
              <span>{{ light.rgb.b }}</span>
            </div>
            <div class="color-preview" 
                 [style.background-color]="'rgb(' + light.rgb.r + ',' + light.rgb.g + ',' + light.rgb.b + ')'">
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .light-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }

    .light-card.offline {
      opacity: 0.6;
      border-color: #f44336;
    }

    .light-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .light-header h3 {
      margin: 0;
      color: #333;
    }

    .connection-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      background: #f44336;
      color: white;
    }

    .connection-status.connected {
      background: #4caf50;
    }

    .light-info {
      margin-bottom: 16px;
      color: #666;
      font-size: 14px;
    }

    .light-info p {
      margin: 4px 0;
    }

    .light-controls {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .light-controls.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .power-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .power-toggle input[type="checkbox"] {
      display: none;
    }

    .toggle-slider {
      position: relative;
      width: 50px;
      height: 24px;
      background: #ccc;
      border-radius: 24px;
      transition: 0.3s;
    }

    .toggle-slider:before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      top: 2px;
      left: 2px;
      transition: 0.3s;
    }

    .power-toggle input:checked + .toggle-slider {
      background: #4caf50;
    }

    .power-toggle input:checked + .toggle-slider:before {
      transform: translateX(26px);
    }

    .toggle-label {
      font-weight: bold;
      color: #333;
    }

    .slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #ddd;
      outline: none;
      -webkit-appearance: none;
      margin: 4px 0;
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2196F3;
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .brightness-slider::-webkit-slider-thumb {
      background: #ff9800;
    }

    .temp-slider::-webkit-slider-thumb {
      background: #ffeb3b;
    }

    .rgb-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rgb-input {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rgb-input label {
      width: 20px;
      font-weight: bold;
    }

    .rgb-input span {
      width: 30px;
      text-align: right;
      font-size: 12px;
    }

    .rgb-slider.red::-webkit-slider-thumb {
      background: #f44336;
    }

    .rgb-slider.green::-webkit-slider-thumb {
      background: #4caf50;
    }

    .rgb-slider.blue::-webkit-slider-thumb {
      background: #2196f3;
    }

    .color-preview {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      border: 2px solid #ddd;
      margin-top: 8px;
    }

    label {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }
  `]
})
export class LightCardComponent {
  @Input() light!: WizLight;
  @Output() togglePower = new EventEmitter<string>();
  @Output() brightnessChange = new EventEmitter<{lightId: string, brightness: number}>();
  @Output() colorTempChange = new EventEmitter<{lightId: string, colorTemp: number}>();
  @Output() rgbChange = new EventEmitter<{lightId: string, r: number, g: number, b: number}>();

  onTogglePower(): void {
    this.togglePower.emit(this.light.id);
  }

  onBrightnessChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const brightness = parseInt(target.value);
    this.brightnessChange.emit({
      lightId: this.light.id,
      brightness: brightness
    });
  }

  onColorTempChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const colorTemp = parseInt(target.value);
    this.colorTempChange.emit({
      lightId: this.light.id,
      colorTemp: colorTemp
    });
  }

  onRgbChange(component: 'r' | 'g' | 'b', event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    
    if (this.light.rgb) {
      const newRgb = { ...this.light.rgb };
      newRgb[component] = value;
      
      this.rgbChange.emit({
        lightId: this.light.id,
        r: newRgb.r,
        g: newRgb.g,
        b: newRgb.b
      });
    }
  }
}