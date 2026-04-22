export enum WidgetType {
  CONTAINER = 'container',
  BUTTON = 'button',
  LABEL = 'label',
  IMAGE = 'image',
  SLIDER = 'slider',
  CHART = 'chart'
}

export interface WidgetStyle {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface Widget {
  id: string;
  type: WidgetType;
  name: string;
  style: WidgetStyle;
  properties: {
    text?: string;
    src?: string; // For images
    binding?: string; // Data binding key
    onClick?: string; // Event handler name
    value?: number; // For sliders/charts
    [key: string]: any;
  };
  children?: Widget[];
}

export interface Screen {
  id: string;
  name: string;
  width: number;
  height: number;
  root: Widget;
}

export interface JsonUIConfig {
  screens: Screen[];
  theme?: {
    primaryColor: string;
    fontFamily: string;
  };
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: 'Simulator' | 'Compiler' | 'Runtime';
}