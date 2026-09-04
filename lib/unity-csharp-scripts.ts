import JSZip from 'jszip';

export interface CSharpScriptFile {
  name: string;
  category: 'generation' | 'saving' | 'mesh' | 'manager' | 'data';
  description: string;
  code: string;
}

export const UNITY_CSHARP_SCRIPTS: CSharpScriptFile[] = [
  {
    name: 'TerrainGenerator.cs',
    category: 'generation',
    description: 'Генератор ландшафта для Unity C#. Поддерживает обычный мир (3D шум Перлина, биомы, пещеры, деревья) и суперплоский мир с настраиваемыми слоями.',
    code: `using System;
using System.Collections.Generic;
using UnityEngine;

namespace VoxelEngine
{
    public enum WorldType
    {
        Default, // Обычный процедурный мир
        Flat     // Суперплоский мир
    }

    public enum BlockType : byte
    {
        Air = 0,
        Grass = 1,
        Dirt = 2,
        Stone = 3,
        Cobblestone = 4,
        Bedrock = 5,
        Sand = 6,
        Wood = 7,
        Leaves = 8,
        Water = 9,
        Glass = 10,
        Brick = 11,
        Plank = 12
    }

    [System.Serializable]
    public struct FlatLayerConfig
    {
        public BlockType blockType;
        public int count;
    }

    /// <summary>
    /// Процедурный генератор воксельного ландшафта Unity C#
    /// Реализует генерацию двух типов миров: Default (Обычный) и Flat (Суперплоский)
    /// </summary>
    public class TerrainGenerator
    {
        public const int CHUNK_SIZE_X = 16;
        public const int CHUNK_SIZE_Z = 16;
        public const int CHUNK_HEIGHT = 128;

        private readonly WorldData worldSettings;
        private readonly int seedHash;
        private readonly float noiseScale = 0.035f;

        public TerrainGenerator(WorldData settings)
        {
            this.worldSettings = settings;
            this.seedHash = settings.seed.GetHashCode();
        }

        /// <summary>
        /// Главная точка генерации массива вокселей для одного чанка
        /// </summary>
        public BlockType[,,] GenerateChunkVoxels(Vector3Int chunkCoord)
        {
            BlockType[,,] blocks = new BlockType[CHUNK_SIZE_X, CHUNK_HEIGHT, CHUNK_SIZE_Z];

            if (worldSettings.worldType == WorldType.Flat)
            {
                GenerateFlatChunk(blocks);
            }
            else
            {
                GenerateDefaultProceduralChunk(chunkCoord, blocks);
            }

            return blocks;
        }

        /// <summary>
        /// Генерация суперплоского мира по настраиваемым слоям (Bedrock, Dirt, Grass)
        /// </summary>
        private void GenerateFlatChunk(BlockType[,,] blocks)
        {
            List<FlatLayerConfig> layers = worldSettings.flatLayers ?? GetDefaultFlatLayers();

            int currentY = 0;
            for (int l = layers.Count - 1; l >= 0; l--)
            {
                var layer = layers[l];
                for (int i = 0; i < layer.count && currentY < CHUNK_HEIGHT; i++)
                {
                    for (int x = 0; x < CHUNK_SIZE_X; x++)
                    {
                        for (int z = 0; z < CHUNK_SIZE_Z; z++)
                        {
                            blocks[x, currentY, z] = layer.blockType;
                        }
                    }
                    currentY++;
                }
            }

            // Оставшаяся часть чанка заполняется воздухом
            while (currentY < CHUNK_HEIGHT)
            {
                for (int x = 0; x < CHUNK_SIZE_X; x++)
                {
                    for (int z = 0; z < CHUNK_SIZE_Z; z++)
                    {
                        blocks[x, currentY, z] = BlockType.Air;
                    }
                }
                currentY++;
            }
        }

        /// <summary>
        /// Генерация обычного мира с холмами, стратификацией пород, пещерами и деревьями
        /// </summary>
        private void GenerateDefaultProceduralChunk(Vector3Int chunkCoord, BlockType[,,] blocks)
        {
            int worldStartX = chunkCoord.x * CHUNK_SIZE_X;
            int worldStartZ = chunkCoord.z * CHUNK_SIZE_Z;

            for (int x = 0; x < CHUNK_SIZE_X; x++)
            {
                int worldX = worldStartX + x;

                for (int z = 0; z < CHUNK_SIZE_Z; z++)
                {
                    int worldZ = worldStartZ + z;

                    // Многооктавный шум Перлина (FBM) для высоты рельефа
                    int surfaceHeight = CalculateSurfaceHeight(worldX, worldZ);

                    for (int y = 0; y < CHUNK_HEIGHT; y++)
                    {
                        if (y == 0)
                        {
                            blocks[x, y, z] = BlockType.Bedrock;
                        }
                        else if (y < surfaceHeight - 4)
                        {
                            // Глубокий слой камня с генерацией 3D-пещер
                            if (IsCave(worldX, y, worldZ))
                            {
                                blocks[x, y, z] = BlockType.Air;
                            }
                            else
                            {
                                blocks[x, y, z] = BlockType.Stone;
                            }
                        }
                        else if (y < surfaceHeight)
                        {
                            // Подпочвенный слой земли
                            blocks[x, y, z] = BlockType.Dirt;
                        }
                        else if (y == surfaceHeight)
                        {
                            // Верхний слой: трава или песок у воды
                            blocks[x, y, z] = (surfaceHeight < 14) ? BlockType.Sand : BlockType.Grass;
                        }
                        else if (y <= 12)
                        {
                            // Водоемы в низинах
                            blocks[x, y, z] = BlockType.Water;
                        }
                        else
                        {
                            blocks[x, y, z] = BlockType.Air;
                        }
                    }

                    // Генерация дубовых деревьев на сухой траве
                    if (worldSettings.generateStructures && surfaceHeight > 15)
                    {
                        if (ShouldSpawnTree(worldX, worldZ))
                        {
                            PlantTree(blocks, x, surfaceHeight + 1, z);
                        }
                    }
                }
            }
        }

        private int CalculateSurfaceHeight(int worldX, int worldZ)
        {
            float seedOffset = seedHash % 10000;
            float nx = (worldX + seedOffset) * noiseScale;
            float nz = (worldZ + seedOffset) * noiseScale;

            // Октава 1: Базовые холмы
            float elevation = Mathf.PerlinNoise(nx, nz);
            // Октава 2: Детализация
            float detail = Mathf.PerlinNoise(nx * 2.2f, nz * 2.2f) * 0.5f;
            // Октава 3: Мелкие неровности
            float rough = Mathf.PerlinNoise(nx * 4.4f, nz * 4.4f) * 0.25f;

            float combined = (elevation + detail + rough) / 1.75f;
            int baseHeight = 22;
            int amplitude = 18;

            return Mathf.Clamp(baseHeight + Mathf.RoundToInt(combined * amplitude), 1, CHUNK_HEIGHT - 10);
        }

        private bool IsCave(int wx, int wy, int wz)
        {
            float caveScale = 0.05f;
            float seedOffset = seedHash % 5000;
            // 3D шум на основе смещения выборок 2D Perlin
            float sample1 = Mathf.PerlinNoise((wx + seedOffset) * caveScale, (wy + seedOffset) * caveScale);
            float sample2 = Mathf.PerlinNoise((wy + seedOffset) * caveScale, (wz + seedOffset) * caveScale);
            return (sample1 + sample2) * 0.5f > 0.68f;
        }

        private bool ShouldSpawnTree(int wx, int wz)
        {
            float treeNoise = Mathf.PerlinNoise((wx + seedHash) * 0.2f, (wz + seedHash) * 0.2f);
            return treeNoise > 0.82f && (wx * 31 + wz * 17) % 13 == 0;
        }

        private void PlantTree(BlockType[,,] blocks, int lx, int startY, int lz)
        {
            if (lx < 2 || lx > CHUNK_SIZE_X - 3 || lz < 2 || lz > CHUNK_SIZE_Z - 3) return;
            if (startY + 6 >= CHUNK_HEIGHT) return;

            // Ствол дерева (4-5 блоков)
            int trunkHeight = 5;
            for (int y = 0; y < trunkHeight; y++)
            {
                blocks[lx, startY + y, lz] = BlockType.Wood;
            }

            // Листва дерева (куб 3x3x2)
            int leafBase = startY + trunkHeight - 2;
            for (int ox = -2; ox <= 2; ox++)
            {
                for (int oz = -2; oz <= 2; oz++)
                {
                    for (int oy = 0; oy <= 2; oy++)
                    {
                        if (Mathf.Abs(ox) == 2 && Mathf.Abs(oz) == 2 && oy == 2) continue; // скругление углов
                        int tx = lx + ox;
                        int ty = leafBase + oy;
                        int tz = lz + oz;

                        if (tx >= 0 && tx < CHUNK_SIZE_X && tz >= 0 && tz < CHUNK_SIZE_Z && ty < CHUNK_HEIGHT)
                        {
                            if (blocks[tx, ty, tz] == BlockType.Air)
                            {
                                blocks[tx, ty, tz] = BlockType.Leaves;
                            }
                        }
                    }
                }
            }
        }

        private List<FlatLayerConfig> GetDefaultFlatLayers()
        {
            return new List<FlatLayerConfig>
            {
                new FlatLayerConfig { blockType = BlockType.Grass, count = 1 },
                new FlatLayerConfig { blockType = BlockType.Dirt, count = 2 },
                new FlatLayerConfig { blockType = BlockType.Bedrock, count = 1 }
            };
        }
    }
}
`
  },
  {
    name: 'SaveSystem.cs',
    category: 'saving',
    description: 'Система сохранения файлов на диск ПК. Записывает WorldData.json и модифицированные блоки в папку Application.persistentDataPath/Saves/WorldName.',
    code: `using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;

namespace VoxelEngine
{
    /// <summary>
    /// Менеджер сохранения и загрузки миров на ПК в Unity C#
    /// Каталог хранения: Application.persistentDataPath/Saves/{worldName}/
    /// </summary>
    public static class SaveSystem
    {
        private static string SavesDirectory => Path.Combine(Application.persistentDataPath, "Saves");

        /// <summary>
        /// Инициализация структуры директорий сохранения
        /// </summary>
        public static void EnsureSavesDirectoryExists()
        {
            if (!Directory.Exists(SavesDirectory))
            {
                Directory.CreateDirectory(SavesDirectory);
                Debug.Log($"[SaveSystem] Создана папка сохранений: {SavesDirectory}");
            }
        }

        /// <summary>
        /// Получение пути к конкретной папке мира
        /// </summary>
        public static string GetWorldPath(string folderName)
        {
            EnsureSavesDirectoryExists();
            return Path.Combine(SavesDirectory, folderName);
        }

        /// <summary>
        /// Сохранение метаданных мира (world.json) и измененных вокселей
        /// </summary>
        public static bool SaveWorld(WorldData data, Dictionary<Vector3Int, BlockType> modifiedBlocks)
        {
            try
            {
                string worldDir = GetWorldPath(data.folderName);
                if (!Directory.Exists(worldDir))
                {
                    Directory.CreateDirectory(worldDir);
                }

                data.lastPlayed = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

                // 1. Сохранение WorldData в формате JSON
                string metaJsonPath = Path.Combine(worldDir, "world.json");
                string metaJson = JsonUtility.ToJson(data, true);
                File.WriteAllText(metaJsonPath, metaJson);

                // 2. Сохранение модификаций вокселей в бинарный файл region_mods.bin
                string modsBinaryPath = Path.Combine(worldDir, "modified_voxels.bin");
                using (FileStream fs = new FileStream(modsBinaryPath, FileMode.Create, FileAccess.Write))
                using (BinaryWriter writer = new BinaryWriter(fs))
                {
                    writer.Write(modifiedBlocks != null ? modifiedBlocks.Count : 0);
                    if (modifiedBlocks != null)
                    {
                        foreach (var kvp in modifiedBlocks)
                        {
                            writer.Write(kvp.Key.x);
                            writer.Write(kvp.Key.y);
                            writer.Write(kvp.Key.z);
                            writer.Write((byte)kvp.Value);
                        }
                    }
                }

                Debug.Log($"[SaveSystem] Мир '{data.name}' успешно сохранен в: {worldDir}");
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Ошибка при сохранении мира '{data.name}': {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Загрузка метаданных мира
        /// </summary>
        public static WorldData LoadWorld(string folderName)
        {
            try
            {
                string worldDir = GetWorldPath(folderName);
                string metaJsonPath = Path.Combine(worldDir, "world.json");

                if (!File.Exists(metaJsonPath))
                {
                    Debug.LogWarning($"[SaveSystem] Файл мира не найден: {metaJsonPath}");
                    return null;
                }

                string json = File.ReadAllText(metaJsonPath);
                return JsonUtility.FromJson<WorldData>(json);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Ошибка при загрузке мира '{folderName}': {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Загрузка словаря измененных игроком блоков
        /// </summary>
        public static Dictionary<Vector3Int, BlockType> LoadModifiedBlocks(string folderName)
        {
            var result = new Dictionary<Vector3Int, BlockType>();
            try
            {
                string modsBinaryPath = Path.Combine(GetWorldPath(folderName), "modified_voxels.bin");
                if (!File.Exists(modsBinaryPath)) return result;

                using (FileStream fs = new FileStream(modsBinaryPath, FileMode.Open, FileAccess.Read))
                using (BinaryReader reader = new BinaryReader(fs))
                {
                    int count = reader.ReadInt32();
                    for (int i = 0; i < count; i++)
                    {
                        int x = reader.ReadInt32();
                        int y = reader.ReadInt32();
                        int z = reader.ReadInt32();
                        byte b = reader.ReadByte();
                        result[new Vector3Int(x, y, z)] = (BlockType)b;
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Ошибка при чтении измененных блоков: {ex.Message}");
            }
            return result;
        }

        /// <summary>
        /// Список всех сохраненных миров на ПК
        /// </summary>
        public static List<WorldData> GetAllWorlds()
        {
            EnsureSavesDirectoryExists();
            List<WorldData> list = new List<WorldData>();

            string[] subDirs = Directory.GetDirectories(SavesDirectory);
            foreach (string dir in subDirs)
            {
                string folderName = new DirectoryInfo(dir).Name;
                WorldData data = LoadWorld(folderName);
                if (data != null)
                {
                    list.Add(data);
                }
            }

            // Сортировка по времени последней игры
            list.Sort((a, b) => b.lastPlayed.CompareTo(a.lastPlayed));
            return list;
        }

        /// <summary>
        /// Удаление папки мира
        /// </summary>
        public static bool DeleteWorld(string folderName)
        {
            try
            {
                string worldDir = GetWorldPath(folderName);
                if (Directory.Exists(worldDir))
                {
                    Directory.Delete(worldDir, true);
                    Debug.Log($"[SaveSystem] Папка мира удалена: {worldDir}");
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Не удалось удалить мир '{folderName}': {ex.Message}");
                return false;
            }
        }
    }
}
`
  },
  {
    name: 'WorldManager.cs',
    category: 'manager',
    description: 'Главный Unity MonoBehaviour для динамической загрузки чанков вокруг игрока, многопоточной очереди генерации и управления циклами жизни вокселей.',
    code: `using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

namespace VoxelEngine
{
    /// <summary>
    /// Контроллер загрузки и выгрузки чанков вокруг позиции камеры/игрока
    /// </summary>
    public class WorldManager : MonoBehaviour
    {
        [Header("Настройки")]
        public Transform playerTransform;
        public GameObject chunkPrefab;
        public Material voxelMaterial;
        public int renderDistance = 4; // Радиус чанков

        [Header("Текущий мир")]
        public WorldData activeWorld;

        private TerrainGenerator generator;
        private Dictionary<Vector2Int, VoxelChunk> activeChunks = new Dictionary<Vector2Int, VoxelChunk>();
        private Dictionary<Vector3Int, BlockType> modifiedBlocks = new Dictionary<Vector3Int, BlockType>();
        private Vector2Int lastPlayerChunkCoord;
        private bool isGenerating = false;

        private void Start()
        {
            if (activeWorld == null)
            {
                // Загружаем мир по умолчанию, если не передан из меню
                activeWorld = SaveSystem.LoadWorld("New World") ?? CreateFallbackWorld();
            }

            generator = new TerrainGenerator(activeWorld);
            modifiedBlocks = SaveSystem.LoadModifiedBlocks(activeWorld.folderName);

            StartCoroutine(InitialWorldSpawn());
        }

        private IEnumerator InitialWorldSpawn()
        {
            yield return StartCoroutine(UpdateChunksAroundPlayer(forceUpdate: true));
            Debug.Log("[WorldManager] Первоначальная генерация мира завершена!");
        }

        private void Update()
        {
            if (playerTransform == null) return;

            Vector2Int currentChunkCoord = new Vector2Int(
                Mathf.FloorToInt(playerTransform.position.x / TerrainGenerator.CHUNK_SIZE_X),
                Mathf.FloorToInt(playerTransform.position.z / TerrainGenerator.CHUNK_SIZE_Z)
            );

            if (currentChunkCoord != lastPlayerChunkCoord && !isGenerating)
            {
                lastPlayerChunkCoord = currentChunkCoord;
                StartCoroutine(UpdateChunksAroundPlayer(forceUpdate: false));
            }
        }

        private IEnumerator UpdateChunksAroundPlayer(bool forceUpdate)
        {
            isGenerating = true;
            HashSet<Vector2Int> requiredCoords = new HashSet<Vector2Int>();

            for (int x = -renderDistance; x <= renderDistance; x++)
            {
                for (int z = -renderDistance; z <= renderDistance; z++)
                {
                    if (x * x + z * z <= renderDistance * renderDistance)
                    {
                        Vector2Int coord = new Vector2Int(lastPlayerChunkCoord.x + x, lastPlayerChunkCoord.y + z);
                        requiredCoords.Add(coord);

                        if (!activeChunks.ContainsKey(coord))
                        {
                            yield return SpawnChunkAsync(coord);
                        }
                    }
                }
            }

            // Выгрузка далеких чанков
            List<Vector2Int> toRemove = new List<Vector2Int>();
            foreach (var kvp in activeChunks)
            {
                if (!requiredCoords.Contains(kvp.Key))
                {
                    toRemove.Add(kvp.Key);
                }
            }

            foreach (var coord in toRemove)
            {
                Destroy(activeChunks[coord].gameObject);
                activeChunks.Remove(coord);
            }

            isGenerating = false;
        }

        private IEnumerator SpawnChunkAsync(Vector2Int coord)
        {
            Vector3 worldPos = new Vector3(coord.x * TerrainGenerator.CHUNK_SIZE_X, 0, coord.y * TerrainGenerator.CHUNK_SIZE_Z);
            GameObject chunkObj = Instantiate(chunkPrefab, worldPos, Quaternion.identity, transform);
            chunkObj.name = $"Chunk_{coord.x}_{coord.y}";

            VoxelChunk chunk = chunkObj.GetComponent<VoxelChunk>();
            activeChunks[coord] = chunk;

            // Фоновая генерация воксельных данных через Task (асинхронность C#)
            Task<BlockType[,,]> genTask = Task.Run(() => generator.GenerateChunkVoxels(new Vector3Int(coord.x, 0, coord.y)));
            while (!genTask.IsCompleted)
            {
                yield return null;
            }

            BlockType[,,] voxelData = genTask.Result;
            ApplyPlayerModifications(coord, voxelData);

            chunk.Initialize(coord, voxelData, voxelMaterial);
            chunk.BuildMesh();
        }

        private void ApplyPlayerModifications(Vector2Int chunkCoord, BlockType[,,] voxels)
        {
            int startX = chunkCoord.x * TerrainGenerator.CHUNK_SIZE_X;
            int startZ = chunkCoord.y * TerrainGenerator.CHUNK_SIZE_Z;

            foreach (var kvp in modifiedBlocks)
            {
                Vector3Int pos = kvp.Key;
                if (pos.x >= startX && pos.x < startX + TerrainGenerator.CHUNK_SIZE_X &&
                    pos.z >= startZ && pos.z < startZ + TerrainGenerator.CHUNK_SIZE_Z &&
                    pos.y >= 0 && pos.y < TerrainGenerator.CHUNK_HEIGHT)
                {
                    voxels[pos.x - startX, pos.y, pos.z - startZ] = kvp.Value;
                }
            }
        }

        public void ModifyBlock(Vector3Int worldPos, BlockType newBlock)
        {
            modifiedBlocks[worldPos] = newBlock;

            Vector2Int chunkCoord = new Vector2Int(
                Mathf.FloorToInt((float)worldPos.x / TerrainGenerator.CHUNK_SIZE_X),
                Mathf.FloorToInt((float)worldPos.z / TerrainGenerator.CHUNK_SIZE_Z)
            );

            if (activeChunks.TryGetValue(chunkCoord, out VoxelChunk chunk))
            {
                int localX = worldPos.x - chunkCoord.x * TerrainGenerator.CHUNK_SIZE_X;
                int localZ = worldPos.z - chunkCoord.y * TerrainGenerator.CHUNK_SIZE_Z;
                chunk.SetVoxel(localX, worldPos.y, localZ, newBlock);
                chunk.BuildMesh();
            }
        }

        public void SaveCurrentWorld()
        {
            if (activeWorld != null)
            {
                if (playerTransform != null)
                {
                    activeWorld.playerPos = playerTransform.position;
                    activeWorld.playerRot = playerTransform.eulerAngles;
                }
                SaveSystem.SaveWorld(activeWorld, modifiedBlocks);
            }
        }

        private void OnApplicationQuit()
        {
            SaveCurrentWorld();
        }

        private WorldData CreateFallbackWorld()
        {
            return new WorldData
            {
                name = "Новый мир",
                folderName = "New World",
                worldType = WorldType.Default,
                seed = "UnityDefaultSeed",
                generateStructures = true,
                gameMode = "survival"
            };
        }
    }
}
`
  },
  {
    name: 'VoxelChunk.cs',
    category: 'mesh',
    description: 'Оптимизированное построение полигонального меша чанка в Unity. Отсечение скрытых граней (Face Culling), генерация UV и MeshCollider.',
    code: `using System.Collections.Generic;
using UnityEngine;

namespace VoxelEngine
{
    [RequireComponent(typeof(MeshFilter), typeof(MeshRenderer), typeof(MeshCollider))]
    public class VoxelChunk : MonoBehaviour
    {
        public Vector2Int ChunkCoord { get; private set; }
        private BlockType[,,] voxels;
        private MeshFilter meshFilter;
        private MeshRenderer meshRenderer;
        private MeshCollider meshCollider;

        private List<Vector3> vertices = new List<Vector3>();
        private List<int> triangles = new List<int>();
        private List<Vector2> uvs = new List<Vector2>();

        public void Initialize(Vector2Int coord, BlockType[,,] data, Material mat)
        {
            this.ChunkCoord = coord;
            this.voxels = data;

            meshFilter = GetComponent<MeshFilter>();
            meshRenderer = GetComponent<MeshRenderer>();
            meshCollider = GetComponent<MeshCollider>();

            meshRenderer.material = mat;
        }

        public void SetVoxel(int x, int y, int z, BlockType block)
        {
            if (x >= 0 && x < TerrainGenerator.CHUNK_SIZE_X &&
                y >= 0 && y < TerrainGenerator.CHUNK_HEIGHT &&
                z >= 0 && z < TerrainGenerator.CHUNK_SIZE_Z)
            {
                voxels[x, y, z] = block;
            }
        }

        /// <summary>
        /// Построение меша с отсечением внутренних невидимых граней (Face Culling)
        /// </summary>
        public void BuildMesh()
        {
            vertices.Clear();
            triangles.Clear();
            uvs.Clear();

            int sx = TerrainGenerator.CHUNK_SIZE_X;
            int sy = TerrainGenerator.CHUNK_HEIGHT;
            int sz = TerrainGenerator.CHUNK_SIZE_Z;

            for (int x = 0; x < sx; x++)
            {
                for (int y = 0; y < sy; y++)
                {
                    for (int z = 0; z < sz; z++)
                    {
                        BlockType current = voxels[x, y, z];
                        if (current == BlockType.Air) continue;

                        Vector3 blockPos = new Vector3(x, y, z);

                        // Проверка 6 сторон куба: Верх, Низ, Север, Юг, Восток, Запад
                        if (IsTransparent(x, y + 1, z)) AddFace(blockPos, Vector3.up, current);
                        if (IsTransparent(x, y - 1, z)) AddFace(blockPos, Vector3.down, current);
                        if (IsTransparent(x, y, z + 1)) AddFace(blockPos, Vector3.forward, current);
                        if (IsTransparent(x, y, z - 1)) AddFace(blockPos, Vector3.back, current);
                        if (IsTransparent(x + 1, y, z)) AddFace(blockPos, Vector3.right, current);
                        if (IsTransparent(x - 1, y, z)) AddFace(blockPos, Vector3.left, current);
                    }
                }
            }

            Mesh mesh = new Mesh
            {
                vertices = vertices.ToArray(),
                triangles = triangles.ToArray(),
                uv = uvs.ToArray()
            };

            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            meshFilter.sharedMesh = mesh;
            meshCollider.sharedMesh = mesh;
        }

        private bool IsTransparent(int x, int y, int z)
        {
            if (x < 0 || x >= TerrainGenerator.CHUNK_SIZE_X ||
                y < 0 || y >= TerrainGenerator.CHUNK_HEIGHT ||
                z < 0 || z >= TerrainGenerator.CHUNK_SIZE_Z)
            {
                return true; // Граничный блок (считаем открытым)
            }
            return voxels[x, y, z] == BlockType.Air || voxels[x, y, z] == BlockType.Water || voxels[x, y, z] == BlockType.Glass;
        }

        private void AddFace(Vector3 pos, Vector3 normal, BlockType block)
        {
            int startIndex = vertices.Count;

            // Вершины грани в зависимости от нормали
            if (normal == Vector3.up)
            {
                vertices.Add(pos + new Vector3(0, 1, 0));
                vertices.Add(pos + new Vector3(0, 1, 1));
                vertices.Add(pos + new Vector3(1, 1, 1));
                vertices.Add(pos + new Vector3(1, 1, 0));
            }
            else if (normal == Vector3.down)
            {
                vertices.Add(pos + new Vector3(0, 0, 0));
                vertices.Add(pos + new Vector3(1, 0, 0));
                vertices.Add(pos + new Vector3(1, 0, 1));
                vertices.Add(pos + new Vector3(0, 0, 1));
            }
            else if (normal == Vector3.forward)
            {
                vertices.Add(pos + new Vector3(1, 0, 1));
                vertices.Add(pos + new Vector3(1, 1, 1));
                vertices.Add(pos + new Vector3(0, 1, 1));
                vertices.Add(pos + new Vector3(0, 0, 1));
            }
            else if (normal == Vector3.back)
            {
                vertices.Add(pos + new Vector3(0, 0, 0));
                vertices.Add(pos + new Vector3(0, 1, 0));
                vertices.Add(pos + new Vector3(1, 1, 0));
                vertices.Add(pos + new Vector3(1, 0, 0));
            }
            else if (normal == Vector3.right)
            {
                vertices.Add(pos + new Vector3(1, 0, 0));
                vertices.Add(pos + new Vector3(1, 1, 0));
                vertices.Add(pos + new Vector3(1, 1, 1));
                vertices.Add(pos + new Vector3(1, 0, 1));
            }
            else if (normal == Vector3.left)
            {
                vertices.Add(pos + new Vector3(0, 0, 1));
                vertices.Add(pos + new Vector3(0, 1, 1));
                vertices.Add(pos + new Vector3(0, 1, 0));
                vertices.Add(pos + new Vector3(0, 0, 0));
            }

            // 2 треугольника на грань
            triangles.Add(startIndex);
            triangles.Add(startIndex + 1);
            triangles.Add(startIndex + 2);

            triangles.Add(startIndex);
            triangles.Add(startIndex + 2);
            triangles.Add(startIndex + 3);

            // UV координаты для текстурного атласа
            Vector2 uvOffset = GetAtlasUVOffset(block, normal);
            float tileSize = 1f / 16f; // Атлас 16x16 блоков

            uvs.Add(uvOffset + new Vector2(0, 0));
            uvs.Add(uvOffset + new Vector2(0, tileSize));
            uvs.Add(uvOffset + new Vector2(tileSize, tileSize));
            uvs.Add(uvOffset + new Vector2(tileSize, 0));
        }

        private Vector2 GetAtlasUVOffset(BlockType block, Vector3 normal)
        {
            // Пример расчета плитки в атласе 16x16
            int tileIndex = (int)block;
            if (block == BlockType.Grass)
            {
                tileIndex = (normal == Vector3.up) ? 0 : (normal == Vector3.down ? 2 : 1);
            }
            int u = tileIndex % 16;
            int v = 15 - (tileIndex / 16);
            return new Vector2(u * (1f / 16f), v * (1f / 16f));
        }
    }
}
`
  },
  {
    name: 'WorldData.cs',
    category: 'data',
    description: 'Сериализуемые классы данных мира (WorldData, FlatLayerConfig, PlayerSaveData) для JSON и бинарного форматирования.',
    code: `using System;
using System.Collections.Generic;
using UnityEngine;

namespace VoxelEngine
{
    [System.Serializable]
    public class WorldData
    {
        public string name;
        public string folderName;
        public WorldType worldType;
        public string gameMode;
        public string difficulty;
        public string seed;
        public long createdTime;
        public long lastPlayed;
        public bool allowCheats;
        public bool generateStructures;
        public List<FlatLayerConfig> flatLayers;

        // Позиция игрока на ПК
        public Vector3 playerPos;
        public Vector3 playerRot;

        public WorldData()
        {
            createdTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            lastPlayed = createdTime;
            worldType = WorldType.Default;
            gameMode = "survival";
            difficulty = "normal";
            seed = UnityEngine.Random.Range(100000, 999999999).ToString();
            allowCheats = false;
            generateStructures = true;
            playerPos = new Vector3(0, 25, 0);
            playerRot = Vector3.zero;
        }
    }
}
`
  }
];

export async function createUnityScriptsZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('Assets/Scripts/VoxelEngine');

  for (const script of UNITY_CSHARP_SCRIPTS) {
    folder?.file(script.name, script.code);
  }

  // Добавим README
  folder?.file(
    'README_UNITY_INSTRUCTIONS.txt',
    `ИНСТРУКЦИЯ ПО ПОДКЛЮЧЕНИЮ В UNITY ДЛЯ ПК:
1. Распакуйте папку 'Assets/Scripts/VoxelEngine' в проект Unity (2021.3+, 2022.3+, 6000+).
2. Создайте пустой GameObject в сцене с именем 'WorldManager'.
3. Прикрепите компонент 'WorldManager.cs'.
4. Создайте префаб чанка с компонентом 'VoxelChunk.cs' (MeshFilter, MeshRenderer, MeshCollider) и назначьте в поле chunkPrefab.
5. Назначьте текстурный атлас вокселей (Default Unlit / Standard Shader с пиксельной фильтрацией Point).
6. Запустите сцену: ландшафт сгенерируется процедурно для плоского или обычного мира, а сохранения автоматически сохраняются на диск ПК!`
  );

  return await zip.generateAsync({ type: 'blob' });
}
