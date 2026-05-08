
import React from 'react';
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

export const DeckKey: React.FC<DeckKeyProps> = ({ button, onPress, onConfig }) => {
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
  };

  const Icon = (Icons as any)[button.iconName] || Icons.HelpCircle;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group w-full aspect-square touch-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
    >
      <button
        onClick={() => onPress(button.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          onConfig(button.id);
        }}
        className="w-full h-full rounded-lg md:rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 border-2 border-white/5 shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: button.bgColor || '#1a1a1a',
          color: button.textColor || '#ffffff',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.4)',
        }}
        id={`key-${button.id}`}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        
        {button.customIconData ? (
          <img 
            src={button.customIconData} 
            alt={button.label} 
            className="w-[48%] h-[48%] object-contain relative z-10 drop-shadow-lg"
          />
        ) : (button.iconName && button.iconName.length > 2) ? (
          <Icon className="w-[38%] h-[38%] relative z-10 drop-shadow-lg" />
        ) : (
          <span className="text-lg md:text-2xl relative z-10 drop-shadow-md leading-none">{button.iconName}</span>
        )}

        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-tight md:tracking-wider relative z-10 opacity-90 truncate w-full px-1.5 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] antialiased">
          {button.label}
        </span>
        
        {/* Button reflection highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </button>

      {/* Edit Trigger (Desktop Only Hover or Context Menu) */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onConfig(button.id); }}
          className="bg-blue-600 p-1.5 rounded-full shadow-lg hover:bg-blue-500"
        >
          <Icons.Settings size={12} className="text-white" />
        </button>
      </div>
    </motion.div>
  );
};
