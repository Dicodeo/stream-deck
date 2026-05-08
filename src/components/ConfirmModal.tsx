import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#1a1a1a] border border-red-500/20 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl shadow-red-500/10"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <Icons.AlertTriangle className="text-red-500" size={32} />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={onConfirm}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[12px] tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Confirmar Exclusão
                </button>
                <button 
                  onClick={onCancel}
                  className="w-full py-3 text-gray-500 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
            
            {/* Bottom accent */}
            <div className="h-1 bg-gradient-to-r from-red-600 to-transparent opacity-50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
