import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Code, Play, Image as ImageIcon, Download, Upload, Cpu, Save } from 'lucide-react';
import Simulator from '../components/Simulator';
import { generateUiFromText, generateUiFromImage } from '../services/geminiService';
import { JsonUIConfig, LogEntry, WidgetType } from '../types';

const INITIAL_CONFIG: JsonUIConfig = {
  screens: [
    {
      id: "demo_screen",
      name: "Dashboard",
      width: 800,
      height: 480,
      root: {
        id: "root",
        type: WidgetType.CONTAINER,
        name: "Root",
        style: { x: 0, y: 0, width: 800, height: 480, backgroundColor: "#1a1a1a" },
        properties: {},
        children: [
          {
            id: "header",
            type: WidgetType.CONTAINER,
            name: "Header",
            style: { x: 0, y: 0, width: 800, height: 60, backgroundColor: "#2d3748" },
            properties: {},
            children: [
              {
                id: "title",
                type: WidgetType.LABEL,
                name: "Title",
                style: { x: 20, y: 15, width: 200, height: 30, textColor: "#ffffff", fontSize: 20 },
                properties: { text: "System Monitor" }
              }
            ]
          },
          {
            id: "cpu_chart",
            type: WidgetType.CHART,
            name: "CPU Usage",
            style: { x: 20, y: 80, width: 360, height: 200, backgroundColor: "#252525", borderRadius: 8, borderColor: "#333", borderWidth: 1 },
            properties: { text: "CPU" }
          },
          {
            id: "temp_label",
            type: WidgetType.LABEL,
            name: "Temp Label",
            style: { x: 400, y: 80, width: 150, height: 30, textColor: "#a0aec0" },
            properties: { text: "Core Temperature" }
          },
          {
            id: "temp_value",
            type: WidgetType.LABEL,
            name: "Temp Value",
            style: { x: 400, y: 110, width: 150, height: 60, textColor: "#4fd1c5", fontSize: 48 },
            properties: { binding: "temperature", text: "45°C" }
          }
        ]
      }
    }
  ]
};

const Studio: React.FC = () => {
  const [jsonContent, setJsonContent] = useState<string>(JSON.stringify(INITIAL_CONFIG, null, 2));
  const [parsedConfig, setParsedConfig] = useState<JsonUIConfig | null>(INITIAL_CONFIG);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'logs'>('editor');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Simulated Data Context for Data Binding
  const [dataContext, setDataContext] = useState<Record<string, any>>({
    temperature: "42°C",
    rpm: 1200,
    status: "Active"
  });

  // Simulator Data Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setDataContext(prev => ({
        ...prev,
        temperature: `${Math.floor(40 + Math.random() * 15)}°C`,
        rpm: Math.floor(1000 + Math.random() * 500)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
    setLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      source: 'Simulator'
    }, ...prev]);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonContent(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setParsedConfig(parsed);
      addLog("Configuration updated successfully", 'info');
    } catch (err) {
      // Don't update parsedConfig on error to prevent simulator crash
      // parse error is expected while typing
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    addLog(`Generating UI from prompt: "${prompt}"...`, 'info');
    
    try {
      const config = await generateUiFromText(prompt);
      if (config) {
        setJsonContent(JSON.stringify(config, null, 2));
        setParsedConfig(config);
        addLog("Generation complete.", 'info');
      } else {
        addLog("Generation returned empty result.", 'warn');
      }
    } catch (error) {
      addLog(`Generation failed: ${error}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog("Processing image upload...", 'info');
    setIsGenerating(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; // Remove data url prefix
      
      try {
        const config = await generateUiFromImage(base64Data);
        if (config) {
            setJsonContent(JSON.stringify(config, null, 2));
            setParsedConfig(config);
            addLog("Image to UI conversion complete.", 'info');
        }
      } catch (error) {
        addLog(`Image conversion failed: ${error}`, 'error');
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 flex flex-col items-center py-4 bg-gray-950 border-r border-gray-800">
        <div className="p-2 bg-blue-600 rounded-lg mb-6">
          <Cpu size={24} />
        </div>
        <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg mb-2">
          <Code size={20} />
        </button>
        <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg mb-2">
          <Save size={20} />
        </button>
        <div className="mt-auto">
             {/* Settings placeholder */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-14 border-b border-gray-800 flex items-center px-4 justify-between bg-gray-900">
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg mr-4">JsonUI Studio</h1>
            <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400 border border-gray-700">v1.0.0-beta</span>
          </div>
          
          <div className="flex items-center space-x-3">
             <div className="flex items-center bg-gray-800 rounded-md p-1 border border-gray-700">
                <input 
                  type="text" 
                  placeholder="Describe UI (e.g. 'Thermostat with slider')"
                  className="bg-transparent border-none focus:ring-0 text-sm px-2 w-64 outline-none placeholder-gray-500"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="p-1 hover:bg-gray-700 rounded text-blue-400 disabled:opacity-50"
                  title="Generate with Gemini"
                >
                  <Zap size={16} className={isGenerating ? "animate-pulse" : ""} />
                </button>
             </div>
             
             <label className="p-2 hover:bg-gray-800 rounded cursor-pointer text-gray-400 hover:text-white transition-colors" title="Import from Figma/Image">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <ImageIcon size={18} />
             </label>

             <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-4 rounded transition-colors flex items-center gap-2">
                <Download size={14} /> Export JSON
             </button>
          </div>
        </div>

        {/* Workspace Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Editor */}
          <div className="w-1/3 flex flex-col border-r border-gray-800 min-w-[300px]">
            <div className="flex border-b border-gray-800">
               <button 
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'editor' ? 'text-white border-b-2 border-blue-500 bg-gray-800' : 'text-gray-400 hover:text-gray-200'}`}
               >
                 JSON Configuration
               </button>
               <button 
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'logs' ? 'text-white border-b-2 border-blue-500 bg-gray-800' : 'text-gray-400 hover:text-gray-200'}`}
               >
                 Logs & Output
               </button>
            </div>
            
            {activeTab === 'editor' ? (
              <div className="flex-1 relative">
                <textarea
                  className="w-full h-full bg-gray-950 text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
                  value={jsonContent}
                  onChange={handleJsonChange}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="flex-1 bg-gray-950 p-4 overflow-y-auto font-mono text-xs">
                {logs.length === 0 && <span className="text-gray-600">No logs yet.</span>}
                {logs.map((log, i) => (
                  <div key={i} className="mb-1 flex gap-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    <span className={
                      log.level === 'error' ? 'text-red-400' : 
                      log.level === 'warn' ? 'text-yellow-400' : 
                      'text-blue-300'
                    }>[{log.level.toUpperCase()}]</span>
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Simulator */}
          <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-gray-900 flex flex-col">
             <div className="p-2 flex justify-between items-center bg-gray-800/50 backdrop-blur-sm border-b border-gray-800">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                 <Play size={12} /> Live Preview (LVGL Simulator)
               </span>
               <div className="flex gap-4 text-xs font-mono text-gray-400">
                 <span>Data Binding: Active</span>
                 <span>Res: {parsedConfig?.screens[0]?.width || 0}x{parsedConfig?.screens[0]?.height || 0}</span>
               </div>
             </div>
             <div className="flex-1 relative overflow-hidden">
                <Simulator config={parsedConfig} dataContext={dataContext} />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Studio;