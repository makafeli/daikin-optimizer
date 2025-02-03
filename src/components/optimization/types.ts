/**
 * Types for OptimizationPanel components
 */
import type { OptimizationSuggestion, Setting } from '@/types'

export interface OptimizationScore {
  value: number
  label: string
  description: string
  icon: string
  color: string
  trend?: 'up' | 'down' | 'stable'
  change?: number
}

export interface SettingComparison {
  code: string
  setting: Setting
  currentValue: string
  suggestedValue: string
  impact: {
    energy: number
    comfort: number
    cost: number
  }
}

export interface OptimizationChart {
  type: 'energy' | 'comfort' | 'cost'
  label: string
  data: {
    current: number[]
    optimized: number[]
    labels: string[]
  }
}

export interface OptimizationPreferences {
  prioritizeEfficiency: boolean
  prioritizeComfort: boolean
  maxTemperatureChange: number
  allowAutomaticUpdates: boolean
  scheduleOptimization: boolean
}

export interface OptimizationHistory {
  timestamp: string
  type: 'manual' | 'automatic'
  changes: Array<{
    setting: string
    from: string
    to: string
  }>
  impact: {
    energy: number
    comfort: number
    cost: number
  }
}

export interface OptimizationMetrics {
  energySavings: number
  costSavings: number
  comfortLevel: number
  co2Reduction: number
  efficiency: number
}

export interface OptimizationPanelConfig {
  autoRefresh: boolean
  refreshInterval: number
  showCharts: boolean
  showHistory: boolean
  enableAutoApply: boolean
}