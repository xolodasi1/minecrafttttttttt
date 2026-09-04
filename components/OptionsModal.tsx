'use client';

import React, { useState } from 'react';
import { MinecraftButton } from './MinecraftButton';
import { soundManager } from '@/lib/audio-manager';
import { X, Settings, RotateCcw } from 'lucide-react';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetWorlds: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  onResetWorlds,
  soundEnabled,
  onToggleSound
}) => {
  const [fov, setFov] = useState<number>(75);
  const [renderDist, setRenderDist] = useState<number>(6);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-mc-dark-dirt border-4 border-black w-full max-w-lg p-6 mc-card-bevel flex flex-col space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-700 pb-3">
          <h2 className="text-2xl font-bold text-white text-mc-shadow flex items-center gap-2">
            <Settings className="w-5 h-5 text-neutral-300" />
            Настройки
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Sound Toggle */}
          <div>
            <MinecraftButton fullWidth size="md" onClick={onToggleSound}>
              Звуковые эффекты интерфейса: {soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
            </MinecraftButton>
          </div>

          {/* Render Distance */}
          <div className="bg-black/40 p-3 rounded space-y-1">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Дальность прорисовки чанков Unity:</span>
              <span className="font-bold text-yellow-300">{renderDist} чанков ({renderDist * 16} блоков)</span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={renderDist}
              onChange={(e) => setRenderDist(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* FOV Slider */}
          <div className="bg-black/40 p-3 rounded space-y-1">
            <div className="flex justify-between text-xs text-neutral-300">
              <span>Поле зрения (FOV):</span>
              <span className="font-bold text-yellow-300">{fov}°</span>
            </div>
            <input
              type="range"
              min="60"
              max="110"
              value={fov}
              onChange={(e) => setFov(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Reset Worlds to Default */}
          <div className="pt-2">
            <MinecraftButton
              fullWidth
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Сбросить список миров к исходным примерам (Новый мир + Суперплоский)?')) {
                  onResetWorlds();
                  onClose();
                }
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Восстановить стандартные миры
            </MinecraftButton>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-700">
          <MinecraftButton fullWidth size="md" variant="primary" onClick={onClose}>
            Готово
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};
