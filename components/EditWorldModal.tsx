'use client';

import React, { useState } from 'react';
import { WorldData } from '@/lib/minecraft-types';
import { MinecraftButton } from './MinecraftButton';
import { soundManager } from '@/lib/audio-manager';
import { X, Edit2 } from 'lucide-react';

interface EditWorldModalProps {
  world: WorldData;
  isOpen: boolean;
  onSave: (updatedWorld: WorldData) => void;
  onClose: () => void;
}

export const EditWorldModal: React.FC<EditWorldModalProps> = ({ world, isOpen, onSave, onClose }) => {
  const [name, setName] = useState<string>(world.name);
  const [allowCheats, setAllowCheats] = useState<boolean>(world.allowCheats);

  if (!isOpen) return null;

  const handleSave = () => {
    soundManager.playButtonClick();
    const updated: WorldData = {
      ...world,
      name: name.trim() || world.name,
      allowCheats
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-mc-dark-dirt border-4 border-black w-full max-w-md p-6 mc-card-bevel flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
          <h2 className="text-xl font-bold text-white text-mc-shadow flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-amber-400" />
            Редактировать мир
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-300">Название мира</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#111111] border-2 border-[#555555] px-3 py-2 text-white font-mono text-sm focus:border-[#a4b3ff] outline-none"
            maxLength={36}
          />
        </div>

        <div className="text-xs text-neutral-400 space-y-1 bg-black/40 p-3 rounded">
          <div>Папка: <strong className="text-neutral-200">{world.folderName}</strong></div>
          <div>Тип мира: <strong className="text-neutral-200">{world.worldType === 'flat' ? 'Плоский' : 'Обычный'}</strong></div>
          <div>Сид: <strong className="text-neutral-200">{world.seed}</strong></div>
        </div>

        <div className="pt-2">
          <MinecraftButton
            fullWidth
            size="sm"
            variant={allowCheats ? 'success' : 'secondary'}
            onClick={() => setAllowCheats(!allowCheats)}
          >
            Читы / Команды: {allowCheats ? 'ВКЛЮЧЕНЫ' : 'ВЫКЛЮЧЕНЫ'}
          </MinecraftButton>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-700">
          <MinecraftButton size="md" variant="success" onClick={handleSave}>
            Сохранить
          </MinecraftButton>
          <MinecraftButton size="md" variant="secondary" onClick={onClose}>
            Отмена
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};
