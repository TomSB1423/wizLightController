import { Component, Input, Output, EventEmitter, OnDestroy, OnInit, OnChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
          [title]="'Click to edit light name (text will be highlighted)'"
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
          (focus)="onInputFocus($event)"
          (click)="onInputClick($event)"
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
            [value]="localValues.brightness"
            [disabled]="!light.isConnected"
            (input)="onBrightnessChange($event)"
            (mousedown)="startDrag('brightness')"
            (mouseup)="endDrag('brightness')"
            (touchstart)="startDrag('brightness')"
            (touchend)="endDrag('brightness')"
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
            [value]="localValues.colorTemp"
            [disabled]="!light.isConnected || !light.isOn"
            (input)="onColorTempChange($event)"
            (mousedown)="startDrag('colorTemp')"
            (mouseup)="endDrag('colorTemp')"
            (touchstart)="startDrag('colorTemp')"
            (touchend)="endDrag('colorTemp')"
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
                [value]="localValues.rgbR"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onRgbChange('r', $event)"
                (mousedown)="startDrag('rgbR')"
                (mouseup)="endDrag('rgbR')"
                (touchstart)="startDrag('rgbR')"
                (touchend)="endDrag('rgbR')"
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
                [value]="localValues.rgbG"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onRgbChange('g', $event)"
                (mousedown)="startDrag('rgbG')"
                (mouseup)="endDrag('rgbG')"
                (touchstart)="startDrag('rgbG')"
                (touchend)="endDrag('rgbG')"
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
                [value]="localValues.rgbB"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onRgbChange('b', $event)"
                (mousedown)="startDrag('rgbB')"
                (mouseup)="endDrag('rgbB')"
                (touchstart)="startDrag('rgbB')"
                (touchend)="endDrag('rgbB')"
                class="slider rgb-slider blue"
              />
              <span>{{ light.rgb.b }}</span>
            </div>
            <div class="color-picker-container">
              <label>Color Picker:</label>
              <input
                type="color"
                [value]="rgbToHex(localValues.rgbR, localValues.rgbG, localValues.rgbB)"
                [disabled]="!light.isConnected || !light.isOn"
                (input)="onColorPickerChange($event)"
                (mousedown)="startDrag('colorPicker')"
                (mouseup)="endDrag('colorPicker')"
                (touchstart)="startDrag('colorPicker')"
                (touchend)="endDrag('colorPicker')"
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
      cursor: pointer;
    }

    .light-title:hover::after {
      content: ' ✏️';
      opacity: 0.7;
      font-size: 0.875rem;
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

    .name-input::selection {
      background: var(--accent-primary);
      color: white;
    }

    .name-input::-moz-selection {
      background: var(--accent-primary);
      color: white;
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
export class LightCardComponent implements OnDestroy, OnInit, OnChanges, AfterViewInit {
  @Input() light!: WizLight;
  @Output() togglePower = new EventEmitter<string>();
  @Output() brightnessChange = new EventEmitter<{lightId: string, brightness: number}>();
  @Output() colorTempChange = new EventEmitter<{lightId: string, colorTemp: number}>();
  @Output() rgbChange = new EventEmitter<{lightId: string, r: number, g: number, b: number}>();
  @Output() randomize = new EventEmitter<string>();
  @Output() nameChange = new EventEmitter<{lightId: string, name: string}>();

  @ViewChild('nameInput') nameInputRef!: ElementRef<HTMLInputElement>;

  // Queue-based command system properties
  private commandQueue: Array<{
    type: 'brightness' | 'colorTemp' | 'rgb',
    lightId: string,
    data: any,
    timestamp: number
  }> = [];
  private readonly MAX_QUEUE_SIZE = 3; // Keep only latest 3 commands
  private readonly QUEUE_PROCESS_INTERVAL_MS = 100; // Process every 100ms
  private queueProcessor: any;
  private isDragging = false;

  // Input-only slider tracking
  private dragState = {
    brightness: false,
    colorTemp: false,
    rgbR: false,
    rgbG: false,
    rgbB: false,
    colorPicker: false
  };
  private readonly DRAG_RELEASE_DELAY_MS = 500; // Allow updates 500ms after drag ends

  // Local slider values (input-only when dragging)
  public localValues = {
    brightness: 0,
    colorTemp: 4000,
    rgbR: 0,
    rgbG: 0,
    rgbB: 0
  };

  // Name editing properties
  public isEditingName = false;
  public editingName = '';
  private shouldSelectTextOnViewInit = false;

  constructor() {
    // Start queue processor
    this.queueProcessor = setInterval(() => {
      this.processCommandQueue();
    }, this.QUEUE_PROCESS_INTERVAL_MS);
  }

  ngOnInit(): void {
    this.updateLocalValues();
  }

  ngOnChanges(): void {
    this.updateLocalValues();
  }

  ngAfterViewInit(): void {
    if (this.shouldSelectTextOnViewInit) {
      this.shouldSelectTextOnViewInit = false;
      this.selectNameInputText();
    }
  }

  private updateLocalValues(): void {
    // Only update local values if not currently dragging the respective control
    if (!this.dragState.brightness) {
      this.localValues.brightness = this.light.isOn ? (this.light.brightness || 10) : 0;
    }
    if (!this.dragState.colorTemp) {
      this.localValues.colorTemp = this.light.colorTemp || 4000;
    }
    if (!this.dragState.rgbR && !this.dragState.colorPicker) {
      this.localValues.rgbR = this.light.rgb.r;
    }
    if (!this.dragState.rgbG && !this.dragState.colorPicker) {
      this.localValues.rgbG = this.light.rgb.g;
    }
    if (!this.dragState.rgbB && !this.dragState.colorPicker) {
      this.localValues.rgbB = this.light.rgb.b;
    }
  }

  private addToQueue(type: 'brightness' | 'colorTemp' | 'rgb', data: any): void {
    const command = {
      type,
      lightId: this.light.id,
      data,
      timestamp: Date.now()
    };

    // Remove any existing commands of the same type for this light
    this.commandQueue = this.commandQueue.filter(cmd =>
      !(cmd.type === type && cmd.lightId === this.light.id)
    );

    // Add new command
    this.commandQueue.push(command);

    // Keep queue size under control (FIFO - remove oldest if too many)
    while (this.commandQueue.length > this.MAX_QUEUE_SIZE) {
      this.commandQueue.shift();
    }
  }

  private processCommandQueue(): void {
    if (this.commandQueue.length === 0) return;

    // Process the oldest command
    const command = this.commandQueue.shift();
    if (!command) return;

    // Emit the appropriate event
    switch (command.type) {
      case 'brightness':
        this.brightnessChange.emit({
          lightId: command.lightId,
          brightness: command.data.brightness
        });
        break;
      case 'colorTemp':
        this.colorTempChange.emit({
          lightId: command.lightId,
          colorTemp: command.data.colorTemp
        });
        break;
      case 'rgb':
        this.rgbChange.emit({
          lightId: command.lightId,
          r: command.data.r,
          g: command.data.g,
          b: command.data.b
        });
        break;
    }
  }

  // Drag tracking methods
  startDrag(control: 'brightness' | 'colorTemp' | 'rgbR' | 'rgbG' | 'rgbB' | 'colorPicker'): void {
    this.dragState[control] = true;
    this.isDragging = true;
  }

  endDrag(control: 'brightness' | 'colorTemp' | 'rgbR' | 'rgbG' | 'rgbB' | 'colorPicker'): void {
    // Delay clearing drag state to prevent immediate updates from light feedback
    setTimeout(() => {
      this.dragState[control] = false;
      // Check if any controls are still being dragged
      this.isDragging = Object.values(this.dragState).some(dragging => dragging);
    }, this.DRAG_RELEASE_DELAY_MS);
  }

  // Getter methods for input-only slider values
  get currentBrightness(): number {
    return this.light.isOn ? (this.light.brightness || 10) : 0;
  }

  get currentColorTemp(): number {
    return this.light.colorTemp || 4000;
  }

  get currentRgbR(): number {
    return this.light.rgb.r;
  }

  get currentRgbG(): number {
    return this.light.rgb.g;
  }

  get currentRgbB(): number {
    return this.light.rgb.b;
  }

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

    // Update local value immediately for responsive UI
    this.localValues.brightness = brightness;

    // Add to queue instead of immediate emit
    this.addToQueue('brightness', { brightness });
  }

  onColorTempChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const colorTemp = parseInt(target.value);

    // Update local value immediately for responsive UI
    this.localValues.colorTemp = colorTemp;

    // Add to queue instead of immediate emit
    this.addToQueue('colorTemp', { colorTemp });
  }

  onRgbChange(component: 'r' | 'g' | 'b', event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);

    // Update local values immediately for responsive UI
    if (component === 'r') this.localValues.rgbR = value;
    else if (component === 'g') this.localValues.rgbG = value;
    else if (component === 'b') this.localValues.rgbB = value;

    // Create RGB object using local values
    const newRgb = {
      r: this.localValues.rgbR,
      g: this.localValues.rgbG,
      b: this.localValues.rgbB
    };

    // Mark the specific RGB component as being dragged
    const dragKey = component === 'r' ? 'rgbR' : component === 'g' ? 'rgbG' : 'rgbB';
    this.dragState[dragKey] = true;
    this.isDragging = true;

    // Add to queue instead of using debounce timer
    this.addToQueue('rgb', newRgb);
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

    // Update local values immediately for responsive UI
    this.localValues.rgbR = rgb.r;
    this.localValues.rgbG = rgb.g;
    this.localValues.rgbB = rgb.b;

    // Mark color picker as being used to prevent feedback from RGB updates
    this.dragState.colorPicker = true;
    this.isDragging = true;

    // Use queue system like other controls
    this.addToQueue('rgb', rgb);
  }

  onRandomize(): void {
    // Clear any pending RGB commands since randomize is immediate
    this.commandQueue = this.commandQueue.filter(cmd =>
      !(cmd.type === 'rgb' && cmd.lightId === this.light.id)
    );

    this.randomize.emit(this.light.id);
  }

  // Name editing methods
  startEditingName(): void {
    if (!this.light.isConnected) return;

    this.isEditingName = true;
    this.editingName = this.light.name || '';
    this.shouldSelectTextOnViewInit = true;

    // Use multiple timing approaches to ensure text selection works
    this.selectNameInputText();
  }

  private selectNameInputText(): void {
    // Try immediately after view update
    setTimeout(() => {
      this.trySelectText();
    }, 0);

    // Backup attempt with longer delay
    setTimeout(() => {
      this.trySelectText();
    }, 50);

    // Final attempt with even longer delay
    setTimeout(() => {
      this.trySelectText();
    }, 150);
  }

  private trySelectText(): void {
    const input = this.nameInputRef?.nativeElement;
    if (input && this.isEditingName) {
      // Ensure input is visible and focused
      input.focus();

      // Multiple selection approaches for maximum compatibility
      input.select();
      input.setSelectionRange(0, input.value.length);

      // Force selection if the input is focused but not selected
      if (document.activeElement === input && input.selectionStart === input.selectionEnd) {
        input.select();
      }
    }
  }

  onInputFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    // Small delay to ensure the input is fully ready for selection
    setTimeout(() => {
      input.select();
      input.setSelectionRange(0, input.value.length);
    }, 10);
  }

  onInputClick(event: MouseEvent): void {
    const input = event.target as HTMLInputElement;
    // Select all text when clicking in the input field
    input.select();
    input.setSelectionRange(0, input.value.length);
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
    // Clean up queue processor
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
    }

    // Clear any remaining commands
    this.commandQueue = [];
  }
}
