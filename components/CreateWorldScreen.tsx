'use client';

import React, { useState } from 'react';
import { WorldData, WorldType, GameMode, Difficulty, FLAT_PRESETS, FlatLayer, FlatPreset } from '@/lib/minecraft-types';
import { MinecraftButton } from './MinecraftButton';
import { soundManager } from '@/lib/audio-manager';
import { Dices, Layers, Mountain, ShieldAlert, Sparkles } from 'lucide-react';

interface CreateWorldScreenProps {
  onCreate: (newWorld: WorldData) => void;
  onCancel: () => void;
}

export const CreateWorldScreen: React.FC<CreateWorldScreenProps> = ({ onCreate, onCancel }) => {
  const [worldName, setWorldName] = useState<string>('Новый мир');
  const [gameMode, setGameMode] = useState<GameMode>('survival');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [allowCheats, setAllowCheats] = useState<boolean>(false);
  const [worldType, setWorldType] = useState<WorldType>('default');
  const [seed, setSeed] = useState<string>('');
  const [generateStructures, setGenerateStructures] = useState<boolean>(true);

  // Flat world preset customization
  const [selectedFlatPreset, setSelectedFlatPreset] = useState<FlatPreset>(FLAT_PRESETS[0]);
  const [customFlatLayers, setCustomFlatLayers] = useState<FlatLayer[]>(FLAT_PRESETS[0].layers);
  const [isCustomizingFlat, setIsCustomizingFlat] = useState<boolean>(false);

  // Generate random seed
  const handleRandomSeed = () => {
    soundManager.playButtonClick();
    const randomSeed = Math.floor(Math.random() * 8999999999 + 1000000000).toString();
    setSeed(randomSeed);
  };

  const handleCreate = () => {
    soundManager.playButtonClick();
    const finalSeed = seed.trim() ? seed.trim() : Math.floor(Math.random() * 8999999999 + 1000000000).toString();
    const folderSafe = (worldName.trim() || 'New World').replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, '_');

    const newWorld: WorldData = {
      id: `world-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: worldName.trim() || 'Новый мир',
      folderName: folderSafe,
      worldType,
      gameMode,
      difficulty,
      seed: finalSeed,
      created: Date.now(),
      lastPlayed: Date.now(),
      sizeMb: worldType === 'flat' ? 1.8 : 12.4,
      version: '1.20.4 (Unity C#)',
      allowCheats,
      generateStructures,
      flatLayers: worldType === 'flat' ? customFlatLayers : undefined,
      playerPos: worldType === 'flat' ? [0, 5, 0] : [0, 14, 0]
    };

    onCreate(newWorld);
  };

  const cycleGameMode = () => {
    const modes: GameMode[] = ['survival', 'creative', 'hardcore'];
    const nextIndex = (modes.indexOf(gameMode) + 1) % modes.length;
    setGameMode(modes[nextIndex]);
    if (modes[nextIndex] === 'creative') {
      setAllowCheats(true);
    }
  };

  const cycleDifficulty = () => {
    const diffs: Difficulty[] = ['peaceful', 'easy', 'normal', 'hard'];
    const nextIndex = (diffs.indexOf(difficulty) + 1) % diffs.length;
    setDifficulty(diffs[nextIndex]);
  };

  const gameModeDescriptions: Record<GameMode, { title: string; desc: string }> = {
    survival: {
      title: 'Выживание',
      desc: 'Поиск ресурсов, крафт, получение опыта, здоровье и голод.'
    },
    creative: {
      title: 'Творчество',
      desc: 'Бесконечные блоки, свободный полёт и мгновенное разрушение блоков.'
    },
    hardcore: {
      title: 'Хардкор',
      desc: 'Как выживание, но наивысшая сложность и только одна жизнь.'
    }
  };

  const difficultyNames: Record<Difficulty, string> = {
    peaceful: 'Мирная',
    easy: 'Лёгкая',
    normal: 'Нормальная',
    hard: 'Сложная'
  };

  return (
    <div className="relative w-full min-h-screen bg-mc-dirt flex flex-col items-center justify-between py-6 px-4 font-mono select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-2xl text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-mc-shadow">
          Создание нового мира
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Движок Unity C# | Сохранение файлов на диск ПК
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="w-full max-w-2xl bg-mc-dark-dirt border-4 border-black p-4 sm:p-6 mc-card-bevel space-y-6">
        {/* World Name Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-[#e0e0e0] text-mc-shadow">
            Название мира
          </label>
          <input
            id="create-world-name-input"
            type="text"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            className="w-full bg-[#111111] border-2 border-[#555555] px-3 py-2 text-white font-mono text-base focus:border-[#a4b3ff] outline-none shadow-inner"
            placeholder="Введите название мира..."
            maxLength={36}
          />
          <p className="text-xs text-neutral-400">
            Папка сохранения на ПК: <span className="text-neutral-200">/Saves/{worldName.trim() || 'New World'}</span>
          </p>
        </div>

        {/* Row 1: Game Mode & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Game Mode Selector */}
          <div className="space-y-1">
            <MinecraftButton fullWidth onClick={cycleGameMode}>
              Режим: {gameModeDescriptions[gameMode].title}
            </MinecraftButton>
            <p className="text-xs text-neutral-300 min-h-[32px] pt-1">
              {gameModeDescriptions[gameMode].desc}
            </p>
          </div>

          {/* Difficulty Selector */}
          <div className="space-y-1">
            <MinecraftButton fullWidth onClick={cycleDifficulty} disabled={gameMode === 'hardcore'}>
              Сложность: {gameMode === 'hardcore' ? 'Хардкор' : difficultyNames[difficulty]}
            </MinecraftButton>
            <p className="text-xs text-neutral-300 min-h-[32px] pt-1">
              {gameMode === 'hardcore' ? 'Заблокировано на хардкоре' : 'Влияет на урон и спавн мобов'}
            </p>
          </div>
        </div>

        {/* World Type Section (Requested in Prompt) */}
        <div className="border-t border-neutral-700 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white text-mc-shadow flex items-center gap-2">
                {worldType === 'default' ? <Mountain className="w-5 h-5 text-emerald-400" /> : <Layers className="w-5 h-5 text-lime-400" />}
                Тип мира: <span className="text-[#ffffa0]">{worldType === 'default' ? 'Обычный мир' : 'Суперплоский мир'}</span>
              </h3>
              <p className="text-xs text-neutral-300">
                {worldType === 'default'
                  ? 'Холмистый ландшафт с шумом Перлина, биомами, пещерами и деревьями'
                  : 'Идеально ровная плоскость с настраиваемыми слоями породы'}
              </p>
            </div>

            {/* Toggle World Type Button */}
            <div className="flex gap-2">
              <MinecraftButton
                size="sm"
                variant={worldType === 'default' ? 'success' : 'secondary'}
                onClick={() => setWorldType('default')}
              >
                Обычный
              </MinecraftButton>
              <MinecraftButton
                size="sm"
                variant={worldType === 'flat' ? 'success' : 'secondary'}
                onClick={() => setWorldType('flat')}
              >
                Суперплоский
              </MinecraftButton>
            </div>
          </div>

          {/* SUPERFLAT CONFIGURATION */}
          {worldType === 'flat' && (
            <div className="bg-[#150f0a] border-2 border-[#443322] p-4 rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Пресеты суперплоского мира:
                </span>
                <span className="text-xs text-neutral-400">
                  Слоёв: {customFlatLayers.reduce((acc, l) => acc + l.count, 0)} блоков
                </span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FLAT_PRESETS.map((preset) => {
                  const isSelected = selectedFlatPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedFlatPreset(preset);
                        setCustomFlatLayers(preset.layers);
                        soundManager.playButtonClick();
                      }}
                      className={`
                        text-left p-2 border-2 transition-colors flex flex-col justify-between
                        ${isSelected ? 'bg-[#3b2a1a] border-yellow-500 shadow-md' : 'bg-[#221810] border-[#443020] hover:bg-[#2d2015]'}
                      `}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{preset.icon}</span>
                        <span className="truncate">{preset.name}</span>
                      </div>
                      <div className="text-[10px] text-neutral-300 mt-1 line-clamp-1">
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Visual layers preview */}
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-bold text-neutral-300">Слои снизу вверх:</div>
                <div className="flex flex-col-reverse gap-1 border border-black/40 p-2 bg-black/40 rounded">
                  {customFlatLayers.map((layer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded"
                    >
                      <span className="font-bold text-neutral-200 capitalize">
                        {layer.block === 'grass' ? '🌱 Трава (Grass)' :
                         layer.block === 'dirt' ? '🟤 Земля (Dirt)' :
                         layer.block === 'stone' ? '🪨 Камень (Stone)' :
                         layer.block === 'sand' ? '🏜️ Песок (Sand)' :
                         layer.block === 'water' ? '🌊 Вода (Water)' :
                         '⬛ Бедрок (Bedrock)'}
                      </span>
                      <span className="font-mono bg-neutral-900 px-2 py-0.5 text-yellow-400 rounded">
                        x{layer.count} {layer.count === 1 ? 'блок' : 'блоков'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DEFAULT WORLD CONFIGURATION */}
          {worldType === 'default' && (
            <div className="bg-[#150f0a] border-2 border-[#443322] p-4 rounded space-y-3">
              {/* Seed input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-300">
                  Сид для генератора мира (Оставьте пустым для случайного)
                </label>
                <div className="flex gap-2">
                  <input
                    id="world-seed-input"
                    type="text"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Например: 8492019482 или UnitySeed"
                    className="flex-1 bg-[#111111] border-2 border-[#555555] px-3 py-1.5 text-white font-mono text-sm focus:border-[#a4b3ff] outline-none"
                  />
                  <MinecraftButton size="sm" variant="secondary" onClick={handleRandomSeed}>
                    <Dices className="w-4 h-4" />
                    Случайный
                  </MinecraftButton>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <MinecraftButton
                  size="sm"
                  variant={generateStructures ? 'success' : 'secondary'}
                  onClick={() => setGenerateStructures(!generateStructures)}
                >
                  Строения/деревья: {generateStructures ? 'ВКЛ' : 'ВЫКЛ'}
                </MinecraftButton>

                <MinecraftButton
                  size="sm"
                  variant={allowCheats ? 'success' : 'secondary'}
                  onClick={() => setAllowCheats(!allowCheats)}
                  disabled={gameMode === 'hardcore'}
                >
                  Читы/полёт: {allowCheats ? 'ВКЛ' : 'ВЫКЛ'}
                </MinecraftButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="w-full max-w-2xl mt-6 grid grid-cols-2 gap-4">
        <MinecraftButton size="lg" variant="success" onClick={handleCreate}>
          Создать новый мир
        </MinecraftButton>

        <MinecraftButton size="lg" variant="secondary" onClick={onCancel}>
          Отмена
        </MinecraftButton>
      </div>
    </div>
  );
};
