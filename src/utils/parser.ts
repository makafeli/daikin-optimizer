/**
 * Parser utilities for Daikin Altherma 3 settings
 */
import type { Setting, SettingType, SettingCategory, SettingRange, AccessMode } from '@/types'

interface RawSettingData {
  code: string
  name: string
  description?: string
  category: string
  access: string
  range: string
}

interface ParsedRange {
  type: 'numeric' | 'enum' | 'boolean'
  [key: string]: unknown
}

/**
 * Parses raw settings data from various formats
 */
export function parseSettingsData(data: string): Record<string, Setting> {
  const lines = data.split('\n').filter(line => line.trim())
  const settings: Record<string, Setting> = {}
  let currentCategory = ''

  for (const line of lines) {
    // Check if line defines a category
    if (isCategoryLine(line)) {
      currentCategory = extractCategory(line)
      continue
    }

    // Try to parse setting line
    const settingMatch = parseSettingLine(line)
    if (settingMatch) {
      const { code, setting } = createSetting({
        ...settingMatch,
        category: currentCategory
      })
      settings[code] = setting
    }
  }

  return settings
}

/**
 * Determines if a line defines a category
 */
function isCategoryLine(line: string): boolean {
  const categoryPattern = /^[\w\s/]+$/
  return categoryPattern.test(line.trim()) && 
         Object.values(SettingCategory).some(cat => line.includes(cat))
}

/**
 * Extracts category name from a line
 */
function extractCategory(line: string): string {
  return line.trim()
}

/**
 * Parses a setting line into its components
 */
function parseSettingLine(line: string): RawSettingData | null {
  const settingPattern = /\[([^\]]+)\]\s+(.*?)\s*\|\s*([R|W|R\/W|R\/O]*)\s*\|\s*(.*)/
  const match = line.match(settingPattern)
  
  if (match) {
    const [_, code, name, access, range] = match
    return {
      code,
      name: name.trim(),
      access: access.trim(),
      range: range.trim(),
      category: ''
    }
  }
  
  return null
}

/**
 * Creates a Setting object from raw data
 */
function createSetting(raw: RawSettingData): { code: string; setting: Setting } {
  const range = parseRange(raw.range)
  const type = determineSettingType(raw.name, range)
  
  const setting: Setting = {
    code: raw.code,
    name: raw.name,
    category: raw.category as SettingCategory,
    type,
    access: raw.access as AccessMode,
    range
  }

  if (raw.description) {
    setting.description = raw.description
  }

  return { code: raw.code, setting }
}

/**
 * Parses a range string into a structured format
 */
function parseRange(rangeStr: string): SettingRange {
  // Try numeric range
  const numericMatch = rangeStr.match(/(-?\d+(?:\.\d+)?)~(-?\d+(?:\.\d+)?)[°]?C?,?\s*step:\s*(\d+(?:\.\d+)?)[°]?C?/)
  if (numericMatch) {
    const [_, min, max, step] = numericMatch
    return {
      type: 'numeric',
      min: parseFloat(min),
      max: parseFloat(max),
      step: parseFloat(step),
      default: parseFloat(min)
    }
  }

  // Try boolean range
  const booleanMatch = rangeStr.match(/0:\s*([^|]+)\|1:\s*([^|]+)/)
  if (booleanMatch) {
    const [_, falseValue, trueValue] = booleanMatch
    return {
      type: 'boolean',
      options: {
        false: falseValue.trim(),
        true: trueValue.trim()
      },
      default: false
    }
  }

  // Try enumerated range
  const options: Record<string, string> = {}
  const enumPattern = /(\d+):\s*([^|]+)/g
  let enumMatch
  while ((enumMatch = enumPattern.exec(rangeStr)) !== null) {
    options[enumMatch[1]] = enumMatch[2].trim()
  }

  if (Object.keys(options).length > 0) {
    return {
      type: 'enum',
      options,
      default: Object.keys(options)[0]
    }
  }

  // Default to simple numeric range
  return {
    type: 'numeric',
    min: 0,
    max: 100,
    step: 1,
    default: 0
  }
}

/**
 * Determines the setting type based on name and range
 */
function determineSettingType(name: string, range: ParsedRange): SettingType {
  const nameLower = name.toLowerCase()

  if (range.type === 'boolean') return SettingType.BOOLEAN
  if (range.type === 'enum') return SettingType.MODE
  
  if (nameLower.includes('temp')) return SettingType.TEMPERATURE
  if (nameLower.includes('time')) return SettingType.TIME
  if (nameLower.includes('power') || nameLower.includes('capacity')) return SettingType.POWER
  
  return SettingType.CONFIGURATION
}

/**
 * Exports settings to MMI format
 */
export function exportSettingsToMMI(settings: Record<string, string>): string {
  return Object.entries(settings)
    .map(([code, value]) => `${code}=${value}`)
    .join('\n')
}

/**
 * Parses MMI format settings
 */
export function parseMMISettings(mmiData: string): Record<string, string> {
  const settings: Record<string, string> = {}
  
  mmiData.split('\n').forEach(line => {
    const [code, value] = line.split('=')
    if (code && value) {
      settings[code.trim()] = value.trim()
    }
  })

  return settings
}