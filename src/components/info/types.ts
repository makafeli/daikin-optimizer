/**
 * Types for HeatPumpInfo components
 */
import type { SystemMetrics, SystemStatus } from '@/types'

export interface SystemSpecification {
  id: string
  label: string
  value: string | number
  unit?: string
  icon: string
  color?: string
}

export interface ZoneInfo {
  id: string
  name: string
  type: string
  temperature: number
  targetTemperature: number
  humidity?: number
  status: 'active' | 'idle' | 'disabled'
}

export interface PerformanceMetric {
  id: string
  label: string
  value: number
  unit: string
  icon: string
  color: string
  trend?: 'up' | 'down' | 'stable'
  change?: number
}

export interface StatusIndicator {
  id: string
  label: string
  value: string | number
  status: 'normal' | 'warning' | 'error' | 'inactive'
  icon: string
  unit?: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill?: boolean
  }[]
}

export interface ChartOptions {
  responsive: boolean
  maintainAspectRatio: boolean
  plugins: {
    legend: {
      display: boolean
    }
    tooltip: {
      enabled: boolean
    }
  }
  scales: {
    y: {
      beginAtZero: boolean
      ticks?: {
        callback?: (value: number) => string
      }
    }
  }
}

export interface InfoPanelConfig {
  refreshInterval: number
  showCharts: boolean
  showTrends: boolean
  chartDuration: '1h' | '24h' | '7d' | '30d'
}