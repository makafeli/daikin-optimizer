/**
 * Core types for Daikin Altherma 3 settings and devices
 */

/** Basic utility types */
export type Hex = string
export type Temperature = number
export type Timestamp = number

/** Device information */
export interface Device {
  id: string
  name: string
  model: string
  serialNumber: string
  firmwareVersion: string
  connected: boolean
  lastSeen: Timestamp
}

/** Setting access types */
export type AccessMode = 'R' | 'W' | 'R/W' | 'R/O'

/** Setting value range types */
export interface NumericRange {
  type: 'numeric'
  min: number
  max: number
  step: number
  default: number
  unit?: string
}

export interface EnumRange {
  type: 'enum'
  options: Record<string, string>
  default: string
}

export interface BooleanRange {
  type: 'boolean'
  options: {
    false: string
    true: string
  }
  default: boolean
}

export type SettingRange = NumericRange | EnumRange | BooleanRange

/** Setting categories */
export enum SettingCategory {
  ROOM = 'Room',
  MAIN_ZONE = 'Main Zone',
  ADDITIONAL_ZONE = 'Additional Zone',
  SPACE_HEATING_COOLING = 'Space Heating/Cooling',
  TANK = 'Tank',
  USER_SETTINGS = 'User Settings',
  INSTALLER_SETTINGS = 'Installer Settings'
}

/** Setting types */
export enum SettingType {
  TEMPERATURE = 'temperature',
  MODE = 'mode',
  CONFIGURATION = 'configuration',
  TIME = 'time',
  POWER = 'power',
  BOOLEAN = 'boolean'
}

/** Setting definition */
export interface Setting {
  code: string
  name: string
  description?: string
  category: SettingCategory
  type: SettingType
  access: AccessMode
  range: SettingRange
  value?: string
  originalValue?: string
  dependencies?: string[]
  conflicts?: string[]
}

/** Validation status */
export interface ValidationResult {
  isValid: boolean
  errors?: {
    type: 'range' | 'format' | 'dependency' | 'conflict'
    message: string
  }[]
}

/** Optimization suggestion */
export interface OptimizationSuggestion {
  id: string
  type: 'energy_efficiency' | 'comfort' | 'cost' | 'environmental'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: {
    energy: number
    comfort: number
    cost: number
  }
  affectedSettings: string[]
  suggestedValues: Record<string, string>
  canAutoApply: boolean
}

/** System metrics */
export interface SystemMetrics {
  temperatures: {
    outdoor: Temperature
    indoor: Temperature
    water: Temperature
    tank?: Temperature
  }
  power: {
    consumption: number
    production?: number
    cop: number
  }
  flow: {
    rate: number
    temperature: Temperature
  }
  pressure: number
}

/** Historical data point */
export interface HistoricalDataPoint {
  timestamp: Timestamp
  type: string
  value: number
  unit: string
}

/** System status */
export interface SystemStatus {
  mode: 'heating' | 'cooling' | 'tank_heating' | 'off'
  active: boolean
  error?: {
    code: string
    message: string
    severity: 'warning' | 'error'
  }
  metrics: SystemMetrics
}

/** Schedule */
export interface Schedule {
  id: string
  name: string
  type: 'heating' | 'cooling' | 'tank'
  enabled: boolean
  entries: {
    id: string
    dayOfWeek: number
    timeStart: string
    timeEnd: string
    temperature: Temperature
    mode?: string
  }[]
}

/** User preferences */
export interface UserPreferences {
  prioritizeEfficiency: boolean
  prioritizeComfort: boolean
  quietOperation: boolean
  scheduleOptimization: boolean
  notifications: {
    errors: boolean
    warnings: boolean
    suggestions: boolean
    updates: boolean
  }
  temperatureUnit: 'C' | 'F'
  theme: 'light' | 'dark' | 'system'
  language: string
}