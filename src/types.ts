
import { LucideIcon } from 'lucide-react';

export type ActionType = 'url' | 'media' | 'ai' | 'script' | 'none' | 'clock' | 'counter' | 'sound' | 'webhook' | 'obs';

export interface ActionButton {
  id: string;
  label: string;
  iconName: string;
  customIconData?: string; // Base64 data for custom image icon
  type: ActionType;
  value: string; // URL, prompt, webhook-url, obs-command, etc.
  returnToHome?: boolean; // Return to main page after action
  soundUrl?: string; // Optional sound to play on click
  bgColor: string;
  textColor: string;
  fontSize?: number;
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
  bgColor?: string;
  fontSize?: number;
  customIconData?: string;
  buttons: ActionButton[];
}

export interface DeckState {
  id: string; // Unique ID for the profile/deck
  name: string; // Name of the profile
  pages: PageState[];
  currentPageIndex: number;
  rows: number;
  cols: number;
  orientation?: 'auto' | 'portrait' | 'landscape';
  fullscreen?: boolean;
  obsConfig?: ObsConfig;
  audioEnabled?: boolean;
  audioVolume?: number;
  lastUpdated?: number;
}

export interface AppConfig {
  activeProfileId: string;
  profiles: DeckState[];
  isOfflineModePreferred?: boolean;
}
