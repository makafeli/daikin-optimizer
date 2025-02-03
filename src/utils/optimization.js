// Optimization utilities for Daikin Altherma 3 settings

// Optimization categories
export const OptimizationType = {
  ENERGY_EFFICIENCY: 'energy_efficiency',
  COMFORT: 'comfort',
  COST: 'cost',
  ENVIRONMENTAL: 'environmental'
}

// Optimization recommendation priority
export const Priority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

/**
 * Analyzes current settings and generates optimization recommendations
 */
export const analyzeSettings = (currentSettings, settingsDatabase, systemInfo) => {
  const recommendations = []

  // Run different optimization analyzers
  recommendations.push(
    ...analyzeHeatingCurve(currentSettings, settingsDatabase, systemInfo),
    ...analyzePumpOperation(currentSettings, settingsDatabase),
    ...analyzeDHWSettings(currentSettings, settingsDatabase),
    ...analyzeComfortSettings(currentSettings, settingsDatabase),
    ...analyzeEnergySettings(currentSettings, settingsDatabase)
  )

  return recommendations
}

/**
 * Analyzes heating curve settings for optimization
 */
const analyzeHeatingCurve = (settings, database, systemInfo) => {
  const recommendations = []

  // Check heating curve points
  const lowPoint = parseFloat(settings['1-00']) // Low ambient temp
  const highPoint = parseFloat(settings['1-01']) // High ambient temp
  const lowWater = parseFloat(settings['1-02']) // Water temp at low point
  const highWater = parseFloat(settings['1-03']) // Water temp at high point

  // Calculate curve slope
  const slope = (highWater - lowWater) / (highPoint - lowPoint)

  // Check if curve is too steep
  if (slope > 1.5) {
    recommendations.push({
      type: OptimizationType.ENERGY_EFFICIENCY,
      priority: Priority.HIGH,
      title: 'Heating Curve Too Steep',
      description: 'Current heating curve may lead to overheating and energy waste.',
      impact: {
        energy: -15, // Estimated percentage impact on energy consumption
        comfort: 0,
        cost: -10
      },
      affectedSettings: ['1-00', '1-01', '1-02', '1-03'],
      suggestedValues: {
        '1-02': Math.max(35, lowWater - 5).toString(),
        '1-03': Math.max(25, highWater - 5).toString()
      }
    })
  }

  return recommendations
}

/**
 * Analyzes pump operation settings
 */
const analyzePumpOperation = (settings, database) => {
  const recommendations = []

  // Check pump operation mode
  const pumpMode = settings['F-0D']
  if (pumpMode === '0') { // Continuous mode
    recommendations.push({
      type: OptimizationType.ENERGY_EFFICIENCY,
      priority: Priority.MEDIUM,
      title: 'Inefficient Pump Operation',
      description: 'Continuous pump operation may waste energy. Consider using request mode.',
      impact: {
        energy: -10,
        comfort: 0,
        cost: -8
      },
      affectedSettings: ['F-0D'],
      suggestedValues: {
        'F-0D': '2' // Request mode
      }
    })
  }

  return recommendations
}

/**
 * Analyzes domestic hot water settings
 */
const analyzeDHWSettings = (settings, database) => {
  const recommendations = []

  // Check DHW temperature settings
  const comfortTemp = parseFloat(settings['6-0A'])
  const ecoTemp = parseFloat(settings['6-0B'])

  if (comfortTemp > 55) {
    recommendations.push({
      type: OptimizationType.ENERGY_EFFICIENCY,
      priority: Priority.MEDIUM,
      title: 'High DHW Temperature',
      description: 'Lower DHW temperature can improve efficiency while maintaining comfort.',
      impact: {
        energy: -8,
        comfort: -5,
        cost: -8
      },
      affectedSettings: ['6-0A'],
      suggestedValues: {
        '6-0A': '55'
      }
    })
  }

  if (comfortTemp - ecoTemp > 10) {
    recommendations.push({
      type: OptimizationType.COST,
      priority: Priority.LOW,
      title: 'Large DHW Temperature Difference',
      description: 'Reduce the gap between comfort and eco temperatures for better efficiency.',
      impact: {
        energy: -5,
        comfort: 0,
        cost: -5
      },
      affectedSettings: ['6-0A', '6-0B'],
      suggestedValues: {
        '6-0B': (comfortTemp - 10).toString()
      }
    })
  }

  return recommendations
}

/**
 * Analyzes comfort-related settings
 */
const analyzeComfortSettings = (settings, database) => {
  const recommendations = []

  // Room temperature settings
  const heatingMax = parseFloat(settings['3-06'])
  const heatingMin = parseFloat(settings['3-07'])
  const coolingMax = parseFloat(settings['3-08'])
  const coolingMin = parseFloat(settings['3-09'])

  // Check if temperature ranges are too wide
  if (heatingMax - heatingMin > 8) {
    recommendations.push({
      type: OptimizationType.COMFORT,
      priority: Priority.LOW,
      title: 'Wide Heating Temperature Range',
      description: 'Narrower temperature range can improve comfort and efficiency.',
      impact: {
        energy: -3,
        comfort: 10,
        cost: -2
      },
      affectedSettings: ['3-06', '3-07'],
      suggestedValues: {
        '3-06': Math.min(heatingMax, heatingMin + 8).toString(),
        '3-07': heatingMin.toString()
      }
    })
  }

  return recommendations
}

/**
 * Analyzes energy-related settings
 */
const analyzeEnergySettings = (settings, database) => {
  const recommendations = []

  // Power consumption control
  const powerControl = settings['4-08']
  if (powerControl === '0') {
    recommendations.push({
      type: OptimizationType.COST,
      priority: Priority.MEDIUM,
      title: 'No Power Consumption Control',
      description: 'Enable power consumption control to manage energy costs.',
      impact: {
        energy: -12,
        comfort: -5,
        cost: -15
      },
      affectedSettings: ['4-08'],
      suggestedValues: {
        '4-08': '1' // Continuous control
      }
    })
  }

  return recommendations
}

/**
 * Calculates the potential impact of applying recommendations
 */
export const calculateOptimizationImpact = (recommendations) => {
  return recommendations.reduce((impact, rec) => {
    impact.energy += rec.impact.energy
    impact.comfort += rec.impact.comfort
    impact.cost += rec.impact.cost
    return impact
  }, { energy: 0, comfort: 0, cost: 0 })
}

/**
 * Generates optimal settings based on user preferences
 */
export const generateOptimalSettings = (currentSettings, preferences) => {
  // Clone current settings
  const optimalSettings = { ...currentSettings }

  // Apply optimizations based on preferences
  if (preferences.prioritizeEfficiency) {
    // Adjust temperatures
    optimalSettings['6-0A'] = '50' // Lower DHW temperature
    optimalSettings['F-0D'] = '2' // Request-based pump operation
  }

  if (preferences.prioritizeComfort) {
    // Adjust comfort settings
    optimalSettings['9-0A'] = '23' // Comfort heating setpoint
    optimalSettings['9-0B'] = '23' // Comfort cooling setpoint
  }

  return optimalSettings
}