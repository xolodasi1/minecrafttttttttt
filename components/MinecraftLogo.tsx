'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const SPLASH_TEXTS = [
  'Сделано для ПК на движке Unity!',
  'C# Процедурная генерация ландшафта!',
  'Два вида миров: Плоский и Обычный!',
  'Многооктавный 3D шум Перлина!',
  'Быстрое сохранение на диск ПК!',
  'Отсечение невидимых граней (Face Culling)!',
  'Бесконечные воксельные возможности!',
  '100% совместимо с Unity 2022+ и Unity 6!',
  '16x16x128 чанки!',
  'Чистый код C# архитектуры!'
];

export const MinecraftLogo: React.FC = () => {
  const [splash] = useState<string>(() => {
    return SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
  });

  return (
    <div className="relative flex flex-col items-center justify-center select-none pt-2 pb-4">
      {/* 3D Stone Minecraft Logo Title */}
      <div className="relative flex items-center justify-center">
        <h1
          id="minecraft-title-logo"
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-widest text-[#d8d8d8] uppercase"
          style={{
            fontFamily: 'Impact, "Arial Black", monospace, sans-serif',
            textShadow: `
              3px 3px 0px #707070,
              -2px -2px 0px #404040,
              4px 4px 0px #202020,
              5px 5px 0px #101010,
              6px 6px 4px rgba(0,0,0,0.85)
            `,
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.9))',
            letterSpacing: '0.12em'
          }}
        >
          <span className="text-[#bebebe]">MINE</span>
          <span className="text-[#a0a0a0]">CRAFT</span>
        </h1>

        {/* Unity C# Sub-badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#444444] px-2 py-0.5 shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-neutral-300">
            UNITY C# EDITION
          </span>
        </div>

        {/* Yellow Bouncing Splash Text */}
        {splash && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: [0.95, 1.06, 0.95] }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: 'easeInOut'
            }}
            className="absolute -bottom-7 right-0 md:-right-12 translate-x-2 sm:translate-x-6 rotate-[-15deg] pointer-events-none z-20"
          >
            <span
              className="text-xs sm:text-sm md:text-base font-mono font-black text-[#ffff55] whitespace-nowrap text-mc-yellow-shadow px-2 py-0.5"
              style={{
                textShadow: '2px 2px 0px #3f3f00, 3px 3px 0px #1a1a00'
              }}
            >
              {splash}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
