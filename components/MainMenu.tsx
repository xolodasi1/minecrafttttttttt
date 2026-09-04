'use client';

import React from 'react';
import { MinecraftLogo } from './MinecraftLogo';
import { MinecraftButton } from './MinecraftButton';
import { soundManager } from '@/lib/audio-manager';
import { Play, Code2, Settings, Globe, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

interface MainMenuProps {
  onSingleplayer: () => void;
  onOpenUnityCode: () => void;
  onOptions: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onSingleplayer,
  onOpenUnityCode,
  onOptions,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <div className="relative w-full min-h-screen bg-mc-dirt flex flex-col justify-between items-center py-8 px-4 font-mono select-none overflow-hidden">
      {/* Background panoramic overlay */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />

      {/* Top Navigation / Sound toggle */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs text-neutral-300 bg-black/40 px-3 py-1.5 rounded border border-neutral-700">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Unity C# Engine | Архитектура ПК</span>
        </div>

        <button
          id="sound-toggle-button"
          onClick={() => {
            soundManager.playButtonClick();
            onToggleSound();
          }}
          className="flex items-center gap-1.5 bg-[#444444] hover:bg-[#555555] border-2 border-black px-3 py-1.5 text-xs text-white mc-btn-bevel shadow"
          title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          <span>{soundEnabled ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ'}</span>
        </button>
      </div>

      {/* Center: Minecraft Logo & Main Menu Buttons */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center my-auto">
        <MinecraftLogo />

        {/* Action Buttons Column */}
        <div className="w-full space-y-3 mt-6">
          <MinecraftButton
            fullWidth
            size="lg"
            variant="primary"
            onClick={onSingleplayer}
            className="text-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            Одиночная игра (Миры)
          </MinecraftButton>

          <MinecraftButton
            fullWidth
            size="md"
            variant="secondary"
            disabled
            title="Сетевая игра реализуется через Unity Netcode / Photon PUN"
          >
            <Globe className="w-4 h-4" />
            Сетевая игра (Unity Netcode)
          </MinecraftButton>

          <MinecraftButton
            fullWidth
            size="md"
            variant="secondary"
            onClick={onOpenUnityCode}
            className="border-amber-600/50"
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            Скрипты Unity C# и Генератор
          </MinecraftButton>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <MinecraftButton
              size="md"
              variant="secondary"
              onClick={onOptions}
            >
              <Settings className="w-4 h-4" />
              Настройки
            </MinecraftButton>

            <MinecraftButton
              size="md"
              variant="secondary"
              onClick={() => {
                soundManager.playButtonClick();
                alert('Minecraft Unity C# Clone — готово к экспорту и игре!');
              }}
            >
              Выход
            </MinecraftButton>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2 border-t border-neutral-800 pt-4">
        <div>
          Minecraft 1.20.4 (Unity C# Edition) | ПК Сохранения
        </div>
        <div className="text-center sm:text-right text-neutral-300">
          Ландшафт: <span className="text-yellow-400">Шум Перлина C#</span> &bull; Миры: <span className="text-lime-400">Плоский</span> / <span className="text-emerald-400">Обычный</span>
        </div>
      </div>
    </div>
  );
};
