'use client';

import React, { useEffect, useState } from 'react';
import { WorldData } from '@/lib/minecraft-types';
import { soundManager } from '@/lib/audio-manager';

interface LoadingWorldScreenProps {
  world: WorldData;
  onLoaded: () => void;
}

const STAGES = [
  'Чтение параметров мира (world.json)...',
  'Инициализация генератора ландшафта Unity C#...',
  'Вычисление шума Перлина и октав высот...',
  'Формирование воксельных чанков 16x16...',
  'Применение отсечения невидимых граней (Face Culling)...',
  'Загрузка мира завершена!'
];

export const LoadingWorldScreen: React.FC<LoadingWorldScreenProps> = ({ world, onLoaded }) => {
  const [progress, setProgress] = useState<number>(10);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);

  useEffect(() => {
    soundManager.playWorldLoad();

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 18) + 8;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onLoaded();
          }, 350);
          return 100;
        }

        const stageIndex = Math.min(
          Math.floor((next / 100) * STAGES.length),
          STAGES.length - 1
        );
        setCurrentStageIndex(stageIndex);
        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div className="relative w-full h-screen bg-mc-dirt flex flex-col items-center justify-center select-none font-mono px-4 text-center">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center">
        <h2 className="text-2xl sm:text-4xl font-black text-white text-mc-shadow mb-2">
          Загрузка мира
        </h2>
        <p className="text-sm sm:text-base text-[#ffffa0] text-mc-yellow-shadow mb-6">
          {world.worldType === 'flat' ? 'Генерация суперплоского мира' : 'Генерация процедурного ландшафта (Unity C#)'}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#111111] border-2 border-[#555555] p-1 shadow-2xl mb-4">
          <div
            className="h-6 bg-gradient-to-r from-[#347c38] to-[#4ca852] transition-all duration-150 relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/15 animate-pulse" />
          </div>
        </div>

        {/* Progress status & percentage */}
        <div className="flex justify-between w-full text-xs sm:text-sm text-neutral-300">
          <span className="truncate">{STAGES[currentStageIndex]}</span>
          <span className="font-bold text-white pl-2">{progress}%</span>
        </div>

        {/* World details badge */}
        <div className="mt-8 bg-black/50 border border-neutral-700 px-4 py-2 text-xs text-neutral-400 space-y-1">
          <div>Имя мира: <span className="text-neutral-200">{world.name}</span></div>
          <div>Сид: <span className="text-neutral-200">{world.seed}</span></div>
          <div>Тип: <span className="text-neutral-200">{world.worldType === 'flat' ? 'Плоский' : 'Обычный'}</span></div>
        </div>
      </div>
    </div>
  );
};
