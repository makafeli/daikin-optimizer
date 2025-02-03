/**
 * Types for the SettingsMatrix component
 */
import type { Setting, SettingCategory, ValidationResult } from '@/types'

export interface GridCell {
  code: string
  value: string
  setting: Setting
  isValid: boolean
  isModified: boolean
  validationError?: ValidationResult['errors'][0]
}

export interface GridSection {
  id: string
  title: string
  cells: GridCell[]
  category: SettingCategory
}

export interface CategoryLegend {
  name: SettingCategory
  color: string
  icon: string
}

export interface CellEditEvent {
  code: string
  value: string
  originalValue: string
  setting: Setting
}

export interface CellHoverEvent {
  code: string
  setting: Setting
  x: number
  y: number
}

export interface MatrixConfig {
  allowDirectEdit: boolean
  showValidation: boolean
  showModified: boolean
  showTooltips: boolean
}