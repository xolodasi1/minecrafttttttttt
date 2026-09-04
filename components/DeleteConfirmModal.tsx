'use client';

import React from 'react';
import { WorldData } from '@/lib/minecraft-types';
import { MinecraftButton } from './MinecraftButton';
import { soundManager } from '@/lib/audio-manager';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  world: WorldData;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  world,
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    soundManager.playButtonClick();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-mc-dark-dirt border-4 border-black w-full max-w-md p-6 mc-card-bevel flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-950 border-2 border-red-600 flex items-center justify-center text-red-400 mb-1">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white text-mc-shadow">
          Удалить этот мир?
        </h2>

        <p className="text-sm text-neutral-300 leading-relaxed">
          Мир <span className="font-bold text-yellow-300">«{world.name}»</span> и его сохраненные воксели на диске будут безвозвратно удалены!
        </p>

        <div className="text-xs text-neutral-400 bg-black/50 p-2.5 rounded w-full text-left">
          <div>• Папка: /Saves/{world.folderName}</div>
          <div>• Тип: {world.worldType === 'flat' ? 'Плоский мир' : 'Обычный мир'}</div>
          <div>• Сид: {world.seed}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full pt-2">
          <MinecraftButton size="md" variant="danger" onClick={handleConfirm}>
            Удалить навсегда
          </MinecraftButton>
          <MinecraftButton size="md" variant="secondary" onClick={onCancel}>
            Отмена
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};
