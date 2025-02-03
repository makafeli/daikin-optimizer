/**
 * Settings store types
 */
import type {
  Setting,
  SystemStatus,
  OptimizationSuggestion,
  ValidationResult,
  UserPreferences,
  SystemMetrics
} from '@/types'

export interface SettingsState {
  currentSettings: Record<string, string>
  originalSettings: Record<string, string>
  settingsDatabase: Record<string, Setting>
  validationErrors: Record<string, ValidationResult>
  optimizationSuggestions: OptimizationSuggestion[]
  changeHistory: SettingChange[]
  systemStatus: SystemStatus | null
  preferences: UserPreferences
  metrics: SystemMetrics | null
}

export interface SettingChange {
  timestamp: string
  code: string
  previousValue: string
  newValue: string
  type: 'manual' | 'optimization'
  description?: string
}

export interface OptimizationConfig {
  prioritizeEfficiency: boolean
  prioritizeComfort: boolean
  maxTemperatureAdjustment: number
  allowAutoApply: boolean
}

export interface ValidationConfig {
  strictMode: boolean
  allowOverride: boolean
  validateDependencies: boolean
}

export interface SettingUpdateResult {
  success: boolean
  setting?: Setting
  errors?: ValidationResult['errors']
}