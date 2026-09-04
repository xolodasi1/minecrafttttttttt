'use client';

import React, { useState, useEffect } from 'react';
import { WorldData, INITIAL_WORLDS } from '@/lib/minecraft-types';
import { soundManager } from '@/lib/audio-manager';
import { MainMenu } from '@/components/MainMenu';
import { WorldSelectScreen } from '@/components/WorldSelectScreen';
import { CreateWorldScreen } from '@/components/CreateWorldScreen';
import { LoadingWorldScreen } from '@/components/LoadingWorldScreen';
import { VoxelWorldView } from '@/components/VoxelWorldView';
import { UnityProjectModal } from '@/components/UnityProjectModal';
import { EditWorldModal } from '@/components/EditWorldModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { OptionsModal } from '@/components/OptionsModal';

type AppScreen = 'main_menu' | 'world_select' | 'create_world' | 'loading_world' | 'in_world';

const STORAGE_KEY = 'minecraft_unity_pc_worlds_v2';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('world_select');
  const [worlds, setWorlds] = useState<WorldData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Storage safety
      }
    }
    return INITIAL_WORLDS;
  });

  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0].id;
          }
        }
      } catch {
        // Storage safety
      }
    }
    return INITIAL_WORLDS[0].id;
  });

  const [activeWorld, setActiveWorld] = useState<WorldData | null>(null);

  // Modals
  const [isUnityModalOpen, setIsUnityModalOpen] = useState<boolean>(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [editingWorld, setEditingWorld] = useState<WorldData | null>(null);
  const [deletingWorld, setDeletingWorld] = useState<WorldData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync worlds to localStorage
  const saveWorlds = (updatedList: WorldData[]) => {
    setWorlds(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // Storage safety
    }
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
  };

  // Play a world
  const handlePlayWorld = (world: WorldData) => {
    setActiveWorld(world);
    setScreen('loading_world');
  };

  // When loading finishes
  const handleWorldLoaded = () => {
    setScreen('in_world');
  };

  // Exit world view (from pause menu)
  const handleExitWorld = (updatedWorld: WorldData) => {
    const updated = worlds.map(w => w.id === updatedWorld.id ? updatedWorld : w);
    saveWorlds(updated);
    setActiveWorld(null);
    setScreen('world_select');
  };

  // Create new world
  const handleCreateWorld = (newWorld: WorldData) => {
    const updated = [newWorld, ...worlds];
    saveWorlds(updated);
    setSelectedWorldId(newWorld.id);
    handlePlayWorld(newWorld);
  };

  // Edit world
  const handleSaveEditedWorld = (updated: WorldData) => {
    const next = worlds.map(w => w.id === updated.id ? updated : w);
    saveWorlds(next);
    setEditingWorld(null);
  };

  // Delete world
  const handleConfirmDelete = () => {
    if (!deletingWorld) return;
    const next = worlds.filter(w => w.id !== deletingWorld.id);
    saveWorlds(next);
    setDeletingWorld(null);
    if (selectedWorldId === deletingWorld.id) {
      setSelectedWorldId(next.length > 0 ? next[0].id : null);
    }
  };

  // Duplicate world
  const handleDuplicateWorld = (source: WorldData) => {
    soundManager.playButtonClick();
    const copy: WorldData = {
      ...source,
      id: `world-${Date.now()}`,
      name: `${source.name} (Копия)`,
      folderName: `${source.folderName}_Copy`,
      created: Date.now(),
      lastPlayed: Date.now(),
      modifiedBlocks: source.modifiedBlocks ? { ...source.modifiedBlocks } : undefined
    };
    const next = [copy, ...worlds];
    saveWorlds(next);
    setSelectedWorldId(copy.id);
  };

  // Export world save file
  const handleExportWorld = (world: WorldData) => {
    soundManager.playButtonClick();
    const exportData = {
      ...world,
      unityEngine: 'C# Procedural Voxel Engine PC',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${world.folderName}.world.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset to default worlds
  const handleResetWorlds = () => {
    saveWorlds(INITIAL_WORLDS);
    setSelectedWorldId(INITIAL_WORLDS[0].id);
  };

  return (
    <main className="w-full min-h-screen bg-black text-white font-mono select-none overflow-hidden">
      {/* 1. Main Menu Screen */}
      {screen === 'main_menu' && (
        <MainMenu
          onSingleplayer={() => setScreen('world_select')}
          onOpenUnityCode={() => setIsUnityModalOpen(true)}
          onOptions={() => setIsOptionsOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 2. World Selection Screen */}
      {screen === 'world_select' && (
        <WorldSelectScreen
          worlds={worlds}
          selectedWorldId={selectedWorldId}
          onSelectWorld={(id) => setSelectedWorldId(id)}
          onPlayWorld={handlePlayWorld}
          onCreateWorld={() => setScreen('create_world')}
          onEditWorld={(w) => setEditingWorld(w)}
          onDeleteWorld={(w) => setDeletingWorld(w)}
          onDuplicateWorld={handleDuplicateWorld}
          onExportWorld={handleExportWorld}
          onOpenUnityModal={() => setIsUnityModalOpen(true)}
          onBack={() => setScreen('main_menu')}
        />
      )}

      {/* 3. Create World Screen */}
      {screen === 'create_world' && (
        <CreateWorldScreen
          onCreate={handleCreateWorld}
          onCancel={() => setScreen('world_select')}
        />
      )}

      {/* 4. Loading World Screen */}
      {screen === 'loading_world' && activeWorld && (
        <LoadingWorldScreen
          world={activeWorld}
          onLoaded={handleWorldLoaded}
        />
      )}

      {/* 5. 3D Interactive Voxel World View */}
      {screen === 'in_world' && activeWorld && (
        <VoxelWorldView
          world={activeWorld}
          onExit={handleExitWorld}
          onOpenUnityCode={() => setIsUnityModalOpen(true)}
        />
      )}

      {/* MODALS */}
      <UnityProjectModal
        isOpen={isUnityModalOpen}
        onClose={() => setIsUnityModalOpen(false)}
      />

      {editingWorld && (
        <EditWorldModal
          world={editingWorld}
          isOpen={true}
          onSave={handleSaveEditedWorld}
          onClose={() => setEditingWorld(null)}
        />
      )}

      {deletingWorld && (
        <DeleteConfirmModal
          world={deletingWorld}
          isOpen={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingWorld(null)}
        />
      )}

      <OptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        onResetWorlds={handleResetWorlds}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    </main>
  );
}
