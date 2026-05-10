/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Logo } from './components/Logo';
import { ConfirmModal } from './components/ConfirmModal';
import { ActionButton, ActionType, DeckState, PageState, ObsConfig } from './types';
import { DeckKey } from './components/DeckKey';
import { KeyConfigModal } from './components/KeyConfigModal';
import { PageConfigModal } from './components/PageConfigModal';
import { GlobalSettingsModal } from './components/GlobalSettingsModal';
import { runAIMacro, speakText } from './services/geminiService';
import { obsService } from './services/obsService';

const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 3;

const PageIcon = ({ page, size = 18, className = "" }: { page: PageState, size?: number, className?: string }) => {
  if (page.customIconData) {
    return <img src={page.customIconData} alt={page.name} style={{ width: size, height: size }} className={`object-contain ${className}`} />;
  }
  
  if (page.iconName && page.iconName.length <= 2) {
    return <span style={{ fontSize: size }} className={className}>{page.iconName}</span>;
  }
  
  const Icon = (Icons as any)[page.iconName || 'Layers'] || Icons.Layers;
  return <Icon size={size} className={className} />;
};

const generateBlankButtons = (rows: number, cols: number, pageId: string): ActionButton[] => 
  Array.from({ length: rows * cols }).map((_, i) => ({
    id: `btn-${pageId}-${i}-${Math.random().toString(36).substring(2, 7)}`,
    label: '',
    iconName: 'Layers',
    type: 'none',
    value: '',
    fontSize: 12,
    bgColor: '#1a1a1a',
    textColor: '#ffffff',
  }));

const INITIAL_PAGE_ID = 'page-1';
const INITIAL_BUTTONS = generateBlankButtons(DEFAULT_ROWS, DEFAULT_COLS, INITIAL_PAGE_ID);

// Pre-fill some defaults for demo
INITIAL_BUTTONS[0] = { ...INITIAL_BUTTONS[0], label: 'Youtube', type: 'url', value: 'https://youtube.com', iconName: 'Youtube', bgColor: '#FF0000', fontSize: 12 };
INITIAL_BUTTONS[1] = { ...INITIAL_BUTTONS[1], label: 'Google', type: 'url', value: 'https://google.com', iconName: 'Globe', bgColor: '#4285F4', fontSize: 12 };
INITIAL_BUTTONS[2] = { ...INITIAL_BUTTONS[2], label: 'Gemini IA', type: 'ai', value: 'O que você pode fazer por mim hoje?', iconName: 'Zap', bgColor: '#8E24AA', fontSize: 12 };
INITIAL_BUTTONS[3] = { ...INITIAL_BUTTONS[3], label: 'Relógio', type: 'clock', value: '', iconName: 'Clock', bgColor: '#333333', fontSize: 12 };
INITIAL_BUTTONS[4] = { ...INITIAL_BUTTONS[4], label: 'Mídia Play', type: 'media', value: 'play', iconName: 'Play', bgColor: '#4CAF50', fontSize: 12 };

const INITIAL_STATE: DeckState = {
  id: 'profile-default',
  name: 'Principal',
  pages: [{ id: INITIAL_PAGE_ID, name: 'Principal', buttons: INITIAL_BUTTONS }],
  currentPageIndex: 0,
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  orientation: 'auto',
  audioEnabled: true,
  audioVolume: 0.3,
  lastUpdated: Date.now(),
};

// Simple audio feedback hook
const useSoundFeedback = (enabled: boolean, volume: number) => {
  const playSound = useCallback((type: 'click' | 'success' | 'toggle' | 'error') => {
    if (!enabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    switch(type) {
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        break;
      case 'success':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        break;
      case 'toggle':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        break;
      case 'error':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        break;
    }
    
    oscillator.start();
    oscillator.stop(now + 0.2);
  }, [enabled, volume]);

  return playSound;
};

export default function App() {
  const [deck, setDeck] = useState<DeckState>(INITIAL_STATE);
  const [profiles, setProfiles] = useState<DeckState[]>([INITIAL_STATE]);
  const [activeProfileId, setActiveProfileId] = useState<string>(INITIAL_STATE.id);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [obsStatus, setObsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  const playSound = useSoundFeedback(deck.audioEnabled || false, deck.audioVolume || 0.3);

  // Sync with online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial load simulation for splash screen & pre-loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load from LocalStorage
  useEffect(() => {
    const sanitizeConfig = (rawDeck: any): DeckState => {
      if (!rawDeck.pages) return { ...INITIAL_STATE, ...rawDeck };
      
      const newPages = rawDeck.pages.map((page: PageState) => {
        const seenIds = new Set<string>();
        const buttons = page.buttons.map((btn, i) => {
          let id = btn.id;
          if (!id || seenIds.has(id)) {
            id = `btn-${page.id}-${i}-${Math.random().toString(36).substring(2, 7)}`;
          }
          seenIds.add(id);
          return { ...btn, id };
        });
        return { ...page, buttons };
      });
      
      return { 
        ...rawDeck, 
        id: rawDeck.id || `profile-${Math.random().toString(36).substring(2, 7)}`,
        name: rawDeck.name || 'Nova Configuração',
        pages: newPages 
      };
    };

    const saved = localStorage.getItem('stream_deck_config_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.profiles && parsed.activeProfileId) {
          const sanitizedProfiles = parsed.profiles.map(sanitizeConfig);
          setProfiles(sanitizedProfiles);
          setActiveProfileId(parsed.activeProfileId);
          const active = sanitizedProfiles.find((p: any) => p.id === parsed.activeProfileId) || sanitizedProfiles[0];
          setDeck(active);
          
          if (active.obsConfig?.address) {
            handleObsConnect(active.obsConfig);
          }
        }
      } catch (e) {
        console.error("Failed to load config", e);
      }
    } else {
      // Legacy support check
      const legacySaved = localStorage.getItem('stream_deck_config');
      if (legacySaved) {
        try {
          const parsed = JSON.parse(legacySaved);
          const sanitized = sanitizeConfig(parsed);
          const initialProfiles = [sanitized];
          setProfiles(initialProfiles);
          setActiveProfileId(sanitized.id);
          setDeck(sanitized);
          saveAll(initialProfiles, sanitized.id);
        } catch (e) {}
      }
    }
  }, []);

  const saveAll = useCallback((newProfiles: DeckState[], activeId: string) => {
    localStorage.setItem('stream_deck_config_v2', JSON.stringify({
      profiles: newProfiles,
      activeProfileId: activeId
    }));
  }, []);

  const saveConfig = useCallback((newDeck: DeckState) => {
    setDeck(newDeck);
    setProfiles(prev => {
      const updated = prev.map(p => p.id === newDeck.id ? { ...newDeck, lastUpdated: Date.now() } : p);
      saveAll(updated, newDeck.id);
      return updated;
    });
  }, [saveAll]);

  const switchProfile = (profileId: string) => {
    const target = profiles.find(p => p.id === profileId);
    if (target) {
      playSound('toggle');
      setActiveProfileId(profileId);
      setDeck(target);
      saveAll(profiles, profileId);
    }
  };

  const createProfile = (name: string) => {
    playSound('success');
    const newProfile: DeckState = {
      ...INITIAL_STATE,
      id: `profile-${Date.now()}`,
      name: name || `Perfil ${profiles.length + 1}`,
      lastUpdated: Date.now()
    };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
    switchProfile(newProfile.id);
  };

  const deleteProfile = (profileId: string) => {
    if (profiles.length <= 1) return;
    const newProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(newProfiles);
    if (activeProfileId === profileId) {
      switchProfile(newProfiles[0].id);
    } else {
      saveAll(newProfiles, activeProfileId);
    }
  };

  const handleObsConnect = async (config: ObsConfig) => {
    setObsStatus('connecting');
    try {
      const success = await obsService.connect(config.address, config.password);
      setObsStatus(success ? 'connected' : 'disconnected');
      if (!success) {
        const detail = obsService.getLastError();
        setAiResponse(`Erro de Conexão OBS: ${detail || 'Verifique o endereço e a senha.'}`);
      }
    } catch (e) {
      setObsStatus('disconnected');
      setAiResponse(`Erro crítico OBS: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleObsDisconnect = async () => {
    await obsService.disconnect();
    setObsStatus('disconnected');
    setAiResponse("OBS desconectado manualmente.");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;
      
      const newPages = deck.pages.map((page, index) => {
        if (index !== deck.currentPageIndex) return page;
        
        const oldIndex = page.buttons.findIndex((btn) => btn.id === activeId);
        const newIndex = page.buttons.findIndex((btn) => btn.id === overId);
        
        return {
          ...page,
          buttons: arrayMove(page.buttons, oldIndex, newIndex),
        };
      });
      
      saveConfig({ ...deck, pages: newPages });
    }
  };

  const handleKeyPress = async (id: string) => {
    const currentPage = deck.pages[deck.currentPageIndex];
    const btn = currentPage?.buttons.find(b => b.id === id);
    if (!btn || btn.type === 'none') return;

    // Play associated sound if exists
    if (btn.soundUrl) {
      const audio = new Audio(btn.soundUrl);
      audio.play().catch(e => console.warn("Failed to play sound", e));
    }

    switch (btn.type) {
      case 'url':
        if (btn.value) window.open(btn.value, '_blank');
        if (btn.returnToHome) {
          saveConfig({ ...deck, currentPageIndex: 0 });
        }
        break;
      case 'sound':
        // If sound was already played above by soundUrl, we don't need double play
        // but if type is just sound, we use btn.value as the sound URL
        if (!btn.soundUrl && btn.value) {
          const audio = new Audio(btn.value);
          audio.play().catch(e => console.error("Sound play failed", e));
        }
        break;
      case 'webhook':
        if (btn.value) {
          setIsLoading(true);
          try {
            await fetch(btn.value, { method: 'POST', mode: 'no-cors' });
            setAiResponse(`Webhook disparado para TikTok/OBS.`);
          } catch (e) {
            setAiResponse(`Erro ao disparar Webhook.`);
          }
          setIsLoading(false);
        }
        break;
      case 'ai':
        if (!isOnline) {
          setAiResponse("A IA requer conexão com a internet. Por favor, verifique sua conexão.");
          return;
        }
        setIsLoading(true);
        setAiResponse(null);
        const result = await runAIMacro(btn.value);
        setAiResponse(result);
        setIsLoading(false);
        break;
      case 'obs':
        if (btn.value) {
          const [command, param] = btn.value.split(':');
          if (command === 'SetCurrentProgramScene') {
            await obsService.call('SetCurrentProgramScene', { sceneName: param });
            setAiResponse(`OBS: Cena trocada para "${param}"`);
          } else if (command === 'ToggleInputMute') {
            await obsService.call('ToggleInputMute', { inputName: param });
            setAiResponse(`OBS: Mudo alternado para "${param}"`);
          } else {
            await obsService.call(command as any);
            setAiResponse(`OBS: Comando ${command} executado.`);
          }
        }
        break;
      case 'media':
        console.log(`Media action triggered: ${btn.value}`);
        break;
      case 'clock':
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeString = `Agora são ${hours} horas e ${minutes} minutos.`;
        if (isOnline) {
          speakText(timeString, 'Zephyr'); // Using Zephyr for a clean, modern feel
        } else {
          setAiResponse(timeString);
        }
        break;
    }
  };

  const handleUpdateKey = (updated: ActionButton) => {
    const newPages = deck.pages.map((p, idx) => {
      if (idx !== deck.currentPageIndex) return p;
      return {
        ...p,
        buttons: p.buttons.map(b => b.id === updated.id ? updated : b)
      };
    });
    saveConfig({ ...deck, pages: newPages });
    setEditingId(null);
  };

  const handleUpdatePage = (updated: PageState) => {
    const newPages = deck.pages.map((p, i) => i === editingPageIndex ? updated : p);
    saveConfig({ ...deck, pages: newPages });
    setEditingPageIndex(null);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  // Fullscreen trigger on first interaction if enabled
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (deck.fullscreen && !document.fullscreenElement) {
        toggleFullscreen();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    if (deck.fullscreen) {
      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('touchstart', handleFirstInteraction);
    }

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [deck.fullscreen, toggleFullscreen]);

  const handleGlobalSettingsSave = (
    rows: number, 
    cols: number, 
    obsConfig?: ObsConfig, 
    orientation?: 'auto' | 'portrait' | 'landscape', 
    fullscreen?: boolean,
    audioEnabled: boolean = true,
    audioVolume: number = 0.3
  ) => {
    // If grid size changed, we need to regenerate or pad buttons for all pages
    const gridChanged = rows !== deck.rows || cols !== deck.cols;
    
    let newPages = deck.pages;
    if (gridChanged) {
      newPages = deck.pages.map(page => {
        const currentButtons = [...page.buttons];
        const newButtons = generateBlankButtons(rows, cols, page.id);
        
        // Map old buttons to new positions if they fit
        for (let r = 0; r < Math.min(rows, deck.rows); r++) {
          for (let c = 0; c < Math.min(cols, deck.cols); c++) {
            const oldIdx = r * deck.cols + c;
            const newIdx = r * cols + c;
            if (currentButtons[oldIdx]) {
              newButtons[newIdx] = currentButtons[oldIdx];
            }
          }
        }
        return { ...page, buttons: newButtons };
      });
    }

    const updatedDeck = {
      ...deck,
      rows,
      cols,
      orientation,
      fullscreen,
      audioEnabled,
      audioVolume,
      pages: newPages,
      obsConfig
    };

    saveConfig(updatedDeck);
    setIsGlobalSettingsOpen(false);

    if (fullscreen && !document.fullscreenElement) {
      toggleFullscreen();
    } else if (!fullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (obsConfig) {
      handleObsConnect(obsConfig);
    }
  };

  const addPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage: PageState = {
      id: newId,
      name: `Página ${deck.pages.length + 1}`,
      buttons: generateBlankButtons(deck.rows, deck.cols, newId)
    };
    saveConfig({
      ...deck,
      pages: [...deck.pages, newPage],
      currentPageIndex: deck.pages.length
    });
  };

  const removePage = (index: number, force = false) => {
    // Garantir que sempre haja pelo menos uma página
    if (deck.pages.length <= 1) {
      alert("Você deve ter pelo menos uma página no seu Deck.");
      return;
    }
    
    const executeRemove = () => {
      const newPages = deck.pages.filter((_, i) => i !== index);
      
      // Ajustar o índice da página atual
      let newIndex = deck.currentPageIndex;
      if (index === deck.currentPageIndex) {
        newIndex = Math.max(0, index - 1);
      } else if (index < deck.currentPageIndex) {
        newIndex = deck.currentPageIndex - 1;
      }
      
      const updatedDeck = {
        ...deck,
        pages: newPages,
        currentPageIndex: newIndex
      };
      
      saveConfig(updatedDeck);
      setEditingPageIndex(null);
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    };

    if (!force) {
      setConfirmConfig({
        isOpen: true,
        title: 'Excluir Página?',
        message: 'Todos os botões configurados nesta página serão perdidos permanentemente.',
        onConfirm: executeRemove
      });
      return;
    }
    
    executeRemove();
  };

  const currentPage = deck.pages[deck.currentPageIndex] || deck.pages[0];
  const editingButton = currentPage.buttons.find(b => b.id === editingId);
  const editingPage = editingPageIndex !== null ? deck.pages[editingPageIndex] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Splash Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] gap-8"
          >
            <div className="absolute inset-0 bg-[#050505] opacity-90" />
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-[#00f3ff] to-[#bc13fe] rounded-[32px] shadow-[0_0_50px_rgba(0,243,255,0.4)] flex items-center justify-center transform rotate-12">
                <Icons.Zap fill="white" size={40} className="text-white -rotate-12" />
              </div>
              <div className="absolute -inset-4 bg-cyan-500/20 blur-2xl rounded-full -z-10 animate-pulse" />
            </motion.div>
            
            <div className="flex flex-col items-center gap-4 relative z-10">
              <h1 className="text-3xl font-black text-white uppercase italic tracking-[0.5em] translate-x-[0.25em]">
                Deck<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bc13fe]">Flow</span>
              </h1>
              <div className="w-40 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] animate-pulse">
                {isOnline ? 'Iniciando Dashboard...' : 'Iniciando em Modo Off-line...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-[100dvh] overflow-hidden">
        {/* Mobile-Friendly Header */}
        <header className="px-4 md:px-8 py-3 md:py-6 flex flex-col sm:flex-row justify-between items-center bg-[#080808]/80 border-b border-white/10 backdrop-blur-3xl gap-3 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Logo size="md" />
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-black tracking-[-0.05em] text-white uppercase italic leading-none flex items-center gap-2">
                Virtual <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bc13fe]">Stream Deck</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] md:text-[10px] font-black text-[#00f3ff] uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">Core v2.5</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em]">AI Powered</span>
              </div>
            </div>
            
            {/* Mobile Settings Icon */}
            <div className="sm:hidden flex gap-2">
               <button onClick={() => setIsGlobalSettingsOpen(true)} className="p-2 bg-white/5 rounded-lg text-gray-400">
                 <Icons.Settings size={18} />
               </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6 w-full sm:w-auto">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all ${isOnline ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/30'} shrink-0`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
              <span className={`text-[8px] md:text-[9px] font-black uppercase ${isOnline ? 'text-gray-400' : 'text-red-400'}`}>
                {isOnline ? 'Online' : 'Off-line'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-full border border-white/10 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${obsStatus === 'connected' ? 'bg-green-500' : obsStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-400">OBS</span>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-base md:text-2xl font-mono font-light text-blue-400 leading-none">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsGlobalSettingsOpen(true)}
                className="hidden sm:flex p-2 bg-white/5 hover:bg-blue-600 rounded-xl text-gray-400 hover:text-white transition-all shadow-lg active:scale-90"
              >
                <Icons.Settings size={18} />
              </button>

              <button 
                onClick={() => {
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Limpar Deck?',
                    message: 'Isso irá apagar todas as suas páginas e configurações. Esta ação não pode ser desfeita.',
                    onConfirm: () => {
                      saveConfig(INITIAL_STATE);
                      localStorage.removeItem('stream_deck_config');
                      window.location.reload();
                    }
                  });
                }}
                className="p-2 bg-red-600/10 hover:bg-red-600 rounded-xl text-red-500 hover:text-white transition-all"
              >
                <Icons.Trash2 size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Interface */}
        <main className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 lg:p-10 gap-4 md:gap-10 overflow-hidden relative">
          
          {/* Deck Grid Section */}
          <section className="flex-1 flex items-center justify-center bg-matte-black/40 rounded-[24px] sm:rounded-[32px] md:rounded-[50px] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] p-2 md:py-6 md:px-12 relative overflow-hidden backdrop-blur-2xl min-h-0">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-[#00f3ff]/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-[#bc13fe]/5 blur-[120px] pointer-events-none" />
            
            <div className="w-full h-full flex items-center justify-center overflow-hidden z-10">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isLoading ? (
                    <div 
                      key="skeleton"
                      className="grid gap-4 mx-auto w-full p-8"
                      style={{
                        gridTemplateColumns: `repeat(${deck.cols}, minmax(32px, 1fr))`,
                        maxWidth: '100%',
                        width: `calc(min(100% - 1rem, ${deck.cols * 110}px))`
                      }}
                    >
                      {Array.from({ length: deck.cols * deck.rows }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-full aspect-[1.3/1] bg-white/[0.03] rounded-[24px] animate-pulse border border-white/5"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      key={deck.currentPageIndex}
                      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', y: 20 }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', y: -20 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className={`grid gap-1.5 sm:gap-2 md:gap-4 mx-auto w-full h-full max-h-full items-center justify-center content-center no-scrollbar overflow-auto p-2 sm:p-4 md:p-8 will-change-transform overscroll-contain touch-pan-x touch-pan-y ${
                        deck.orientation === 'portrait' ? 'max-w-[480px]' : 
                        deck.orientation === 'landscape' ? 'max-w-none' : ''
                      }`}
                      style={{
                        gridTemplateColumns: `repeat(${deck.cols}, minmax(0, 1fr))`,
                        maxWidth: '100%',
                        width: `calc(min(100%, ${deck.cols * 120}px))`
                      }}
                    >
                      <SortableContext 
                        items={currentPage.buttons.map(b => b.id)} 
                        strategy={rectSortingStrategy}
                      >
                        {currentPage.buttons.map((btn, i) => (
                          <motion.div
                            key={btn.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.01, duration: 0.3 }}
                          >
                            <DeckKey 
                              button={btn.type === 'clock' ? { ...btn, label: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : btn} 
                              onPress={(id) => {
                                playSound('click');
                                handleKeyPress(id);
                              }}
                              onConfig={(id) => setEditingId(id)}
                            />
                          </motion.div>
                        ))}
                      </SortableContext>
                    </motion.div>
                  )}
                </AnimatePresence>
              </DndContext>
            </div>

            {/* Grid size markers */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 text-[7px] md:text-[9px] text-gray-500 uppercase tracking-[0.3em] font-black opacity-40 whitespace-nowrap bg-white/5 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
              <span>{deck.cols} COLUNAS</span>
              <span className="w-1 h-1 bg-blue-500 rounded-full my-auto" />
              <span>{deck.rows} LINHAS</span>
            </div>
          </section>
        </main>

        {/* Floating Bottom Navigation Dock */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4 sm:px-8 pointer-events-none">
          <div className="bg-[#080808]/90 backdrop-blur-3xl border border-white/10 p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2 sm:gap-4 px-2 max-w-[95vw] overflow-x-auto no-scrollbar py-1">
              {deck.pages.map((page, idx) => (
                <div key={page.id} className="relative group shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => saveConfig({ ...deck, currentPageIndex: idx })}
                    onDoubleClick={() => setEditingPageIndex(idx)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border duration-500 overflow-hidden ${
                      idx === deck.currentPageIndex 
                        ? 'border-[#00f3ff]/40 text-white bg-[#00f3ff]/10' 
                        : 'border-white/5 text-gray-500/50 hover:text-gray-300 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <PageIcon 
                      page={page} 
                      size={24}
                      className={idx === deck.currentPageIndex ? 'text-[#00f3ff] drop-shadow-glow-blue scale-110' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80'} 
                    />
                    <span 
                      className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.1em] truncate w-full px-2 text-center transition-opacity duration-300 ${idx === deck.currentPageIndex ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-40'}`}
                    >
                      {page.name}
                    </span>
                    
                    {idx === deck.currentPageIndex && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-t-full shadow-[0_0_10px_rgba(0,243,255,0.8)]" 
                        style={{ backgroundColor: page.bgColor || '#00f3ff' }}
                      />
                    )}
                  </motion.button>

                  {/* Tab Actions Overlay */}
                  <div className={`absolute -top-1.5 -right-1.5 flex gap-1 transition-all duration-300 z-10 ${
                    idx === deck.currentPageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
                  }`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingPageIndex(idx); }}
                      className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-500 transition-colors"
                      title="Configurar Página"
                    >
                      <Icons.Edit3 size={10} />
                    </button>
                    {deck.pages.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                        className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Icons.X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="w-[1px] h-10 bg-white/10 mx-4 md:mx-6" />

              <button 
                onClick={addPage}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl border border-dashed border-white/20 text-gray-600 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center active:scale-90"
                title="Nova Página"
              >
                <Icons.Plus className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button 
                onClick={() => setIsGlobalSettingsOpen(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center active:scale-90"
                title="Configurações Gerais"
              >
                <Icons.Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Modals */}
      {editingButton && (
        <KeyConfigModal 
          button={editingButton}
          onSave={handleUpdateKey}
          onClose={() => setEditingId(null)}
        />
      )}

      {editingPage && (
        <PageConfigModal
          page={editingPage}
          onSave={handleUpdatePage}
          onRemove={() => removePage(editingPageIndex as number, true)}
          onClose={() => setEditingPageIndex(null)}
        />
      )}

      {isGlobalSettingsOpen && (
        <GlobalSettingsModal
          deck={deck}
          logs={aiResponse}
          obsStatus={obsStatus}
          onSave={handleGlobalSettingsSave}
          onDisconnectObs={handleObsDisconnect}
          profiles={profiles}
          onSwitchProfile={switchProfile}
          onCreateProfile={createProfile}
          onDeleteProfile={deleteProfile}
          onClose={() => setIsGlobalSettingsOpen(false)}
        />
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
