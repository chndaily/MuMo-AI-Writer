import { useState, useEffect, useCallback } from 'react';
import visualizationService from '@/services/visualizationService';

// 图表数据类型
export interface ChartNode {
  id: string;
  name: string;
  type: string;
  group: number;
  description?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface ChartLink {
  source: string | number;
  target: string | number;
  value: number;
  type: string;
  description?: string;
}

export interface ChartData {
  nodes: ChartNode[];
  links: ChartLink[];
}

// 可视化数据Hook
export const useVisualizationData = (novelId: string | undefined) => {
  // 直接使用 databaseManager 获取数据
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [cultures, setCultures] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [magics, setMagics] = useState<any[]>([]);
  const [histories, setHistories] = useState<any[]>([]);
  
  const refreshCharacters = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const charactersData = await databaseManager.characters.getCharactersByNovelId(novelId);
      setCharacters(charactersData);
    }
  };
  
  const refreshLocations = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const locationsData = await databaseManager.locations.getLocationsByNovelId(novelId);
      setLocations(locationsData);
    }
  };
  
  const refreshCultures = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const culturesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'culture');
      setCultures(culturesData);
    }
  };
  
  const refreshTechnologies = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const technologiesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'technology');
      setTechnologies(technologiesData);
    }
  };
  
  const refreshMagics = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const magicsData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'magic');
      setMagics(magicsData);
    }
  };
  
  const refreshHistories = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const historiesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'history');
      setHistories(historiesData);
    }
  };

  const [chartData, setChartData] = useState<ChartData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 刷新所有数据
  const refreshAllData = useCallback(() => {
    if (novelId) {
      refreshCharacters(novelId);
      refreshLocations(novelId);
      refreshCultures(novelId);
      refreshTechnologies(novelId);
      refreshMagics(novelId);
      refreshHistories(novelId);
    }
  }, [novelId, refreshCharacters, refreshLocations, refreshCultures, refreshTechnologies, refreshMagics, refreshHistories]);

  // 生成角色关系图数据
  const generateCharacterNetworkData = useCallback(() => {
    if (!novelId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const novelCharacters = characters.filter(c => c.novelId === novelId);
      const relations = visualizationService.analyzeCharacterRelations(novelCharacters);
      
      // 生成节点数据
      const nodes: ChartNode[] = novelCharacters.map((char, index) => ({
        id: char.id,
        name: char.name,
        type: 'character',
        group: 1,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0
      }));
      
      // 生成连接数据
      const links: ChartLink[] = relations.map(relation => ({
        source: relation.source,
        target: relation.target,
        value: relation.strength,
        type: relation.type,
        description: relation.description
      }));
      
      setChartData({ nodes, links });
    } catch (err) {
      setError('生成角色关系图数据时出错');
      console.error('生成角色关系图数据时出错:', err);
    } finally {
      setLoading(false);
    }
  }, [novelId, characters]);

  // 生成世界设定网络数据
  const generateWorldSettingNetworkData = useCallback((settingType: string = 'all') => {
    if (!novelId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('生成世界设定网络数据，小说ID:', novelId, '设定类型:', settingType);
      
      // 获取当前小说的世界设定数据
      const novelLocations = locations.filter(l => l.novelId === novelId);
      const novelCultures = cultures.filter(c => c.novelId === novelId);
      const novelTechnologies = technologies.filter(t => t.novelId === novelId);
      const novelMagics = magics.filter(m => m.novelId === novelId);
      const novelHistories = histories.filter(h => h.novelId === novelId);
      
      console.log('过滤后的数据:', {
        locations: novelLocations.length,
        cultures: novelCultures.length,
        technologies: novelTechnologies.length,
        magics: novelMagics.length,
        histories: novelHistories.length
      });
      
      // 使用可视化服务分析世界设定关系
      const { nodes, links } = visualizationService.analyzeWorldSettingRelations(
        novelLocations,
        novelCultures,
        novelTechnologies,
        novelMagics,
        novelHistories,
        settingType
      );
      
      console.log('分析结果:', { nodes: nodes.length, links: links.length });
      
      // 为节点添加坐标信息，限制在容器范围内
      const nodesWithPositions = nodes.map((node, index) => ({
        ...node,
        // 限制坐标在容器范围内 (假设容器尺寸为 800x300)
        x: Math.random() * 700 + 50, // 50-750，避免节点贴近边缘
        y: Math.random() * 200 + 50, // 50-250，避免节点贴近边缘
        vx: 0,
        vy: 0
      }));
      
      setChartData({ nodes: nodesWithPositions, links });
    } catch (err) {
      setError('生成世界设定网络数据时出错');
      console.error('生成世界设定网络数据时出错:', err);
    } finally {
      setLoading(false);
    }
  }, [novelId, locations, cultures, technologies, magics, histories]);

  // 根据视图类型生成相应的图表数据
  const generateChartData = useCallback((viewType: string, settingType: string = 'all') => {
    console.log('生成图表数据:', { viewType, settingType });
    switch (viewType) {
      case 'characters':
        generateCharacterNetworkData();
        break;
      case 'world-settings':
        generateWorldSettingNetworkData(settingType);
        break;
      default:
        setChartData({ nodes: [], links: [] });
    }
  }, [generateCharacterNetworkData, generateWorldSettingNetworkData]);

  // 初始化数据
  useEffect(() => {
    if (novelId) {
      refreshAllData();
    }
  }, [novelId]);

  return {
    chartData,
    loading,
    error,
    refreshAllData,
    generateChartData
  };
};