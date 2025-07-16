import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
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
        <h3 
          *ngIf="!isEditingName" 
          class="light-title" 
          (click)="startEditingName()"
          [title]="'Click to edit name'"
        >
          {{ light.name || 'Unnamed Light' }}
        </h3>
        <input 
          *ngIf="isEditingName"
          #nameInput
          type="text"
          class="name-input"
          [value]="editingName"
          (input)="editingName = $any($event.target).value"
          (blur)="finishEditingName()"
          (keyup.enter)="finishEditingName()"
          (keyup.escape)="cancelEditingName()"
          placeholder="Enter light name"
        />
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
          <label>Brightness: {{ light.isOn ? (light.brightness || 0) : 0 }}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            [value]="light.isOn ? (light.brightness || 10) : 0"
            [disabled]="!light.isConnected"
            (input)="onBrightnessChange($event)"
            class="slider brightness-slider"
          />
        </div>

        <!-- Color Temperature Control (if available) -->
        <div class="control-group" *ngIf="light.colorTemp">
          <label>Color Temperature: {{ light.colorTemp || 4000 }}K</label>
          <input 
            type="range" 
            min="2200" 
            max="6500" 
            [value]="light.colorTemp || 4000"
            [disabled]="!light.isConnected || !light.isOn"
            (input)="onColorTempChange($event)"
            class="slider temp-slider"
          />
        </div>

        <!-- RGB Color Control -->
        <div class="control-group">
          <label>RGB Color</label>
          <div class="rgb-controls" [class.dimmed]="!light.isOn">
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
            <div class="color-picker-container">
              <label>Color Picker:</label>
              <input 
                type="color" 
                [value]="rgbToHex(light.rgb.r, light.rgb.g, light.rgb.b)"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onColorPickerChange($event)"
                class="color-picker"
                title="Click to open color picker"
              />
            </div>
          </div>
        </div>

        <!-- Random Colors Button -->
        <div class="control-group">
          <button 
            class="random-button"
            [disabled]="!light.isConnected"
            (click)="onRandomize()"
            title="Set random colors and brightness"
          >
            🎨 Randomize
          </button>
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

    .light-title {
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
      border: 2px solid transparent;
      min-width: 120px;
    }

    .light-title:hover {
      background: rgba(33, 150, 243, 0.1);
      border-color: rgba(33, 150, 243, 0.3);
      transform: translateX(2px);
    }

    .name-input {
      background: white;
      border: 2px solid #2196F3;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 18px;
      font-weight: bold;
      color: #333;
      outline: none;
      min-width: 120px;
      box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
    }

    .name-input:focus {
      border-color: #1976D2;
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
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
      transition: all 0.3s ease;
    }

    .slider:hover:not(:disabled) {
      height: 8px;
      transform: translateY(-1px);
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
      transition: all 0.2s ease;
    }

    .slider::-webkit-slider-thumb:hover {
      width: 24px;
      height: 24px;
      box-shadow: 0 4px 8px rgba(255, 152, 0, 0.4);
      transform: scale(1.1);
    }

    /* Smooth slider value transitions - removed conditional approach */
    .rgb-slider {
      transition: none; /* Remove transitions on sliders for responsive feel */
    }

    .rgb-slider::-webkit-slider-thumb {
      transition: transform 0.1s ease, box-shadow 0.1s ease; /* Only animate hover effects */
    }

    .brightness-slider::-webkit-slider-thumb {
      background: #ff9800;
      transition: all 0.2s ease;
    }

    .brightness-slider::-webkit-slider-thumb:hover {
      background: #ffb74d;
      box-shadow: 0 4px 8px rgba(255, 152, 0, 0.4);
    }

    .brightness-slider:hover:not(:disabled) {
      background: linear-gradient(to right, #fff3e0, #ff9800);
    }

    .temp-slider::-webkit-slider-thumb {
      background: #ffeb3b;
    }

    .rgb-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.02);
      transition: all 0.3s ease;
    }

    .rgb-controls:hover {
      background: rgba(33, 150, 243, 0.05);
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
    }

    .rgb-controls.dimmed {
      opacity: 0.4;
      background: rgba(0, 0, 0, 0.01);
    }

    .rgb-controls.dimmed:hover {
      background: rgba(0, 0, 0, 0.01);
      box-shadow: none;
    }

    .rgb-input {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .rgb-input:hover {
      background: rgba(0, 0, 0, 0.02);
      transform: translateX(2px);
    }

    .rgb-input label {
      width: 20px;
      font-weight: bold;
      transition: color 0.2s ease;
    }

    .rgb-input:hover label {
      color: #2196F3;
    }

    .rgb-input span {
      width: 30px;
      text-align: right;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.15s ease-in-out;
      padding: 2px 4px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.05);
    }

    .rgb-input:hover span {
      background: rgba(33, 150, 243, 0.1);
      color: #2196F3;
      transform: scale(1.05);
    }

    .rgb-slider.red::-webkit-slider-thumb {
      background: #f44336;
      transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease;
    }

    .rgb-slider.red::-webkit-slider-thumb:hover {
      background: #ff6b6b;
      box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
    }

    .rgb-slider.red:hover:not(:disabled) {
      background: linear-gradient(to right, #ffebee, #f44336);
    }

    .rgb-slider.green::-webkit-slider-thumb {
      background: #4caf50;
      transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease;
    }

    .rgb-slider.green::-webkit-slider-thumb:hover {
      background: #66bb6a;
      box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
    }

    .rgb-slider.green:hover:not(:disabled) {
      background: linear-gradient(to right, #e8f5e8, #4caf50);
    }

    .rgb-slider.blue::-webkit-slider-thumb {
      background: #2196f3;
      transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease;
    }

    .rgb-slider.blue::-webkit-slider-thumb:hover {
      background: #42a5f5;
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
    }

    .rgb-slider.blue:hover:not(:disabled) {
      background: linear-gradient(to right, #e3f2fd, #2196f3);
    }

    .color-picker-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
    }

    .color-picker {
      width: 60px;
      height: 40px;
      border: 2px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: border-color 0.2s ease;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background: none;
      padding: 0;
    }

    .color-picker:hover:not(:disabled) {
      border-color: #2196F3;
    }

    .color-picker:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Custom styling for WebKit browsers */
    .color-picker::-webkit-color-swatch-wrapper {
      padding: 0;
      border: none;
      border-radius: 2px;
    }

    .color-picker::-webkit-color-swatch {
      border: none;
      border-radius: 2px;
    }

    /* Custom styling for Firefox */
    .color-picker::-moz-color-swatch {
      border: none;
      border-radius: 2px;
    }

    label {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .random-button {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
      background-size: 300% 300%;
      animation: gradientShift 3s ease infinite;
      border: none;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .random-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    .random-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .random-button:disabled {
      background: #ccc;
      cursor: not-allowed;
      animation: none;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `]
})
export class LightCardComponent implements OnDestroy {
  @Input() light!: WizLight;
  @Output() togglePower = new EventEmitter<string>();
  @Output() brightnessChange = new EventEmitter<{lightId: string, brightness: number}>();
  @Output() colorTempChange = new EventEmitter<{lightId: string, colorTemp: number}>();
  @Output() rgbChange = new EventEmitter<{lightId: string, r: number, g: number, b: number}>();
  @Output() randomize = new EventEmitter<string>();
  @Output() nameChange = new EventEmitter<{lightId: string, name: string}>();

  private rgbDebounceTimer: any;
  private isDragging = false;
  
  // Name editing properties
  public isEditingName = false;
  public editingName = '';

  onTogglePower(): void {
    this.togglePower.emit(this.light.id);
  }

  onBrightnessChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    let brightness = parseInt(target.value);
    
    // If brightness is between 1-9, snap to 0 (turn off) since WiZ lights minimum is 10%
    if (brightness > 0 && brightness < 10) {
      brightness = 0;
      // Update the slider visual to reflect the snap
      target.value = '0';
    }
    
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
    
    // Create RGB object if it doesn't exist
    const newRgb = this.light.rgb ? { ...this.light.rgb } : { r: 0, g: 0, b: 0 };
    newRgb[component] = value;
    
    // Clear existing timer
    if (this.rgbDebounceTimer) {
      clearTimeout(this.rgbDebounceTimer);
    }
    
    // Set dragging state
    this.isDragging = true;
    
    // Debounce the actual light update during manual dragging
    this.rgbDebounceTimer = setTimeout(() => {
      this.rgbChange.emit({
        lightId: this.light.id,
        r: newRgb.r,
        g: newRgb.g,
        b: newRgb.b
      });
      this.isDragging = false;
    }, 100); // Small delay to batch rapid changes
  }

  rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number): string => {
      const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  onColorPickerChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const hexColor = target.value;
    const rgb = this.hexToRgb(hexColor);
    
    // Clear any pending debounced updates since this is immediate
    if (this.rgbDebounceTimer) {
      clearTimeout(this.rgbDebounceTimer);
    }
    
    this.rgbChange.emit({
      lightId: this.light.id,
      r: rgb.r,
      g: rgb.g,
      b: rgb.b
    });
  }

  onRandomize(): void {
    // Clear any pending debounced updates since this is immediate
    if (this.rgbDebounceTimer) {
      clearTimeout(this.rgbDebounceTimer);
    }
    
    this.randomize.emit(this.light.id);
  }

  // Name editing methods
  startEditingName(): void {
    if (!this.light.isConnected) return;
    
    this.isEditingName = true;
    this.editingName = this.light.name || '';
    
    // Focus the input after the view updates
    setTimeout(() => {
      const input = document.querySelector('.name-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  finishEditingName(): void {
    if (this.editingName.trim() !== (this.light.name || '')) {
      this.nameChange.emit({
        lightId: this.light.id,
        name: this.editingName.trim()
      });
    }
    this.isEditingName = false;
  }

  cancelEditingName(): void {
    this.isEditingName = false;
    this.editingName = '';
  }

  ngOnDestroy(): void {
    // Clean up any pending timers
    if (this.rgbDebounceTimer) {
      clearTimeout(this.rgbDebounceTimer);
    }
  }
}