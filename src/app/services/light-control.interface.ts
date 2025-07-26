import { Observable } from 'rxjs';
import { WizLight } from '../models/wiz-light.interface';

export interface LightControlService {
  lights$: Observable<WizLight[]>;
  discoverLights(): Observable<WizLight[]>;
  toggleLight(lightId: string): Promise<boolean>;
  setBrightness(lightId: string, brightness: number): Promise<boolean>;
  setColorTemp(lightId: string, temp: number): Promise<boolean>;
  setRGB(lightId: string, r: number, g: number, b: number): Promise<boolean>;
  setRandomColor(lightId: string): Promise<boolean>;
  updateLightName(lightId: string, newName: string): boolean;
  getLights(): WizLight[];
  getLight(lightId: string): WizLight | undefined;
}
