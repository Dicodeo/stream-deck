import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Logo } from './Logo';
import { DeckState, ObsConfig } from '../types';

interface GlobalSettingsModalProps {
  deck: DeckState;
  logs?: string | null;
  obsStatus: 'disconnected' | 'connecting' | 'connected';
  onSave: (rows: number, cols: number, obsConfig?: ObsConfig) => void;
  onDisconnectObs: () => void;
  onClose: () => void;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({ deck, logs, obsStatus, onSave, onDisconnectObs, onClose }) => {
  const [rows, setRows] = useState(deck.rows);
  const [cols, setCols] = useState(deck.cols);
  const [obsAddress, setObsAddress] = useState(deck.obsConfig?.address || 'ws://127.0.0.1:4455');
  const [obsPassword, setObsPassword] = useState(deck.obsConfig?.password || '');
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  const handleObsResetConnection = () => {
    if (confirm('Resetar configurações de conexão do OBS para o padrão (localhost:4455)?')) {
      setObsAddress('ws://127.0.0.1:4455');
      setObsPassword('');
      setShowResetSuccess(true);
      setTimeout(() => setShowResetSuccess(false), 3000);
    }
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
                if(confirm('Isso irá recarregar o aplicativo. Deseja continuar?')) {
                  window.location.reload();
                }
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
            onClick={() => onSave(rows, cols, { address: obsAddress, password: obsPassword, connected: false })}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
          >
            Salvar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};
