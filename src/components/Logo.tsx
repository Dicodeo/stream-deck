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
        <div className="absolute inset-0 bg-[#00f3ff]/20 blur-xl rounded-full animate-pulse" />
        
        {/* Logo Body */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f3ff] via-[#bc13fe] to-purple-800 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.4)] transform rotate-3" />
        
        {/* Inner Border */}
        <div className="absolute inset-[1px] bg-black/40 rounded-[10px] backdrop-blur-sm" />
        
        {/* Icon */}
        <Icons.LayoutGrid 
          size={config.icon} 
          className="relative z-10 text-white drop-shadow-[0_0_8px_rgba(0,243,255,0.8)] animate-in fade-in zoom-in duration-500" 
        />
 
        {/* Accent Lightning */}
        <div className="absolute -top-1 -right-1 z-20 bg-[#00f3ff] rounded-full p-0.5 shadow-lg shadow-[#00f3ff]/50">
          <Icons.Zap size={8} className="text-black fill-current" />
        </div>
      </div>
    </div>
  );
};
