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
import { ActionButton, ActionType, DeckState, PageState, ObsConfig } from './types';
import { DeckKey } from './components/DeckKey';
import { KeyConfigModal } from './components/KeyConfigModal';
import { PageConfigModal } from './components/PageConfigModal';
import { GlobalSettingsModal } from './components/GlobalSettingsModal';
import { runAIMacro } from './services/geminiService';
import { obsService } from './services/obsService';

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 5;

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
    bgColor: '#1a1a1a',
    textColor: '#ffffff',
  }));

const INITIAL_PAGE_ID = 'page-1';
const INITIAL_BUTTONS = generateBlankButtons(DEFAULT_ROWS, DEFAULT_COLS, INITIAL_PAGE_ID);

// Pre-fill some defaults for demo
INITIAL_BUTTONS[0] = { ...INITIAL_BUTTONS[0], label: 'Youtube', type: 'url', value: 'https://youtube.com', iconName: 'Youtube', bgColor: '#FF0000' };
INITIAL_BUTTONS[1] = { ...INITIAL_BUTTONS[1], label: 'Google', type: 'url', value: 'https://google.com', iconName: 'Globe', bgColor: '#4285F4' };
INITIAL_BUTTONS[2] = { ...INITIAL_BUTTONS[2], label: 'Gemini IA', type: 'ai', value: 'O que você pode fazer por mim hoje?', iconName: 'Zap', bgColor: '#8E24AA' };
INITIAL_BUTTONS[3] = { ...INITIAL_BUTTONS[3], label: 'Relógio', type: 'clock', value: '', iconName: 'Clock', bgColor: '#333333' };
INITIAL_BUTTONS[4] = { ...INITIAL_BUTTONS[4], label: 'Mídia Play', type: 'media', value: 'play', iconName: 'Play', bgColor: '#4CAF50' };

const INITIAL_STATE: DeckState = {
  pages: [{ id: INITIAL_PAGE_ID, name: 'Principal', buttons: INITIAL_BUTTONS }],
  currentPageIndex: 0,
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
};

export default function App() {
  const [deck, setDeck] = useState<DeckState>(INITIAL_STATE);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [obsStatus, setObsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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
      if (!rawDeck.pages) return rawDeck;
      
      const newPages = rawDeck.pages.map((page: PageState) => {
        const seenIds = new Set<string>();
        const buttons = page.buttons.map((btn, i) => {
          let id = btn.id;
          // If ID is missing, duplicated, or looks like the old non-unique format, regenerate
          if (!id || seenIds.has(id)) {
            id = `btn-${page.id}-${i}-${Math.random().toString(36).substring(2, 7)}`;
          }
          seenIds.add(id);
          return { ...btn, id };
        });
        return { ...page, buttons };
      });
      
      return { ...rawDeck, pages: newPages };
    };

    const saved = localStorage.getItem('stream_deck_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migration logic: if it's the old format (flat buttons), convert to pages
        if (parsed.buttons && !parsed.pages) {
          const migrated: DeckState = sanitizeConfig({
            pages: [{ id: 'page-migrated', name: 'Principal', buttons: parsed.buttons }],
            currentPageIndex: 0,
            rows: parsed.rows || DEFAULT_ROWS,
            cols: parsed.cols || DEFAULT_COLS,
          });
          setDeck(migrated);
          localStorage.setItem('stream_deck_config', JSON.stringify(migrated));
        } else if (parsed.pages) {
          const sanitized = sanitizeConfig(parsed);
          setDeck(sanitized);
          // Try auto connect OBS if configured
          if (sanitized.obsConfig?.address) {
            handleObsConnect(sanitized.obsConfig);
          }
        }
      } catch (e) {
        console.error("Failed to load config", e);
      }
    }
  }, []);

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

  // Timer for clock buttons
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveConfig = useCallback((newDeck: DeckState) => {
    setDeck(newDeck);
    localStorage.setItem('stream_deck_config', JSON.stringify(newDeck));
  }, []);

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

  const handleGlobalSettingsSave = (rows: number, cols: number, obsConfig?: ObsConfig) => {
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
      pages: newPages,
      obsConfig
    };

    saveConfig(updatedDeck);
    setIsGlobalSettingsOpen(false);

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
    
    if (!force && !window.confirm('Deseja excluir esta página permanentemente? Todos os botões configurados nela serão perdidos.')) {
      return;
    }
    
    const newPages = deck.pages.filter((_, i) => i !== index);
    
    // Ajustar o índice da página atual
    let newIndex = deck.currentPageIndex;
    if (index === deck.currentPageIndex) {
      // Se estamos excluindo a página atual, vamos para a anterior ou para a primeira disponível
      newIndex = Math.max(0, index - 1);
    } else if (index < deck.currentPageIndex) {
      // Se excluimos uma página anterior à atual, o índice atual diminui
      newIndex = deck.currentPageIndex - 1;
    }
    
    const updatedDeck = {
      ...deck,
      pages: newPages,
      currentPageIndex: newIndex
    };
    
    saveConfig(updatedDeck);
    setEditingPageIndex(null);
  };

  const currentPage = deck.pages[deck.currentPageIndex] || deck.pages[0];
  const editingButton = currentPage.buttons.find(b => b.id === editingId);
  const editingPage = editingPageIndex !== null ? deck.pages[editingPageIndex] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-blue-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-[100dvh] overflow-hidden">
        {/* Mobile-Friendly Header */}
        <header className="px-4 md:px-8 py-3 md:py-6 flex flex-col sm:flex-row justify-between items-center bg-black/40 border-b border-white/5 backdrop-blur-xl gap-3 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Logo size="md" />
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-black tracking-[-0.05em] text-white uppercase italic leading-none flex items-center gap-2">
                Virtual <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Stream Deck</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Core v2.5</span>
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
                  if(confirm('Limpar todas as configurações?')) {
                    saveConfig(INITIAL_STATE);
                    localStorage.removeItem('stream_deck_config');
                    window.location.reload();
                  }
                }}
                className="p-2 bg-red-600/10 hover:bg-red-600 rounded-xl text-red-500 hover:text-white transition-all"
              >
                <Icons.Trash2 size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Tabs */}
        <div className="px-4 md:px-8 py-3 bg-black/40 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            {deck.pages.map((page, idx) => (
              <div key={page.id} className="relative group flex-shrink-0">
                <button
                  onClick={() => saveConfig({ ...deck, currentPageIndex: idx })}
                  onDoubleClick={() => setEditingPageIndex(idx)}
                  className={`relative w-24 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border duration-300 ${
                    idx === deck.currentPageIndex 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]' 
                      : 'bg-[#1a1a1a] border-white/10 text-gray-500 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <PageIcon 
                    page={page} 
                    className={idx === deck.currentPageIndex ? 'text-blue-400' : 'opacity-40'} 
                  />
                  <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full px-2 text-center">
                    {page.name}
                  </span>
                  
                  {idx === deck.currentPageIndex && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                </button>

                {/* Tab Actions */}
                <div className={`absolute -top-2 -right-2 flex gap-1 transition-transform z-20 ${
                  idx === deck.currentPageIndex ? 'scale-100' : 'scale-0 group-hover:scale-100'
                }`}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingPageIndex(idx); }}
                    className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-500 transition-colors"
                    title="Configurar Página"
                  >
                    <Icons.Edit3 size={10} />
                  </button>
                  {deck.pages.length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                      className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Icons.X size={10} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button 
              onClick={addPage}
              className="w-16 h-16 rounded-2xl border border-dashed border-white/20 text-gray-600 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-1"
            >
              <Icons.Plus size={20} />
              <span className="text-[8px] font-bold uppercase">Novo</span>
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <main className="flex-1 flex flex-col p-2 md:p-6 gap-3 md:gap-6 overflow-hidden">
          
          {/* Deck Grid Section */}
          <section className="flex-1 flex items-center justify-center bg-black/40 rounded-[24px] md:rounded-[40px] border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] p-1 md:p-8 relative overflow-hidden">
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={deck.currentPageIndex}
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="grid gap-2 sm:gap-3 md:gap-4 mx-auto w-full max-h-full items-center justify-center content-center no-scrollbar overflow-auto p-4"
                    style={{
                      gridTemplateColumns: `repeat(${deck.cols}, minmax(32px, 1fr))`,
                      maxWidth: '100%',
                      width: `calc(min(100% - 1rem, ${deck.cols * 100}px))`
                    }}
                  >
                    <SortableContext 
                      items={currentPage.buttons.map(b => b.id)}
                      strategy={rectSortingStrategy}
                    >
                      {currentPage.buttons.map((btn) => (
                        <DeckKey 
                          key={btn.id} 
                          button={btn.type === 'clock' ? { ...btn, label: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : btn} 
                          onPress={handleKeyPress}
                          onConfig={(id) => setEditingId(id)}
                        />
                      ))}
                    </SortableContext>
                  </motion.div>
                </AnimatePresence>
              </DndContext>
            </div>

            {/* Grid size markers */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4 text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-30 whitespace-nowrap bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
              <span>{deck.cols} COLUNAS</span>
              <span className="text-blue-500">•</span>
              <span>{deck.rows} LINHAS</span>
            </div>
          </section>
        </main>
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
          onClose={() => setIsGlobalSettingsOpen(false)}
        />
      )}
    </div>
  );
}
