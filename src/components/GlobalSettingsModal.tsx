import React, { useState } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Logo } from './Logo';
import { QRScanner } from './QRScanner';
import { ConfirmModal } from './ConfirmModal';
import { DeckState, ObsConfig } from '../types';

interface GlobalSettingsModalProps {
  deck: DeckState;
  logs?: string | null;
  obsStatus: 'disconnected' | 'connecting' | 'connected';
  profiles: DeckState[];
  onSwitchProfile: (id: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  onSave: (rows: number, cols: number, obsConfig?: ObsConfig, orientation?: 'auto' | 'portrait' | 'landscape', fullscreen?: boolean, audioEnabled?: boolean, audioVolume?: number) => void;
  onDisconnectObs: () => void;
  onClose: () => void;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ 
  deck, logs, obsStatus, profiles, onSwitchProfile, onCreateProfile, onDeleteProfile, onSave, onDisconnectObs, onClose 
}) => {
  const [rows, setRows] = useState(deck.rows);
  const [cols, setCols] = useState(deck.cols);
  const [obsAddress, setObsAddress] = useState(deck.obsConfig?.address || 'ws://127.0.0.1:4455');
  const [obsPassword, setObsPassword] = useState(deck.obsConfig?.password || '');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>(deck.orientation || 'auto');
  const [fullscreen, setFullscreen] = useState(deck.fullscreen || false);
  const [audioEnabled, setAudioEnabled] = useState(deck.audioEnabled !== false);
  const [audioVolume, setAudioVolume] = useState(deck.audioVolume || 0.3);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(deck, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `deckflow-profile-${deck.name.toLowerCase().replace(/\s/g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed.pages && parsed.rows) {
            onCreateProfile(parsed.name || 'Importado');
            onSave(parsed.rows, parsed.cols, parsed.obsConfig, parsed.orientation, parsed.fullscreen);
          }
        } catch (error) {
          alert('Arquivo inválido.');
        }
      };
      reader.readAsText(file);
    }
  };
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

  const handleObsResetConnection = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Resetar Conexão?',
      message: 'Isso voltará o endereço para o padrão (localhost) e limpará a senha salva.',
      onConfirm: () => {
        setObsAddress('ws://127.0.0.1:4455');
        setObsPassword('');
        setShowResetSuccess(true);
        setTimeout(() => setShowResetSuccess(false), 3000);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleScanResult = (data: string) => {
    try {
      // Tenta JSON (padrão de alguns apps)
      const parsed = JSON.parse(data);
      if (parsed.address || parsed.host) {
        const addr = parsed.address || (parsed.port ? `ws://${parsed.host}:${parsed.port}` : parsed.host);
        if (addr) setObsAddress(addr);
        if (parsed.password) setObsPassword(parsed.password);
      } else {
        // Se for só uma string mas JSON, talvez seja o password?
        setObsPassword(data);
      }
    } catch (e) {
      // Tenta formato pipe: address|password
      if (data.includes('|')) {
        const [addr, pass] = data.split('|');
        if (addr.includes('://')) {
          setObsAddress(addr.trim());
          if (pass) setObsPassword(pass.trim());
        }
      } 
      // Se começar com ws:// é o endereço
      else if (data.startsWith('ws://') || data.startsWith('wss://')) {
        setObsAddress(data.trim());
      }
      // Caso contrário, assume que é a senha se o endereço já estiver preenchido, ou vice-versa
      else {
        setObsPassword(data.trim());
      }
    }
    setIsQRScannerOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#252525]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Settings className="text-blue-400" />
            Configurações Gerais
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <Icons.X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto no-scrollbar">
          {/* Profile Management Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Perfis (Modo Off-line)</h3>
              <div className="flex gap-2">
                <label className="cursor-pointer text-[9px] font-black text-blue-400 px-2 py-1 bg-blue-500/10 rounded-md uppercase tracking-wider hover:bg-blue-500/20 transition-all flex items-center gap-1">
                  <Icons.Upload size={10} />
                  Importar
                  <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                </label>
                <button 
                  onClick={handleExport}
                  className="text-[9px] font-black text-blue-400 px-2 py-1 bg-blue-500/10 rounded-md uppercase tracking-wider hover:bg-blue-500/20 transition-all flex items-center gap-1"
                >
                  <Icons.Download size={10} />
                  Exportar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {profiles.map(p => (
                  <div key={p.id} className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${deck.id === p.id ? 'bg-blue-600/10 border-blue-500/40' : 'bg-black/20 border-white/5'}`}>
                    <button 
                      onClick={() => onSwitchProfile(p.id)}
                      className="flex-1 flex flex-col items-start px-2"
                    >
                      <span className={`text-[11px] font-bold ${deck.id === p.id ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                      <span className="text-[8px] text-gray-600 uppercase tracking-wider">{p.pages.length} Páginas • {p.rows}x{p.cols}</span>
                    </button>
                    {profiles.length > 1 && (
                      <button 
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Excluir Perfil?',
                            message: `Deseja realmente excluir o perfil "${p.name}"?`,
                            onConfirm: () => {
                              onDeleteProfile(p.id);
                              setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                            }
                          });
                        }}
                        className="p-2 text-gray-600 hover:text-red-500"
                      >
                        <Icons.Trash size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isCreatingProfile ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Nome do perfil..."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onCreateProfile(newProfileName);
                        setIsCreatingProfile(false);
                        setNewProfileName('');
                      }
                    }}
                  />
                  <button onClick={() => setIsCreatingProfile(false)} className="p-2 text-gray-500 hover:text-white"><Icons.X size={18}/></button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsCreatingProfile(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-blue-400 hover:border-blue-500/30 transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                  <Icons.Plus size={14} />
                  Novo Perfil
                </button>
              )}
            </div>
          </div>

          {/* Audio Feedback Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Interação e Som</h3>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white">Sons de Interface</span>
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest">Feedback sonoro ao clicar</span>
                </div>
                <button 
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${audioEnabled ? 'bg-blue-600' : 'bg-zinc-800'}`}
                >
                  <motion.div 
                    animate={{ x: audioEnabled ? 26 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              {audioEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Volume</span>
                    <span>{Math.round(audioVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Brand Identity */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-600/10 to-transparent rounded-[32px] border border-blue-500/10 mb-2 shadow-inner">
            <Logo size="lg" className="mb-4" />
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Virtual <span className="text-blue-500">Stream Deck</span></h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">Sua Central de Comando</p>
          </div>

          {/* Grid Configuration */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Layout do Grid</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Linhas</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setRows(Math.max(1, rows - 1))} className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10">-</button>
                  <span className="flex-1 text-center text-white font-bold">{rows}</span>
                  <button onClick={() => setRows(Math.min(6, rows + 1))} className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10">+</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Colunas</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCols(Math.max(1, cols - 1))} className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10">-</button>
                  <span className="flex-1 text-center text-white font-bold">{cols}</span>
                  <button onClick={() => setCols(Math.min(10, cols + 1))} className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10">+</button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 italic">* Alterar o grid pode resetar a posição de alguns botões.</p>
          </div>

          {/* Orientation Setting */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Orientação do Display</h3>
            <div className="flex gap-2">
              {[
                { id: 'auto', label: 'Automático', icon: Icons.Maximize },
                { id: 'portrait', label: 'Retrato', icon: Icons.Smartphone },
                { id: 'landscape', label: 'Paisagem', icon: Icons.Monitor }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setOrientation(opt.id as any)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    orientation === opt.id 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10' 
                      : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                  }`}
                >
                  <opt.icon size={18} className={orientation === opt.id ? 'text-blue-400' : 'text-gray-600'} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Controla como o grid se adapta ao tamanho da tela. "Retrato" limita a largura para telas móveis.
            </p>
          </div>

          {/* Fullscreen Setting */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Exibição</h3>
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <Icons.Maximize2 className={fullscreen ? 'text-blue-400' : 'text-gray-600'} size={18} />
                <div>
                  <span className="block text-[10px] font-black text-white uppercase tracking-wider">Modo Tela Cheia</span>
                  <span className="block text-[9px] text-gray-500">Inicia o app ocupando toda a tela.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(!fullscreen)}
                className={`w-10 h-5 rounded-full relative transition-colors ${fullscreen ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${fullscreen ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>


          {/* OBS Integration */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-purple-500 uppercase tracking-[0.2em]">Integração OBS Studio</h3>
              <div className="flex gap-2">
                {obsStatus === 'connected' && (
                  <button 
                    onClick={onDisconnectObs}
                    className="text-[9px] font-black text-yellow-500 px-2 py-1 bg-yellow-500/10 rounded-md uppercase tracking-wider hover:bg-yellow-500/20 transition-all flex items-center gap-1"
                  >
                    <Icons.Unplug size={10} />
                    Desconectar
                  </button>
                )}
                <button 
                  onClick={() => setIsQRScannerOpen(true)}
                  className="text-[9px] font-black text-purple-500 px-2 py-1 bg-purple-500/10 rounded-md uppercase tracking-wider hover:bg-purple-500/20 transition-all flex items-center gap-1 active:scale-95"
                >
                  <Icons.QrCode size={10} />
                  Escanear
                </button>
                <button 
                  onClick={handleObsResetConnection}
                  className="text-[9px] font-black text-red-500 px-2 py-1 bg-red-500/10 rounded-md uppercase tracking-wider hover:bg-red-500/20 transition-all flex items-center gap-1 active:scale-95"
                >
                  <Icons.RefreshCcw size={10} className={showResetSuccess ? "animate-spin" : ""} />
                  {showResetSuccess ? "Resetado!" : "Resetar"}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Endereço WebSocket</label>
                <input
                  type="text"
                  value={obsAddress}
                  onChange={(e) => setObsAddress(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="ws://127.0.0.1:4455"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Senha (Opcional)</label>
                <input
                  type="password"
                  value={obsPassword}
                  onChange={(e) => setObsPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="Sua senha do OBS"
                />
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Icons.Info size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Ajustes de Conexão OBS:</span>
                </div>
                <div className="text-[9px] text-gray-400 space-y-2 leading-tight">
                  <p>1. **Ativar WebSocket**: No OBS {'>'} Ferramentas {'>'} Configuracões do Servidor WebSocket {'>'} Habilitar.</p>
                  <p>2. **Porta Padrão**: Use <strong>4455</strong>. Se for OBS antigo (v4.x), use 4444.</p>
                  <p>3. **IP Local**: Em vez de <code>localhost</code>, tente o IP da rede (ex: <code>192.168.0.15</code>) para evitar bloqueios de navegador.</p>
                  <p>4. **Senha**: Se definiu uma senha no OBS, ela <strong>deve</strong> ser inserida exatamente igual aqui.</p>
                  <p>5. **HTTPS/SSL**: O navegador pode bloquear conexões <code>ws://</code> simples em sites <code>https://</code>. Se falhar, use o endereço IP direto.</p>
                </div>
                <div className="pt-2 border-t border-purple-500/10">
                  <p className="text-[8px] text-yellow-500/80 italic">
                    * Após resetar ou mudar os dados, você DEVE clicar em <strong>Salvar Tudo</strong> para o app tentar uma nova conexão.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TikTok Live Studio Info */}
          <div className="p-4 bg-pink-500/5 rounded-2xl border border-pink-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Video className="text-pink-500" size={16} />
              <h3 className="text-xs font-bold text-pink-500 uppercase">TikTok Live Studio</h3>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              O Live Studio não possui WebSocket direto. Use a função <strong>Webhook</strong> nos botões para enviar comandos se configurado via extensões externas ou bots.
            </p>
          </div>

          {/* Console / History */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black text-green-500 uppercase tracking-[0.2em]">Última Resposta / Log</h3>
            <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-blue-300 min-h-[80px] border border-white/5">
              {logs || "Nenhuma atividade registrada ainda."}
            </div>
          </div>

          {/* Maintenance Tools */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Manutenção</h3>
            <button 
              onClick={() => {
                setConfirmConfig({
                  isOpen: true,
                  title: 'Recarregar App?',
                  message: 'O aplicativo será reiniciado para tentar corrigir possíveis erros. Deseja continuar?',
                  onConfirm: () => {
                    window.location.reload();
                  }
                });
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl border border-red-500/20 transition-all text-[10px] uppercase tracking-widest active:scale-95"
            >
              <Icons.Power size={14} />
              Reiniciar Aplicativo (Recarregar Página)
            </button>
            <p className="text-[9px] text-gray-500 text-center leading-tight">
              Use esta opção se notar algum erro visual ou se os botões pararem de responder.
            </p>
          </div>
        </div>

        <div className="p-6 bg-[#252525] border-t border-white/5 flex gap-3">
          <button
            onClick={() => onSave(rows, cols, { address: obsAddress, password: obsPassword }, orientation, fullscreen, audioEnabled, audioVolume)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
          >
            Salvar Tudo
          </button>
        </div>

        {isQRScannerOpen && (
          <QRScanner 
            onScan={handleScanResult} 
            onClose={() => setIsQRScannerOpen(false)} 
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
    </div>
  );
};
