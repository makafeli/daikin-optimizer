/**
 * Validation utilities for Daikin Altherma 3 settings
 */
import type { Setting, ValidationResult } from '@/types'
import { z } from 'zod'

// Validation schemas for different setting types
const validationSchemas = {
  hex: z.string().regex(/^[0-9A-F]{2}$/i, 'Must be a 2-digit hexadecimal number'),
  temperature: z.number().min(-40).max(90),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format'),
  boolean: z.enum(['0', '1']),
}

export interface ValidationConfig {
  strictMode?: boolean
  allowOverride?: boolean
  validateDependencies?: boolean
}

export interface ValidationContext {
  settingsDatabase: Record<string, Setting>
  currentSettings: Record<string, string>
  config?: ValidationConfig
}

/**
 * Validates a single setting value against its defined constraints
 */
export async function validateSetting(
  code: string,
  value: string,
  context: ValidationContext
): Promise<ValidationResult> {
  const { settingsDatabase, currentSettings, config } = context
  const setting = settingsDatabase[code]

  if (!setting) {
    return {
      isValid: false,
      errors: [{
        type: 'format',
        message: `Unknown setting code: ${code}`
      }]
    }
  }

  const errors = []

  // Format validation
  const formatError = await validateFormat(value, setting)
  if (formatError) errors.push(formatError)

  // Range validation
  const rangeError = await validateRange(value, setting)
  if (rangeError) errors.push(rangeError)

  // Dependency validation
  if (config?.validateDependencies !== false) {
    const dependencyErrors = await validateDependencies(code, value, context)
    errors.push(...dependencyErrors)
  }

  // Check for conflicts
  const conflictErrors = await validateConflicts(code, value, context)
  errors.push(...conflictErrors)

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Validates the format of a setting value based on its type
 */
async function validateFormat(
  value: string,
  setting: Setting
): Promise<ValidationResult['errors'][0] | null> {
  try {
    switch (setting.type) {
      case 'temperature':
        validationSchemas.temperature.parse(parseFloat(value))
        break
      case 'time':
        validationSchemas.time.parse(value)
        break
      case 'boolean':
        validationSchemas.boolean.parse(value)
        break
      default:
        validationSchemas.hex.parse(value)
    }
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        type: 'format',
        message: `Invalid format for ${setting.name}: ${error.errors[0].message}`
      }
    }
    return {
      type: 'format',
      message: `Invalid format for ${setting.name}`
    }
  }
}

/**
 * Validates a value against its defined range constraints
 */
async function validateRange(
  value: string,
  setting: Setting
): Promise<ValidationResult['errors'][0] | null> {
  const { range } = setting
  if (!range) return null

  try {
    switch (range.type) {
      case 'numeric': {
        const numValue = parseFloat(value)
        if (
          numValue < range.min ||
          numValue > range.max ||
          (numValue - range.min) % range.step !== 0
        ) {
          return {
            type: 'range',
            message: `Value must be between ${range.min} and ${range.max} in steps of ${range.step}`
          }
        }
        break
      }
      case 'enum':
        if (!range.options[value]) {
          return {
            type: 'range',
            message: `Value must be one of: ${Object.keys(range.options).join(', ')}`
          }
        }
        break
      case 'boolean':
        if (value !== '0' && value !== '1') {
          return {
            type: 'range',
            message: 'Value must be 0 or 1'
          }
        }
        break
    }
    return null
  } catch (error) {
    return {
      type: 'range',
      message: `Invalid value for ${setting.name}`
    }
  }
}

/**
 * Validates dependencies between settings
 */
async function validateDependencies(
  code: string,
  value: string,
  context: ValidationContext
): Promise<ValidationResult['errors']> {
  const { settingsDatabase, currentSettings } = context
  const setting = settingsDatabase[code]
  const errors = []

  if (!setting.dependencies?.length) return errors

  for (const depCode of setting.dependencies) {
    const depSetting = settingsDatabase[depCode]
    if (!depSetting) continue

    // Example dependency checks based on setting types
    switch (setting.type) {
      case 'temperature': {
        // Temperature range dependencies
        if (depSetting.type === 'temperature') {
          const temp = parseFloat(value)
          const depTemp = parseFloat(currentSettings[depCode])
          
          // Minimum temperature must be lower than maximum
          if (setting.name.includes('minimum') && temp >= depTemp) {
            errors.push({
              type: 'dependency',
              message: `${setting.name} must be lower than ${depSetting.name}`
            })
          }
          // Maximum temperature must be higher than minimum
          if (setting.name.includes('maximum') && temp <= depTemp) {
            errors.push({
              type: 'dependency',
              message: `${setting.name} must be higher than ${depSetting.name}`
            })
          }
        }
        break
      }
      case 'boolean': {
        // Feature enable/disable dependencies
        if (value === '1' && currentSettings[depCode] === '0') {
          errors.push({
            type: 'dependency',
            message: `${depSetting.name} must be enabled to use this feature`
          })
        }
        break
      }
    }
  }

  return errors
}

/**
 * Validates potential conflicts between settings
 */
async function validateConflicts(
  code: string,
  value: string,
  context: ValidationContext
): Promise<ValidationResult['errors']> {
  const { settingsDatabase, currentSettings } = context
  const setting = settingsDatabase[code]
  const errors = []

  if (!setting.conflicts?.length) return errors

  const testSettings = {
    ...currentSettings,
    [code]: value
  }

  for (const conflictCode of setting.conflicts) {
    const conflictSetting = settingsDatabase[conflictCode]
    if (!conflictSetting) continue

    // Example conflict checks
    switch (setting.type) {
      case 'mode': {
        // Mode compatibility conflicts
        if (
          conflictSetting.type === 'mode' &&
          testSettings[conflictCode] === value
        ) {
          errors.push({
            type: 'conflict',
            message: `${setting.name} conflicts with ${conflictSetting.name}`
          })
        }
        break
      }
      case 'power': {
        // Power limit conflicts
        if (conflictSetting.type === 'power') {
          const power = parseFloat(value)
          const conflictPower = parseFloat(testSettings[conflictCode])
          if (power + conflictPower > 100) {
            errors.push({
              type: 'conflict',
              message: `Total power exceeds maximum limit`
            })
          }
        }
        break
      }
    }
  }

  return errors
}

/**
 * Validates multiple settings at once
 */
export async function validateSettings(
  settings: Record<string, string>,
  settingsDatabase: Record<string, Setting>,
  config?: ValidationConfig
): Promise<{
  isValid: boolean
  errors?: Record<string, ValidationResult>
}> {
  const context: ValidationContext = {
    settingsDatabase,
    currentSettings: settings,
    config
  }

  const validationResults: Record<string, ValidationResult> = {}
  let hasErrors = false

  await Promise.all(
    Object.entries(settings).map(async ([code, value]) => {
      const result = await validateSetting(code, value, context)
      if (!result.isValid) {
        validationResults[code] = result
        hasErrors = true
      }
    })
  )

  return {
    isValid: !hasErrors,
    errors: hasErrors ? validationResults : undefined
  }
}