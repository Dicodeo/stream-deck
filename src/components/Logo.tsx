import React from 'react';
import * as Icons from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 'md' }) => {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 16, text: 'text-sm' },
    md: { container: 'w-10 h-10', icon: 20, text: 'text-lg' },
    lg: { container: 'w-16 h-16', icon: 32, text: 'text-2xl' }
  };

  const config = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${config.container} flex items-center justify-center shrink-0`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        
        {/* Logo Body */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transform rotate-3" />
        
        {/* Inner Border */}
        <div className="absolute inset-[1px] bg-black/20 rounded-[10px] backdrop-blur-sm" />
        
        {/* Icon */}
        <Icons.LayoutGrid 
          size={config.icon} 
          className="relative z-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500" 
        />

        {/* Accent Lightning */}
        <div className="absolute -top-1 -right-1 z-20 bg-yellow-400 rounded-full p-0.5 shadow-lg shadow-yellow-400/40">
          <Icons.Zap size={8} className="text-black fill-current" />
        </div>
      </div>
    </div>
  );
};
