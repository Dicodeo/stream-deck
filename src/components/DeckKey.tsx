
import React, { memo } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionButton } from '../types';

interface DeckKeyProps {
  button: ActionButton;
  onPress: (id: string) => void;
  onConfig: (id: string) => void;
}

export const DeckKey = memo<DeckKeyProps>(({ button, onPress, onConfig }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: button.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? 1.05 : 1,
    willChange: 'transform, opacity',
  };

  const Icon = (Icons as any)[button.iconName] || Icons.HelpCircle;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group w-full aspect-[1.3/1] touch-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
    >
        <button
          onClick={() => onPress(button.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onConfig(button.id);
          }}
          className={`w-full h-full rounded-[20px] md:rounded-[28px] flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(0,243,255,0.2)] ${
            button.bgColor ? 'border-white/10' : 'border-white/5 bg-[#080808]'
          } group-hover:border-[#00f3ff]/40 will-change-transform`}
          style={{
            backgroundColor: button.bgColor || '#080808',
            color: button.textColor || '#ffffff',
          }}
          id={`key-${button.id}`}
        >
          {/* Neon Top Shine */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          
          {/* Glossy Overlay & Internal Light */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
          <div className="absolute inset-[1px] bg-gradient-to-b from-white/5 to-transparent rounded-[19px] md:rounded-[27px] opacity-40 pointer-events-none" />
          
          {button.customIconData ? (
            <img 
              src={button.customIconData} 
              alt={button.label} 
              className="w-[30%] h-[30%] sm:w-[35%] sm:h-[35%] object-contain relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
            />
          ) : (button.iconName && button.iconName.length > 2) ? (
            <Icon className="w-[30%] h-[30%] sm:w-[35%] sm:h-[35%] relative z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110 group-hover:text-[#00f3ff] transition-colors" />
          ) : (
            <span className="text-base sm:text-lg md:text-3xl relative z-10 drop-shadow-md leading-none transition-transform duration-300 group-hover:scale-110">{button.iconName}</span>
          )}

          <span 
            className="text-[9px] sm:text-[10px] md:text-[12px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] relative z-10 text-white/90 group-hover:text-white truncate w-full px-2 sm:px-3 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] antialiased transition-colors"
            style={button.fontSize ? { fontSize: `${Math.max(button.fontSize, 10)}px` } : {}}
          >
            {button.label}
          </span>
          
          {/* Hover Highlight Glow */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] transition-all duration-1000 group-hover:left-full pointer-events-none" />
        </button>

        {/* Edit Trigger (Desktop Only Hover or Context Menu) */}
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
          <button 
            onClick={(e) => { e.stopPropagation(); onConfig(button.id); }}
            className="bg-[#00f3ff] p-1.5 rounded-full shadow-[0_0_15px_rgba(0,243,255,0.5)] hover:bg-white transition-colors"
          >
            <Icons.Settings size={12} className="text-black" />
          </button>
        </div>
    </motion.div>
  );
});
