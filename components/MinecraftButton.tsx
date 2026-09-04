'use client';

import React from 'react';
import { soundManager } from '@/lib/audio-manager';

interface MinecraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const MinecraftButton: React.FC<MinecraftButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  onClick,
  onMouseEnter,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      soundManager.playButtonClick();
      if (onClick) onClick(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onMouseEnter) onMouseEnter(e);
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm min-h-[34px]',
    md: 'py-2 px-4 text-base min-h-[42px]',
    lg: 'py-3 px-6 text-lg min-h-[50px]',
  }[size];

  const getVariantStyles = () => {
    if (disabled) {
      return 'bg-[#404040] text-[#787878] border-[#222222] cursor-not-allowed shadow-[inset_2px_2px_0px_#555555,inset_-2px_-2px_0px_#2a2a2a,0px_0px_0px_2px_#000000]';
    }

    switch (variant) {
      case 'danger':
        return 'bg-[#6b2323] hover:bg-[#852c2c] active:bg-[#521b1b] text-[#ffd6d6] hover:text-[#ffffff] shadow-[inset_2px_2px_0px_#aa4444,inset_-2px_-2px_0px_#3d1313,0px_0px_0px_2px_#000000]';
      case 'success':
        return 'bg-[#2b662e] hover:bg-[#347c38] active:bg-[#1f4a21] text-[#e0ffe2] hover:text-[#ffffff] shadow-[inset_2px_2px_0px_#4ca852,inset_-2px_-2px_0px_#183d1a,0px_0px_0px_2px_#000000]';
      case 'secondary':
        return 'bg-[#4a4a4a] hover:bg-[#585858] active:bg-[#383838] text-[#e0e0e0] hover:text-[#ffffa0] shadow-[inset_2px_2px_0px_#757575,inset_-2px_-2px_0px_#262626,0px_0px_0px_2px_#000000]';
      case 'primary':
      default:
        return 'bg-[#555555] hover:bg-[#686868] active:bg-[#404040] text-[#e0e0e0] hover:text-[#ffffa0] hover:underline shadow-[inset_2px_2px_0px_#888888,inset_-2px_-2px_0px_#2a2a2a,0px_0px_0px_2px_#000000]';
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`
        relative inline-flex items-center justify-center font-mono font-bold tracking-wide select-none
        transition-colors duration-75 text-center
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses}
        ${getVariantStyles()}
        ${disabled ? '' : 'text-mc-shadow active:translate-y-[1px]'}
        ${className}
      `}
    >
      <span className="truncate flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
