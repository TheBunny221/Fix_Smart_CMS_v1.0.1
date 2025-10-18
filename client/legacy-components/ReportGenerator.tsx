import React from 'react';

// Primary color theme
const THEME = {
  primary: '#0f5691',
  primaryLight: '#1e40af',
  primaryDark: '#0c4a7a',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  white: '#ffffff',
  black: '#000000'
};

// Report data interfaces
export interface ReportData {
  reportTitle: string;
  appName: string;
  appLogoUrl?: string | undefined;
  generatedAt: string;
  fromDate: string;
  toDate: string;
  exportedBy: {
    name: string;
    role: string;
  };
  summary: {
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    resolutionRate: number;
  };
  categories?: Array<{
    name: string;
    count: number;
    percentage: number;
    avgTime: number;
  }> | undefined;
  wards?: Array<{
    name: string;
    complaints: number;
    resolved: number;
    pending: number;
    efficiency: number;
  }> | undefined;
  complaints?: any[] | undefined;
  totalRecords?: number | undefined;
}