'use client';

import React, { useState } from 'react';
import { WorldData } from '@/lib/minecraft-types';
import { MinecraftButton } from './MinecraftButton';
import { soundManager } from '@/lib/audio-manager';
import { Search, FolderDown, Trash2, Edit3, Copy, Play, Plus, Code2, Mountain, Layers } from 'lucide-react';

interface WorldSelectScreenProps {
  worlds: WorldData[];
  selectedWorldId: string | null;
  onSelectWorld: (worldId: string) => void;
  onPlayWorld: (world: WorldData) => void;
  onCreateWorld: () => void;
  onEditWorld: (world: WorldData) => void;
  onDeleteWorld: (world: WorldData) => void;
  onDuplicateWorld: (world: WorldData) => void;
  onExportWorld: (world: WorldData) => void;
  onOpenUnityModal: () => void;
  onBack: () => void;
}

export const WorldSelectScreen: React.FC<WorldSelectScreenProps> = ({
  worlds,
  selectedWorldId,
  onSelectWorld,
  onPlayWorld,
  onCreateWorld,
  onEditWorld,
  onDeleteWorld,
  onDuplicateWorld,
  onExportWorld,
  onOpenUnityModal,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredWorlds = worlds.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.folderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.seed.includes(searchQuery)
  );

  const selectedWorld = worlds.find(w => w.id === selectedWorldId) || (filteredWorlds.length > 0 ? filteredWorlds[0] : null);

  const handleSelect = (world: WorldData) => {
    soundManager.playButtonClick();
    onSelectWorld(world.id);
  };

  const handleDoubleClick = (world: WorldData) => {
    soundManager.playButtonClick();
    onPlayWorld(world);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="relative w-full min-h-screen bg-mc-dirt flex flex-col justify-between select-none font-mono py-4 px-2 sm:px-6">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-mc-shadow">
          Выбор мира
        </h1>

        {/* Search Bar */}
        <div className="w-full max-w-md relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-neutral-400 pointer-events-none" />
          <input
            id="world-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или сиду..."
            className="w-full bg-[#111111]/90 border-2 border-[#555555] pl-9 pr-3 py-1.5 text-white font-mono text-sm focus:border-[#a4b3ff] outline-none shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* World List Scroll Area */}
      <div className="w-full max-w-4xl mx-auto my-3 flex-1 overflow-y-auto bg-mc-dark-dirt border-4 border-black p-2 sm:p-3 mc-card-bevel max-h-[58vh]">
        {filteredWorlds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <p className="text-base text-neutral-300 mb-2">Миры не найдены</p>
            <p className="text-xs max-w-xs mb-4">Нажмите «Создать новый мир», чтобы создать первый мир для ПК на Unity C#!</p>
            <MinecraftButton size="md" variant="success" onClick={onCreateWorld}>
              <Plus className="w-4 h-4" />
              Создать новый мир
            </MinecraftButton>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorlds.map((world) => {
              const isSelected = selectedWorld?.id === world.id;

              return (
                <div
                  key={world.id}
                  id={`world-item-${world.id}`}
                  onClick={() => handleSelect(world)}
                  onDoubleClick={() => handleDoubleClick(world)}
                  className={`
                    relative flex items-center gap-3 p-2.5 sm:p-3 border-2 transition-all cursor-pointer
                    ${isSelected ? 'bg-[#3d3d3d] border-white shadow-lg' : 'bg-[#232323]/80 border-[#3a3a3a] hover:bg-[#2d2d2d]'}
                  `}
                >
                  {/* World Thumbnail Icon */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-neutral-900 border-2 border-black flex flex-col items-center justify-center overflow-hidden">
                    {world.worldType === 'flat' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#6b9e3b] to-[#4c7329] p-1 text-center">
                        <Layers className="w-6 h-6 text-white drop-shadow" />
                        <span className="text-[9px] font-bold text-neutral-900 bg-white/75 px-1 rounded mt-0.5">
                          FLAT
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#5c8a45] via-[#65573d] to-[#454545] p-1 text-center">
                        <Mountain className="w-6 h-6 text-white drop-shadow" />
                        <span className="text-[9px] font-bold text-neutral-900 bg-white/75 px-1 rounded mt-0.5">
                          DEFAULT
                        </span>
                      </div>
                    )}

                    {/* Quick Play Arrow on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-6 h-6 text-white fill-current drop-shadow" />
                    </div>
                  </div>

                  {/* World Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate text-mc-shadow">
                        {world.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        world.worldType === 'flat' ? 'bg-lime-800 text-lime-200' : 'bg-emerald-800 text-emerald-200'
                      }`}>
                        {world.worldType === 'flat' ? 'Плоский мир' : 'Обычный мир'}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-400 truncate mt-0.5">
                      <span className="text-neutral-300">{world.folderName}</span> ({formatDate(world.lastPlayed)})
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-1">
                      <span>Режим: <strong className="text-neutral-200 capitalize">{world.gameMode}</strong></span>
                      <span>Сид: <strong className="text-neutral-200">{world.seed}</strong></span>
                      <span>Размер: <strong className="text-neutral-200">{world.sizeMb} МБ</strong></span>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <div className="hidden sm:flex flex-col items-end justify-center text-xs text-neutral-400">
                    <span className="text-neutral-300 font-mono">{world.version}</span>
                    <span className="text-[11px] text-amber-300/90">Unity C# Save</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Button Bar */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
        {/* Row 1: Primary Actions */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <MinecraftButton
            size="md"
            variant="success"
            disabled={!selectedWorld}
            onClick={() => selectedWorld && onPlayWorld(selectedWorld)}
          >
            <Play className="w-4 h-4 fill-current" />
            Играть в выбранном мире
          </MinecraftButton>

          <MinecraftButton size="md" variant="primary" onClick={onCreateWorld}>
            <Plus className="w-4 h-4" />
            Создать новый мир
          </MinecraftButton>
        </div>

        {/* Row 2: Secondary World Tools */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MinecraftButton
            size="sm"
            variant="secondary"
            disabled={!selectedWorld}
            onClick={() => selectedWorld && onEditWorld(selectedWorld)}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Переименовать
          </MinecraftButton>

          <MinecraftButton
            size="sm"
            variant="danger"
            disabled={!selectedWorld}
            onClick={() => selectedWorld && onDeleteWorld(selectedWorld)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Удалить
          </MinecraftButton>

          <MinecraftButton
            size="sm"
            variant="secondary"
            disabled={!selectedWorld}
            onClick={() => selectedWorld && onDuplicateWorld(selectedWorld)}
          >
            <Copy className="w-3.5 h-3.5" />
            Копировать
          </MinecraftButton>

          <MinecraftButton
            size="sm"
            variant="secondary"
            disabled={!selectedWorld}
            onClick={() => selectedWorld && onExportWorld(selectedWorld)}
          >
            <FolderDown className="w-3.5 h-3.5" />
            Экспорт (.json)
          </MinecraftButton>
        </div>

        {/* Row 3: Unity Architecture & Back to Menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <MinecraftButton
            size="md"
            variant="secondary"
            onClick={onOpenUnityModal}
            className="border-amber-600/40"
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            Скрипты генерации Unity C# (Скачать .zip)
          </MinecraftButton>

          <MinecraftButton size="md" variant="secondary" onClick={onBack}>
            Отмена (Главное меню)
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};
