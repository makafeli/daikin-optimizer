// Validation utilities for Daikin Altherma 3 settings

// Validation error types
export const ValidationErrorType = {
  RANGE: 'range',
  FORMAT: 'format',
  DEPENDENCY: 'dependency',
  CONFLICT: 'conflict'
}

// Common validation patterns
const patterns = {
  hex: /^[0-9A-F]{2}$/i,
  temperature: /^-?\d+(\.\d+)?$/,
  time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
}

/**
 * Validates a setting value against its defined constraints
 */
export const validateSetting = (code, value, settingsDatabase, currentSettings) => {
  const setting = settingsDatabase[code]
  if (!setting) {
    return { isValid: false, error: 'Unknown setting code' }
  }

  const errors = []

  // Format validation
  if (!validateFormat(value, setting)) {
    errors.push({
      type: ValidationErrorType.FORMAT,
      message: `Invalid format for ${setting.name}. Expected format: ${getFormatDescription(setting)}`
    })
  }

  // Range validation
  if (!validateRange(value, setting)) {
    errors.push({
      type: ValidationErrorType.RANGE,
      message: `Value out of range for ${setting.name}. ${getRangeDescription(setting)}`
    })
  }

  // Dependency validation
  const dependencyErrors = validateDependencies(code, value, settingsDatabase, currentSettings)
  errors.push(...dependencyErrors)

  // Conflict validation
  const conflictErrors = validateConflicts(code, value, settingsDatabase, currentSettings)
  errors.push(...conflictErrors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates the format of a setting value
 */
const validateFormat = (value, setting) => {
  switch (setting.type) {
    case 'temperature':
      return patterns.temperature.test(value.toString())
    case 'time':
      return patterns.time.test(value)
    case 'boolean':
      return value === '0' || value === '1'
    case 'enum':
      return setting.range.options.hasOwnProperty(value)
    default:
      return patterns.hex.test(value)
  }
}

/**
 * Validates the range of a setting value
 */
const validateRange = (value, setting) => {
  if (!setting.range) return true

  switch (setting.range.type) {
    case 'numeric':
      const numValue = parseFloat(value)
      return numValue >= setting.range.min && 
             numValue <= setting.range.max && 
             (numValue - setting.range.min) % setting.range.step === 0
    case 'enum':
      return setting.range.options.hasOwnProperty(value)
    case 'boolean':
      return value === '0' || value === '1'
    default:
      return true
  }
}

/**
 * Validates dependencies between settings
 */
const validateDependencies = (code, value, settingsDatabase, currentSettings) => {
  const errors = []
  const setting = settingsDatabase[code]

  // Define known dependencies
  const dependencies = {
    // Main zone dependencies
    '2-0C': { // Emitter type affects temperature ranges
      affects: ['9-01', '9-00'],
      validate: (value, affected, settings) => {
        const maxTemp = value === '2' ? 65 : 55 // Radiator vs other emitters
        if (settings[affected] > maxTemp) {
          return `Maximum temperature for ${settingsDatabase[affected].name} must be <= ${maxTemp}°C with current emitter type`
        }
        return null
      }
    },
    // Weather-dependent curve dependencies
    '1-00': { // Low ambient temp point must be lower than high point
      affects: ['1-01'],
      validate: (value, affected, settings) => {
        if (parseFloat(value) >= parseFloat(settings[affected])) {
          return 'Low ambient temperature must be lower than high ambient temperature'
        }
        return null
      }
    },
    // Tank operation dependencies
    '6-0D': { // Heat up mode affects other tank settings
      affects: ['6-0A', '6-0B', '6-0C'],
      validate: (value, affected, settings) => {
        if (value === '0' && affected === '6-0B') {
          return 'Eco setpoint not applicable in reheat-only mode'
        }
        return null
      }
    }
  }

  if (dependencies[code]) {
    const { affects, validate } = dependencies[code]
    affects.forEach(affectedCode => {
      const error = validate(value, affectedCode, currentSettings)
      if (error) {
        errors.push({
          type: ValidationErrorType.DEPENDENCY,
          message: error
        })
      }
    })
  }

  return errors
}

/**
 * Validates potential conflicts between settings
 */
const validateConflicts = (code, value, settingsDatabase, currentSettings) => {
  const errors = []
  
  // Define known conflicts
  const conflicts = {
    // Temperature conflicts
    'heating': {
      codes: ['9-01', '9-00', '9-03', '9-02'],
      validate: (settings) => {
        if (parseFloat(settings['9-01']) >= parseFloat(settings['9-00'])) {
          return 'Minimum heating temperature must be lower than maximum'
        }
        if (parseFloat(settings['9-03']) >= parseFloat(settings['9-02'])) {
          return 'Minimum cooling temperature must be lower than maximum'
        }
        return null
      }
    },
    // Operation mode conflicts
    'operation': {
      codes: ['4-00', '4-01', '4-02'],
      validate: (settings) => {
        if (settings['4-00'] === '0' && settings['4-01'] === '2') {
          return 'Cannot set backup heater as priority when backup heater is disabled'
        }
        return null
      }
    }
  }

  Object.values(conflicts).forEach(({ codes, validate }) => {
    if (codes.includes(code)) {
      const testSettings = { ...currentSettings, [code]: value }
      const error = validate(testSettings)
      if (error) {
        errors.push({
          type: ValidationErrorType.CONFLICT,
          message: error
        })
      }
    }
  })

  return errors
}

/**
 * Gets a human-readable description of the expected format
 */
const getFormatDescription = (setting) => {
  switch (setting.type) {
    case 'temperature':
      return 'Decimal number'
    case 'time':
      return 'HH:MM format'
    case 'boolean':
      return '0 or 1'
    case 'enum':
      return `One of: ${Object.keys(setting.range.options).join(', ')}`
    default:
      return '2-digit hexadecimal'
  }
}

/**
 * Gets a human-readable description of the valid range
 */
const getRangeDescription = (setting) => {
  if (!setting.range) return 'No range specified'

  switch (setting.range.type) {
    case 'numeric':
      return `Must be between ${setting.range.min} and ${setting.range.max} in steps of ${setting.range.step}`
    case 'enum':
      return `Valid values: ${Object.entries(setting.range.options).map(([k, v]) => `${k} (${v})`).join(', ')}`
    case 'boolean':
      return `0 (${setting.range.options.false}) or 1 (${setting.range.options.true})`
    default:
      return 'No range restrictions'
  }
}

/**
 * Batch validates multiple settings at once
 */
export const validateSettings = (settings, settingsDatabase) => {
  const errors = {}
  Object.entries(settings).forEach(([code, value]) => {
    const validation = validateSetting(code, value, settingsDatabase, settings)
    if (!validation.isValid) {
      errors[code] = validation.errors
    }
  })
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}