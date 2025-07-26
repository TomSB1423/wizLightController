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
      background: var(--bg-card);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      padding: 24px;
      transition: all var(--duration-normal) ease;
      box-shadow: var(--shadow-md);
      position: relative;
      overflow: hidden;
    }

    .light-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
      opacity: 0;
      transition: opacity var(--duration-normal) ease;
    }

    .light-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--border-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .light-card:hover::before {
      opacity: 1;
    }

    .light-card.offline {
      opacity: 0.6;
      border-color: var(--accent-danger);
      background: var(--bg-secondary);
    }

    .light-card.offline::before {
      background: var(--accent-danger);
      opacity: 0.7;
    }

    .light-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 12px;
    }

    .light-header h3 {
      margin: 0;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 1.125rem;
    }

    .light-title {
      cursor: pointer;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      transition: all var(--duration-normal) ease;
      border: 2px solid transparent;
      min-width: 140px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .light-title:hover {
      background: var(--bg-tertiary);
      border-color: var(--accent-primary);
      transform: translateX(2px);
      box-shadow: var(--shadow-sm);
    }

    .name-input {
      background: var(--bg-tertiary);
      border: 2px solid var(--accent-primary);
      border-radius: var(--radius-md);
      padding: 8px 12px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      outline: none;
      min-width: 140px;
      box-shadow: var(--glow-blue);
    }

    .name-input:focus {
      border-color: var(--accent-primary-hover);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), var(--glow-blue);
    }

    .connection-status {
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--accent-danger);
      color: white;
      box-shadow: var(--shadow-sm);
    }

    .connection-status.connected {
      background: var(--accent-secondary);
      box-shadow: var(--shadow-sm);
    }

    .light-info {
      margin-bottom: 24px;
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .light-info p {
      margin: 6px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .light-info strong {
      color: var(--text-tertiary);
      font-weight: 500;
    }

    .light-controls {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .light-controls.disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .power-toggle {
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      padding: 12px 16px;
      border-radius: var(--radius-lg);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      transition: all var(--duration-normal) ease;
    }

    .power-toggle:hover {
      background: var(--bg-tertiary);
      border-color: var(--border-hover);
      transform: translateX(2px);
    }

    .power-toggle input[type="checkbox"] {
      display: none;
    }

    .toggle-slider {
      position: relative;
      width: 56px;
      height: 28px;
      background: var(--bg-tertiary);
      border: 2px solid var(--border-secondary);
      border-radius: var(--radius-full);
      transition: all var(--duration-normal) ease;
    }

    .toggle-slider:before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--text-tertiary);
      top: 2px;
      left: 2px;
      transition: all var(--duration-normal) ease;
      box-shadow: var(--shadow-sm);
    }

    .power-toggle input:checked + .toggle-slider {
      background: var(--accent-secondary);
      border-color: var(--accent-secondary);
      box-shadow: var(--glow-green);
    }

    .power-toggle input:checked + .toggle-slider:before {
      transform: translateX(28px);
      background: white;
    }

    .toggle-label {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .slider {
      width: 100%;
      height: 8px;
      border-radius: var(--radius-full);
      background: var(--bg-tertiary);
      outline: none;
      -webkit-appearance: none;
      margin: 8px 0;
      transition: all var(--duration-normal) ease;
      border: 1px solid var(--border-primary);
    }

    .slider:hover:not(:disabled) {
      background: var(--bg-secondary);
      border-color: var(--border-hover);
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent-primary);
      cursor: pointer;
      border: 3px solid var(--bg-card);
      box-shadow: var(--shadow-md);
      transition: all var(--duration-normal) ease;
    }

    .slider::-webkit-slider-thumb:hover {
      width: 28px;
      height: 28px;
      box-shadow: var(--shadow-lg), var(--glow-blue);
      transform: scale(1.1);
    }

    .rgb-slider {
      transition: none;
    }

    .rgb-slider::-webkit-slider-thumb {
      transition: transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
    }

    .brightness-slider::-webkit-slider-thumb {
      background: var(--accent-warning);
    }

    .brightness-slider::-webkit-slider-thumb:hover {
      background: #fbbf24;
      box-shadow: var(--shadow-lg), 0 0 20px rgba(245, 158, 11, 0.4);
    }

    .brightness-slider:hover:not(:disabled) {
      background: linear-gradient(to right, var(--bg-tertiary), rgba(245, 158, 11, 0.2));
    }

    .temp-slider::-webkit-slider-thumb {
      background: #fef08a;
      border-color: #f59e0b;
    }

    .rgb-controls {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      border-radius: var(--radius-lg);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      transition: all var(--duration-normal) ease;
    }

    .rgb-controls:hover {
      background: var(--bg-tertiary);
      border-color: var(--border-hover);
      box-shadow: var(--shadow-sm);
    }

    .rgb-controls.dimmed {
      opacity: 0.4;
      background: var(--bg-secondary);
    }

    .rgb-controls.dimmed:hover {
      background: var(--bg-secondary);
      box-shadow: none;
    }

    .rgb-input {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      transition: all var(--duration-normal) ease;
    }

    .rgb-input:hover {
      background: var(--bg-card);
      transform: translateX(2px);
    }

    .rgb-input label {
      width: 24px;
      font-weight: 600;
      font-size: 0.875rem;
      transition: color var(--duration-normal) ease;
      color: var(--text-secondary);
    }

    .rgb-input:hover label {
      color: var(--accent-primary);
    }

    .rgb-input span {
      width: 36px;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-primary);
      transition: all var(--duration-normal) ease;
    }

    .rgb-input:hover span {
      background: var(--bg-card);
      border-color: var(--accent-primary);
      color: var(--accent-primary);
      transform: scale(1.05);
    }

    .rgb-slider.red::-webkit-slider-thumb {
      background: #ef4444;
    }

    .rgb-slider.red::-webkit-slider-thumb:hover {
      background: #f87171;
      box-shadow: var(--shadow-lg), 0 0 20px rgba(239, 68, 68, 0.4);
    }

    .rgb-slider.red:hover:not(:disabled) {
      background: linear-gradient(to right, var(--bg-tertiary), rgba(239, 68, 68, 0.2));
    }

    .rgb-slider.green::-webkit-slider-thumb {
      background: var(--accent-secondary);
    }

    .rgb-slider.green::-webkit-slider-thumb:hover {
      background: #34d399;
      box-shadow: var(--shadow-lg), var(--glow-green);
    }

    .rgb-slider.green:hover:not(:disabled) {
      background: linear-gradient(to right, var(--bg-tertiary), rgba(16, 185, 129, 0.2));
    }

    .rgb-slider.blue::-webkit-slider-thumb {
      background: var(--accent-primary);
    }

    .rgb-slider.blue::-webkit-slider-thumb:hover {
      background: #60a5fa;
      box-shadow: var(--shadow-lg), var(--glow-blue);
    }

    .rgb-slider.blue:hover:not(:disabled) {
      background: linear-gradient(to right, var(--bg-tertiary), rgba(59, 130, 246, 0.2));
    }

    .color-picker-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .color-picker {
      width: 80px;
      height: 48px;
      border: 2px solid var(--border-primary);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--duration-normal) ease;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background: none;
      padding: 0;
      overflow: hidden;
    }

    .color-picker:hover:not(:disabled) {
      border-color: var(--accent-primary);
      box-shadow: var(--shadow-md), var(--glow-blue);
      transform: scale(1.05);
    }

    .color-picker:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .color-picker::-webkit-color-swatch-wrapper {
      padding: 0;
      border: none;
      border-radius: var(--radius-sm);
    }

    .color-picker::-webkit-color-swatch {
      border: none;
      border-radius: var(--radius-sm);
    }

    .color-picker::-moz-color-swatch {
      border: none;
      border-radius: var(--radius-sm);
    }

    label {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .random-button {
      background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
      background-size: 300% 300%;
      animation: gradientShift 4s ease infinite;
      border: none;
      color: white;
      padding: 16px 24px;
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--duration-normal) ease;
      box-shadow: var(--shadow-md);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      position: relative;
      overflow: hidden;
    }

    .random-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left var(--duration-slow) ease;
    }

    .random-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .random-button:hover:not(:disabled)::before {
      left: 100%;
    }

    .random-button:active:not(:disabled) {
      transform: translateY(0);
    }

    .random-button:disabled {
      background: var(--bg-tertiary);
      cursor: not-allowed;
      animation: none;
      color: var(--text-muted);
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Scrollbar styling for internal elements if needed */
    .rgb-controls::-webkit-scrollbar {
      width: 6px;
    }

    .rgb-controls::-webkit-scrollbar-track {
      background: var(--bg-secondary);
    }

    .rgb-controls::-webkit-scrollbar-thumb {
      background: var(--border-secondary);
      border-radius: var(--radius-full);
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