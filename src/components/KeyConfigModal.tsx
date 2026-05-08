
import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { ActionButton, ActionType } from '../types';

interface KeyConfigModalProps {
  button: ActionButton;
  onSave: (updated: ActionButton) => void;
  onClose: () => void;
}

const ICON_LIST = [
  'Play', 'Pause', 'Square', 'SkipForward', 'SkipBack', 'Volume2', 'Mic', 'Camera', 'Monitor',
  'MessageSquare', 'Share2', 'Heart', 'Star', 'Flame', 'Lightbulb', 'Coffee', 'Gamepad2',
  'Headphones', 'Music', 'Tv', 'Laptop', 'Smartphone', 'Terminal', 'Code2', 'Database',
  'Cloud', 'Wifi', 'Lock', 'Unlock', 'Settings', 'Tools', 'Brush', 'Palette'
];

const EMOJI_LIST = [
  '🔥', '⭐', '❤️', '🎮', '🔴', '🟢', '🔵', '⚡', '🤖', '👾', '🚀', '🎬', 
  '🎵', '🎙️', '📺', '💻', '💡', '✅', '❌', '⚠️', '💎', '👑', '🍕', '☕'
];

const PRESET_COLORS = [
  '#1a1a1a', '#FF0000', '#4285F4', '#8E24AA', '#4CAF50', 
  '#FF9800', '#E91E63', '#00BCD4', '#FFEB3B', '#795548'
];

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'url', label: 'Link Web' },
  { value: 'media', label: 'Cena/Mídia' },
  { value: 'obs', label: 'OBS Studio' },
  { value: 'ai', label: 'IA Gemini' },
  { value: 'sound', label: 'Som Local/URL' },
  { value: 'webhook', label: 'TikTok/Webhook' },
  { value: 'clock', label: 'Relógio' },
  { value: 'none', label: 'Vazio' },
];

const OBS_COMMANDS = [
  { value: 'SetCurrentProgramScene', label: 'Trocar Cena' },
  { value: 'ToggleInputMute', label: 'Mudar Mudo (Mic/Aux)' },
  { value: 'StartStream', label: 'Iniciar Live' },
  { value: 'StopStream', label: 'Parar Live' },
  { value: 'StartRecord', label: 'Gravar' },
  { value: 'StopRecord', label: 'Parar Gravação' },
];

export const KeyConfigModal: React.FC<KeyConfigModalProps> = ({ button, onSave, onClose }) => {
  const [formData, setFormData] = useState<ActionButton>(button);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'customIconData' | 'soundUrl' | 'value') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB to avoid LocalStorage issues
    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande! Por favor, use arquivos menores que 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (field === 'value' && formData.type === 'sound') {
        setFormData({ ...formData, value: dataUrl });
      } else {
        setFormData({ ...formData, [field]: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const getPlaceholder = () => {
    switch(formData.type) {
      case 'ai': return "Instrução para a IA...";
      case 'url': return "https://seusite.com";
      case 'sound': return "Link .mp3 ou .wav";
      case 'webhook': return "URL do Webhook do TikTok/OBS";
      default: return "Valor do comando...";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#252525]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Settings className="text-blue-400" />
            Configurar Botão
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Icons.X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto overscroll-contain touch-pan-y scroll-smooth">
          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nome do Botão</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Ex: Abrir Youtube"
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Função Principal</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`px-3 py-2 rounded-xl text-xs transition-all border ${
                    formData.type === type.value
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific Value */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                {formData.type === 'obs' ? 'Comando OBS' : formData.type === 'ai' ? 'Prompt da IA' : formData.type === 'url' ? 'Endereço (URL)' : 'Valor / Parâmetro'}
              </label>
              {formData.type === 'sound' && (
                <label className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-600/30 transition-all font-bold uppercase">
                  Upload Som
                  <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'value')} />
                </label>
              )}
            </div>
            
            {formData.type === 'obs' ? (
              <div className="space-y-3">
                <select
                  value={formData.value.split(':')[0] || 'SetCurrentProgramScene'}
                  onChange={(e) => setFormData({ ...formData, value: `${e.target.value}:${formData.value.split(':')[1] || ''}` })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {OBS_COMMANDS.map(cmd => (
                    <option key={cmd.value} value={cmd.value} className="bg-[#1e1e1e]">{cmd.label}</option>
                  ))}
                </select>
                {formData.value.startsWith('SetCurrentProgramScene') && (
                  <input
                    type="text"
                    placeholder="Nome da Cena (ex: Gameplay)"
                    value={formData.value.split(':')[1] || ''}
                    onChange={(e) => setFormData({ ...formData, value: `SetCurrentProgramScene:${e.target.value}` })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                  />
                )}
                {formData.value.startsWith('ToggleInputMute') && (
                  <input
                    type="text"
                    placeholder="Nome da Entrada (ex: Mic/Aux)"
                    value={formData.value.split(':')[1] || ''}
                    onChange={(e) => setFormData({ ...formData, value: `ToggleInputMute:${e.target.value}` })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                  />
                )}
              </div>
            ) : (
              <textarea
                value={formData.type === 'sound' && formData.value.startsWith('data:') ? 'Arquivo de Som Local Carregado' : formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                disabled={formData.type === 'none' || formData.type === 'clock'}
                rows={formData.type === 'ai' ? 3 : 1}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-30"
                placeholder={getPlaceholder()}
              />
            )}
            {formData.type === 'url' && (
              <div className="mt-4 flex items-center gap-3 bg-blue-600/5 border border-blue-500/20 p-3 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, returnToHome: !formData.returnToHome })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${formData.returnToHome ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.returnToHome ? 'left-6' : 'left-1'}`} />
                </button>
                <div className="flex-1">
                  <span className="block text-[10px] font-black text-white uppercase tracking-wider">Voltar ao Início</span>
                  <span className="block text-[9px] text-gray-500 leading-tight">Retorna à página principal após abrir o link.</span>
                </div>
              </div>
            )}
            {formData.type === 'webhook' && (
              <p className="mt-2 text-[9px] text-gray-500 italic leading-relaxed">
                * Para TikTok Live Studio: Utilize a URL de um webhook configurado em seu bot de live (ex: TikFinity, LiveTools) para acionar ações externas.
              </p>
            )}
            {formData.type === 'clock' && (
              <p className="mt-2 text-[9px] text-blue-400 italic leading-relaxed">
                * Relógio de Voz: O botão exibirá o horário em tempo real e falará as horas ao ser clicado.
              </p>
            )}
          </div>

          {/* Sound Override */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Som ao clicar (Upload ou URL)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.soundUrl?.startsWith('data:') ? 'Arquivo Local Carregado' : (formData.soundUrl || '')}
                onChange={(e) => setFormData({ ...formData, soundUrl: e.target.value })}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Link para .mp3 ou upload"
              />
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl text-gray-300 transition-colors">
                <Icons.Upload size={14} />
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'soundUrl')} />
              </label>
              {formData.soundUrl && (
                <button 
                  onClick={() => setFormData({ ...formData, soundUrl: undefined })}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"
                >
                  <Icons.Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Icons & Colors Section */}
          <div className="space-y-6">
            {/* Colors */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Palette de Cores</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, bgColor: color })}
                    className={`w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 ${formData.bgColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-600 uppercase mb-1">Fundo Personalizado</label>
                  <input
                    type="color"
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    className="w-full h-8 bg-transparent border-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-600 uppercase mb-1">Texto</label>
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="w-full h-8 bg-transparent border-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between">
                Tamanho da Fonte
                <span className="text-blue-400">{formData.fontSize || 10}px</span>
              </label>
              <input
                type="range"
                min="6"
                max="24"
                step="1"
                value={formData.fontSize || 10}
                onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
              />
              <div className="flex justify-between text-[8px] text-gray-600 uppercase font-black">
                <span>Pequeno</span>
                <span>Grande</span>
              </div>
            </div>

            {/* Emojis */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Emojis</label>
              <div className="grid grid-cols-8 gap-2 bg-black/20 p-2 rounded-xl">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setFormData({ ...formData, iconName: emoji, customIconData: undefined })}
                    className={`aspect-square flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-all ${formData.iconName === emoji ? 'bg-blue-600/30 ring-1 ring-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Lucide Icons */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Ícones do Sistema</label>
                <label className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-600/30 transition-all font-bold uppercase">
                  Subir Imagem
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'customIconData')} />
                </label>
              </div>

              {formData.customIconData ? (
                <div className="relative group aspect-square w-16 mx-auto mb-4 bg-black/30 rounded-xl border-2 border-blue-500/50 p-2 overflow-hidden">
                  <img src={formData.customIconData} alt="Custom icon" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setFormData({ ...formData, customIconData: undefined })}
                    className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px]"
                  >
                    Remover
                  </button>
                </div>
              ) : null}

              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto scrollbar-hide no-scrollbar pr-1">
                {ICON_LIST.map((name) => {
                  const IconComp = (Icons as any)[name];
                  return (
                    <button
                      key={name}
                      onClick={() => setFormData({ ...formData, iconName: name, customIconData: undefined })}
                      className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${
                        formData.iconName === name
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {IconComp && <IconComp size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#252525] border-t border-white/5 flex gap-3">
          <button
            onClick={() => {
              if (confirm('Deseja realmente resetar todas as configurações deste botão?')) {
                setFormData({
                  id: formData.id,
                  label: '',
                  type: 'none',
                  value: '',
                  iconName: 'Play',
                  customIconData: undefined,
                  soundUrl: undefined,
                  bgColor: '#1a1a1a',
                  textColor: '#ffffff',
                  returnToHome: false
                });
              }
            }}
            className="px-4 bg-red-600/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 flex items-center justify-center group"
            title="Resetar Botão"
          >
            <Icons.RotateCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 text-[10px] uppercase tracking-widest"
          >
            Salvar Alterações
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-xl transition-all text-[10px] uppercase tracking-widest"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
