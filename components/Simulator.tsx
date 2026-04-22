import React, { useMemo } from 'react';
import { JsonUIConfig, Widget, WidgetType } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SimulatorProps {
  config: JsonUIConfig | null;
  dataContext: Record<string, any>;
}

// Mock data for charts
const MOCK_CHART_DATA = [
  { name: '10:00', value: 20 },
  { name: '10:05', value: 45 },
  { name: '10:10', value: 30 },
  { name: '10:15', value: 65 },
  { name: '10:20', value: 50 },
  { name: '10:25', value: 80 },
];

const WidgetRenderer: React.FC<{ widget: Widget; context: Record<string, any> }> = ({ widget, context }) => {
  const { style, properties, type, children } = widget;

  // Resolve data binding
  const resolvedText = properties.binding 
    ? (context[properties.binding] !== undefined ? context[properties.binding] : `{{${properties.binding}}}`) 
    : properties.text;

  const resolvedValue = properties.binding && context[properties.binding] !== undefined
    ? context[properties.binding]
    : properties.value;

  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${style.x || 0}px`,
    top: `${style.y || 0}px`,
    width: `${style.width}px`,
    height: `${style.height}px`,
    backgroundColor: style.backgroundColor || 'transparent',
    color: style.textColor || '#ffffff',
    fontSize: `${style.fontSize || 14}px`,
    borderRadius: `${style.borderRadius || 0}px`,
    border: style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor}` : 'none',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  };

  switch (type) {
    case WidgetType.BUTTON:
      return (
        <button style={{ ...commonStyle, cursor: 'pointer' }} className="hover:opacity-90 active:scale-95 transition-all">
          {resolvedText}
        </button>
      );
    case WidgetType.LABEL:
      return (
        <div style={{ ...commonStyle, justifyContent: 'flex-start', padding: '0 8px' }}>
          {resolvedText}
        </div>
      );
    case WidgetType.SLIDER:
      return (
        <div style={commonStyle}>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={resolvedValue || 50} 
            className="w-full h-full accent-blue-500"
            readOnly // Simulator is read-only for now regarding input interactions reflecting back to parent
          />
        </div>
      );
    case WidgetType.IMAGE:
      return (
        <div style={commonStyle}>
          {properties.src ? (
            <img src={properties.src} alt="asset" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">IMG</div>
          )}
        </div>
      );
    case WidgetType.CHART:
      return (
        <div style={{ ...commonStyle, backgroundColor: style.backgroundColor || '#111' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
              <Line type="monotone" dataKey="value" stroke={style.textColor || "#8884d8"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    case WidgetType.CONTAINER:
    default:
      return (
        <div style={commonStyle}>
          {children?.map((child) => (
            <WidgetRenderer key={child.id} widget={child} context={context} />
          ))}
        </div>
      );
  }
};

const Simulator: React.FC<SimulatorProps> = ({ config, dataContext }) => {
  if (!config || !config.screens || config.screens.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900 border border-gray-800 rounded-lg">
        <p className="mb-2">No Configuration Loaded</p>
        <p className="text-xs">Generate or write JSON to visualize.</p>
      </div>
    );
  }

  // Currently just rendering the first screen for MVP
  const screen = config.screens[0];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-black/20 p-8 overflow-auto">
      <div className="relative shadow-2xl shadow-black ring-8 ring-gray-800 rounded-xl overflow-hidden bg-black"
           style={{ width: `${screen.width}px`, height: `${screen.height}px` }}>
        <WidgetRenderer widget={screen.root} context={dataContext} />
      </div>
      <div className="mt-4 text-xs text-gray-500 font-mono">
        {screen.width} x {screen.height} | {screen.name}
      </div>
    </div>
  );
};

export default Simulator;