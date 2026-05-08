
import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { PageState } from '../types';

interface PageConfigModalProps {
  page: PageState;
  onSave: (updated: PageState) => void;
  onClose: () => void;
  onRemove?: () => void; // Added onRemove
}

const ICON_LIST = [
  'Layers', 'Home', 'Star', 'Activity', 'Layout', 'Grid', 'Box', 'Pocket',
  'Cpu', 'Zap', 'Flame', 'Sparkles', 'Target', 'Compass', 'Globe', 'Radio',
  'Music', 'Video', 'Camera', 'Image', 'Mic', 'Headphones', 'Cast', 'Tv',
  'Monitor', 'Smartphone', 'Watch', 'Pen', 'Trash2', 'Settings', 'Shield', 'Lock',
  'Code', 'Terminal', 'Database', 'Cloud', 'Wifi', 'Bluetooth', 'Link', 'Anchor',
  'MessageCircle', 'Mail', 'Bell', 'User', 'Users', 'Heart', 'Smile', 'Sun'
];

const EMOJI_LIST = [
  '🏠', '⭐', '📺', '🎮', '🎧', '🎙️', '📱', '💻', '🚀', '🛠️', '🎨', '🎵',
  '📁', '📂', '🎬', '📸', '📻', '🎧', '🔋', '📡', '💡', '🔥', '✨', '🌈',
  '🍀', '🌍', '⚡', '🤖', '👾', '🎹', '🎸', '📢', '🔔', '📅', '📝', '✅'
];

const PRESET_COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777', 
  '#0891b2', '#4b5563', '#1e1e1e', '#000000', '#ffffff', '#fbbf24'
];

export const PageConfigModal: React.FC<PageConfigModalProps> = ({ page, onSave, onClose, onRemove }) => {
  const [formData, setFormData] = useState<PageState>({ ...page });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert("Arquivo muito grande! Por favor, use arquivos menores que 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData({ ...formData, customIconData: dataUrl, iconName: undefined });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#252525]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icons.Layers className="text-blue-400" />
            Configurar Página
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Icons.X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide no-scrollbar">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nome da Página</label>
            <input
              autoFocus
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Cor da Aba</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, bgColor: color })}
                  className={`aspect-square rounded-lg border-2 transition-all ${
                    formData.bgColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="relative aspect-square">
                <input
                  type="color"
                  value={formData.bgColor || '#2563eb'}
                  onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                  className={`w-full h-full rounded-lg border-2 flex items-center justify-center text-white text-[10px] ${
                    !PRESET_COLORS.includes(formData.bgColor || '') ? 'border-white' : 'border-white/10'
                  }`}
                  style={{ backgroundColor: formData.bgColor || '#333' }}
                >
                  <Icons.Plus size={14} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between">
              Tamanho da Fonte
              <span className="text-blue-400">{formData.fontSize || 9}px</span>
            </label>
            <input
              type="range"
              min="6"
              max="16"
              step="1"
              value={formData.fontSize || 9}
              onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
            />
            <div className="flex justify-between text-[8px] text-gray-600 uppercase font-black">
              <span>Pequeno</span>
              <span>Grande</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Ícone da Aba</label>
              <label className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-600/30 transition-all font-bold uppercase">
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
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

            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-2">
                {ICON_LIST.map((name) => {
                  const IconComp = (Icons as any)[name];
                  return (
                    <button
                      key={name}
                      onClick={() => setFormData({ ...formData, iconName: name, customIconData: undefined })}
                      className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${
                        formData.iconName === name
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {IconComp && <IconComp size={18} />}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-6 gap-2">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setFormData({ ...formData, iconName: emoji, customIconData: undefined })}
                    className={`aspect-square flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-all ${
                      formData.iconName === emoji ? 'bg-blue-600/30 ring-1 ring-blue-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#252525] border-t border-white/5 flex gap-2">
          {onRemove && (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="px-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 flex items-center justify-center"
              title="Excluir Página"
            >
              <Icons.Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => onSave(formData)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 text-[10px] uppercase tracking-[0.2em]"
          >
            Salvar Alterações
          </button>
          <button
            onClick={onClose}
            className="px-6 bg-white/5 hover:bg-white/10 text-white/50 font-black py-4 rounded-xl transition-all text-[10px] uppercase tracking-[0.2em]"
          >
            Sair
          </button>
        </div>

        <ConfirmModal 
          isOpen={isConfirmOpen}
          title="Excluir Página?"
          message="Tem certeza que deseja apagar esta página e todos os seus botões? Esta ação não pode ser desfeita."
          onConfirm={() => {
            setIsConfirmOpen(false);
            if (onRemove) onRemove();
          }}
          onCancel={() => setIsConfirmOpen(false)}
        />
      </div>
    </div>
  );
};
