'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UNITY_CSHARP_SCRIPTS, createUnityScriptsZipBlob, CSharpScriptFile } from '@/lib/unity-csharp-scripts';
import { MinecraftButton } from './MinecraftButton';
import { soundManager } from '@/lib/audio-manager';
import { Download, Copy, Check, FileCode, Sliders, ExternalLink, X, Cpu, Layers } from 'lucide-react';

interface UnityProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnityProjectModal: React.FC<UnityProjectModalProps> = ({ isOpen, onClose }) => {
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'code' | 'simulator'>('code');

  // Simulator state
  const [simWorldType, setSimWorldType] = useState<'default' | 'flat'>('default');
  const [simSeed, setSimSeed] = useState<number>(746198);
  const [simOctaves, setSimOctaves] = useState<number>(3);
  const [simScale, setSimScale] = useState<number>(0.04);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeScript: CSharpScriptFile = UNITY_CSHARP_SCRIPTS[selectedScriptIndex] || UNITY_CSHARP_SCRIPTS[0];

  const handleCopy = () => {
    soundManager.playButtonClick();
    navigator.clipboard.writeText(activeScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    soundManager.playButtonClick();
    setIsZipping(true);
    try {
      const blob = await createUnityScriptsZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Unity_Minecraft_Voxel_Engine_CSharp.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Render simulator heightmap preview
  useEffect(() => {
    if (viewMode !== 'simulator') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (simWorldType === 'flat') {
      // Draw flat landscape profile
      const groundY = Math.floor(height * 0.65);
      // Sky
      ctx.fillStyle = '#78a7ff';
      ctx.fillRect(0, 0, width, groundY);
      // Grass line
      ctx.fillStyle = '#5b8f36';
      ctx.fillRect(0, groundY, width, 14);
      // Dirt
      ctx.fillStyle = '#66452c';
      ctx.fillRect(0, groundY + 14, width, 28);
      // Bedrock
      ctx.fillStyle = '#262626';
      ctx.fillRect(0, groundY + 42, width, height - (groundY + 42));

      // Grid overlay
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let x = 0; x < width; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    } else {
      // Default procedural Perlin terrain profile
      // Sky
      ctx.fillStyle = '#6fa1ff';
      ctx.fillRect(0, 0, width, height);

      // Draw multi-column terrain
      const cols = width;
      ctx.fillStyle = '#5b8f36';

      for (let x = 0; x < cols; x++) {
        let n = 0;
        let freq = simScale;
        let amp = 1.0;
        let maxAmp = 0;

        for (let o = 0; o < simOctaves; o++) {
          const sample = Math.sin((x + simSeed) * freq) * Math.cos((x * 0.7 + simSeed * 0.3) * freq);
          n += sample * amp;
          maxAmp += amp;
          freq *= 2.1;
          amp *= 0.5;
        }

        const norm = (n / maxAmp + 1) * 0.5;
        const terrainHeight = Math.floor(norm * 85 + 35);
        const groundY = height - terrainHeight;

        // Draw Grass top
        ctx.fillStyle = '#5b8f36';
        ctx.fillRect(x, groundY, 1, 6);

        // Draw Dirt sub-layer
        ctx.fillStyle = '#66452c';
        ctx.fillRect(x, groundY + 6, 1, 16);

        // Draw Stone deep-layer
        ctx.fillStyle = '#777777';
        ctx.fillRect(x, groundY + 22, 1, terrainHeight - 22);

        // Draw Bedrock
        ctx.fillStyle = '#262626';
        ctx.fillRect(x, height - 8, 1, 8);

        // Trees chance
        if (x % 36 === 0 && terrainHeight > 40 && x > 20 && x < width - 20) {
          // Trunk
          ctx.fillStyle = '#6b5130';
          ctx.fillRect(x - 2, groundY - 20, 5, 20);
          // Foliage
          ctx.fillStyle = '#376822';
          ctx.fillRect(x - 10, groundY - 32, 21, 14);
        }
      }
    }
  }, [viewMode, simWorldType, simSeed, simOctaves, simScale]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 font-mono select-none">
      <div className="bg-mc-dark-dirt border-4 border-black w-full max-w-5xl max-h-[92vh] flex flex-col mc-card-bevel overflow-hidden">
        {/* Modal Header */}
        <div className="bg-mc-stone p-3 sm:p-4 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white text-mc-shadow">
                Движок Unity C# | Обработка ландшафта и сохранения файлов на ПК
              </h2>
              <p className="text-xs text-neutral-300">
                Полный исходный код скриптов C# для Unity 2021.3+ / 2022+ / Unity 6
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center bg-red-900/80 hover:bg-red-700 text-white font-bold border border-black shadow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle: Code Scripts vs Generator Simulator */}
        <div className="bg-neutral-900/90 px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewMode('code');
                soundManager.playButtonClick();
              }}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                viewMode === 'code' ? 'bg-[#404040] text-yellow-300 border-b-2 border-yellow-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 inline mr-1" />
              Скрипты C# ({UNITY_CSHARP_SCRIPTS.length})
            </button>

            <button
              onClick={() => {
                setViewMode('simulator');
                soundManager.playButtonClick();
              }}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                viewMode === 'simulator' ? 'bg-[#404040] text-yellow-300 border-b-2 border-yellow-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 inline mr-1" />
              Интерактивный симулятор шума ландшафта
            </button>
          </div>

          {/* Download Zip CTA */}
          <MinecraftButton
            size="sm"
            variant="success"
            disabled={isZipping}
            onClick={handleDownloadZip}
          >
            <Download className="w-4 h-4" />
            {isZipping ? 'Упаковка ZIP...' : 'Скачать все скрипты (.zip)'}
          </MinecraftButton>
        </div>

        {/* Content Area */}
        {viewMode === 'code' ? (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Script Selector Sidebar */}
            <div className="w-full md:w-64 bg-[#141414] border-b md:border-b-0 md:border-r border-black p-2 overflow-y-auto">
              <div className="text-[11px] font-bold uppercase text-neutral-400 px-2 py-1 mb-1">
                Файлы проекта Unity:
              </div>
              <div className="space-y-1">
                {UNITY_CSHARP_SCRIPTS.map((script, idx) => (
                  <button
                    key={script.name}
                    onClick={() => {
                      setSelectedScriptIndex(idx);
                      soundManager.playButtonClick();
                    }}
                    className={`
                      w-full text-left px-3 py-2 text-xs font-mono transition-colors flex flex-col
                      ${selectedScriptIndex === idx ? 'bg-[#2b2b2b] text-yellow-300 border-l-4 border-yellow-400' : 'text-neutral-300 hover:bg-[#1f1f1f]'}
                    `}
                  >
                    <span className="font-bold">{script.name}</span>
                    <span className="text-[10px] text-neutral-400 line-clamp-1">{script.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Code Viewer */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0d] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-[#181818] border-b border-black text-xs text-neutral-300">
                <div>
                  <span className="font-bold text-white">{activeScript.name}</span>
                  <span className="text-neutral-400 ml-2">— {activeScript.description}</span>
                </div>
                <MinecraftButton size="sm" variant="secondary" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Скопировано!' : 'Копировать C#'}
                </MinecraftButton>
              </div>

              <div className="flex-1 p-4 overflow-auto font-mono text-xs text-neutral-200 leading-relaxed select-text">
                <pre className="whitespace-pre">{activeScript.code}</pre>
              </div>
            </div>
          </div>
        ) : (
          /* Landscape Generator Simulator */
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#111111]">
            <div className="bg-[#1c1c1c] border border-neutral-800 p-4 rounded">
              <h3 className="text-base font-bold text-white mb-2">
                Симуляция алгоритмов генерации Unity C# (Шум Перлина и слои)
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                Этот симулятор показывает, как математический расчет функции <code className="text-yellow-300">CalculateSurfaceHeight()</code> и слои <code className="text-yellow-300">GenerateFlatChunk()</code> строят профиль земной коры на ПК.
              </p>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-bold">Тип мира:</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSimWorldType('default')}
                      className={`flex-1 py-1 px-2 border ${simWorldType === 'default' ? 'bg-emerald-800 text-white border-emerald-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}
                    >
                      Обычный
                    </button>
                    <button
                      onClick={() => setSimWorldType('flat')}
                      className={`flex-1 py-1 px-2 border ${simWorldType === 'flat' ? 'bg-lime-800 text-white border-lime-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}
                    >
                      Плоский
                    </button>
                  </div>
                </div>

                {simWorldType === 'default' && (
                  <>
                    <div>
                      <label className="block text-neutral-400 mb-1 font-bold">Сид генератора: {simSeed}</label>
                      <button
                        onClick={() => setSimSeed(Math.floor(Math.random() * 999999))}
                        className="w-full py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white"
                      >
                        Перегенерировать сид
                      </button>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1 font-bold">Октавы шума: {simOctaves}</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={simOctaves}
                        onChange={(e) => setSimOctaves(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1 font-bold">Масштаб шума: {simScale.toFixed(3)}</label>
                      <input
                        type="range"
                        min="0.01"
                        max="0.09"
                        step="0.005"
                        value={simScale}
                        onChange={(e) => setSimScale(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Canvas Profile */}
              <div className="border-2 border-black bg-black p-1 rounded overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={180}
                  className="w-full h-44 image-rendering-pixelated bg-black"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 mt-2">
                <span>Профиль высот ландшафта (Разрез чанков)</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#5b8f36] inline-block"></span> Трава</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#66452c] inline-block"></span> Земля</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#777777] inline-block"></span> Камень</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#262626] inline-block"></span> Бедрок</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-mc-stone p-3 flex items-center justify-between border-t-2 border-black text-xs text-neutral-300">
          <div>
            Путь сохранений на ПК: <code className="bg-black/60 px-1.5 py-0.5 rounded text-yellow-300">%USERPROFILE%/AppData/LocalLow/.../Saves/</code>
          </div>
          <MinecraftButton size="sm" variant="primary" onClick={onClose}>
            Закрыть
          </MinecraftButton>
        </div>
      </div>
    </div>
  );
};
