
import { LucideIcon } from 'lucide-react';

export type ActionType = 'url' | 'media' | 'ai' | 'script' | 'none' | 'clock' | 'counter' | 'sound' | 'webhook' | 'obs';

export interface ActionButton {
  id: string;
  label: string;
  iconName: string;
  customIconData?: string; // Base64 data for custom image icon
  type: ActionType;
  value: string; // URL, prompt, webhook-url, obs-command, etc.
  soundUrl?: string; // Optional sound to play on click
  bgColor: string;
  textColor: string;
}

export interface ObsConfig {
  address: string;
  password?: string;
  connected: boolean;
}

export interface PageState {
  id: string;
  name: string;
  iconName?: string;
  customIconData?: string;
  buttons: ActionButton[];
}

export interface DeckState {
  pages: PageState[];
  currentPageIndex: number;
  rows: number;
  cols: number;
  orientation?: 'auto' | 'portrait' | 'landscape';
  obsConfig?: ObsConfig;
}
