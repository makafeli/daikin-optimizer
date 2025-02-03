/**
 * Optimization utilities for Daikin Altherma 3 settings
 */
import type { Setting, OptimizationSuggestion, SystemMetrics, UserPreferences } from '@/types'
import { validateSettings } from './validation'

export interface OptimizationContext {
  currentSettings: Record<string, string>
  settingsDatabase: Record<string, Setting>
  preferences: UserPreferences
  metrics?: SystemMetrics
}

export interface OptimizationResult {
  suggestions: OptimizationSuggestion[]
  potentialSavings: {
    energy: number
    cost: number
  }
}

interface AnalysisRule {
  id: string
  name: string
  description: string
  analyze: (context: OptimizationContext) => Promise<OptimizationSuggestion | null>
}

const optimizationRules: AnalysisRule[] = [
  // Heating curve optimization
  {
    id: 'heating-curve',
    name: 'Heating Curve Optimization',
    description: 'Optimize heating curve based on outdoor temperature and comfort settings',
    async analyze(context: OptimizationContext): Promise<OptimizationSuggestion | null> {
      const { currentSettings, settingsDatabase, preferences } = context
      
      // Get heating curve points
      const lowPoint = parseFloat(currentSettings['1-00']) // Low ambient temp
      const highPoint = parseFloat(currentSettings['1-01']) // High ambient temp
      const lowWater = parseFloat(currentSettings['1-02']) // Water temp at low point
      const highWater = parseFloat(currentSettings['1-03']) // Water temp at high point

      // Calculate curve slope
      const slope = (highWater - lowWater) / (highPoint - lowPoint)

      // Check if curve is too steep
      if (slope > 1.5) {
        const newLowWater = Math.max(35, lowWater - 5)
        const newHighWater = Math.max(25, highWater - 5)
        
        // Validate suggested values
        const validation = await validateSettings(
          {
            '1-02': newLowWater.toString(),
            '1-03': newHighWater.toString()
          },
          settingsDatabase
        )

        if (validation.isValid) {
          return {
            id: 'heating-curve-1',
            type: 'energy_efficiency',
            priority: 'high',
            title: 'Optimize Heating Curve',
            description: 'Current heating curve may lead to overheating and energy waste.',
            impact: {
              energy: -15,  // Estimated 15% energy savings
              comfort: preferences.prioritizeComfort ? -5 : 0,
              cost: -12
            },
            affectedSettings: ['1-02', '1-03'],
            suggestedValues: {
              '1-02': newLowWater.toString(),
              '1-03': newHighWater.toString()
            },
            canAutoApply: true
          }
        }
      }
      return null
    }
  },

  // DHW temperature optimization
  {
    id: 'dhw-temp',
    name: 'DHW Temperature Optimization',
    description: 'Optimize domestic hot water temperature settings',
    async analyze(context: OptimizationContext): Promise<OptimizationSuggestion | null> {
      const { currentSettings, settingsDatabase, preferences } = context
      
      const comfortTemp = parseFloat(currentSettings['6-0A'])
      const ecoTemp = parseFloat(currentSettings['6-0B'])

      if (comfortTemp > 55) {
        const newTemp = Math.min(comfortTemp, 55)
        
        // Validate suggested value
        const validation = await validateSettings(
          { '6-0A': newTemp.toString() },
          settingsDatabase
        )

        if (validation.isValid) {
          return {
            id: 'dhw-temp-1',
            type: 'energy_efficiency',
            priority: 'medium',
            title: 'Reduce DHW Temperature',
            description: 'Lower DHW temperature can improve efficiency while maintaining comfort.',
            impact: {
              energy: -8,
              comfort: preferences.prioritizeComfort ? -5 : 0,
              cost: -8
            },
            affectedSettings: ['6-0A'],
            suggestedValues: {
              '6-0A': newTemp.toString()
            },
            canAutoApply: true
          }
        }
      }

      // Check temperature difference between comfort and eco
      if (comfortTemp - ecoTemp > 10) {
        const newEcoTemp = comfortTemp - 10
        
        const validation = await validateSettings(
          { '6-0B': newEcoTemp.toString() },
          settingsDatabase
        )

        if (validation.isValid) {
          return {
            id: 'dhw-temp-2',
            type: 'energy_efficiency',
            priority: 'low',
            title: 'Optimize DHW Temperature Difference',
            description: 'Reduce the gap between comfort and eco temperatures for better efficiency.',
            impact: {
              energy: -5,
              comfort: 0,
              cost: -5
            },
            affectedSettings: ['6-0B'],
            suggestedValues: {
              '6-0B': newEcoTemp.toString()
            },
            canAutoApply: true
          }
        }
      }
      return null
    }
  },

  // Pump operation optimization
  {
    id: 'pump-operation',
    name: 'Pump Operation Optimization',
    description: 'Optimize pump operation mode and speed',
    async analyze(context: OptimizationContext): Promise<OptimizationSuggestion | null> {
      const { currentSettings, settingsDatabase } = context
      
      // Check pump operation mode
      if (currentSettings['F-0D'] === '0') { // Continuous mode
        const validation = await validateSettings(
          { 'F-0D': '2' },  // Request mode
          settingsDatabase
        )

        if (validation.isValid) {
          return {
            id: 'pump-1',
            type: 'energy_efficiency',
            priority: 'medium',
            title: 'Optimize Pump Operation',
            description: 'Change pump operation to request mode for better efficiency.',
            impact: {
              energy: -10,
              comfort: 0,
              cost: -8
            },
            affectedSettings: ['F-0D'],
            suggestedValues: {
              'F-0D': '2'
            },
            canAutoApply: true
          }
        }
      }
      return null
    }
  }
]

/**
 * Analyzes current settings and generates optimization suggestions
 */
export async function analyzeSettings(context: OptimizationContext): Promise<OptimizationSuggestion[]> {
  const suggestions: OptimizationSuggestion[] = []

  for (const rule of optimizationRules) {
    try {
      const suggestion = await rule.analyze(context)
      if (suggestion) {
        suggestions.push(suggestion)
      }
    } catch (error) {
      console.error(`Error analyzing rule ${rule.id}:`, error)
    }
  }

  return suggestions
}

/**
 * Generates optimal settings based on current configuration and preferences
 */
export async function generateOptimalSettings(
  context: OptimizationContext
): Promise<Record<string, string>> {
  const { currentSettings, settingsDatabase, preferences } = context
  const optimalSettings = { ...currentSettings }

  // Get all optimization suggestions
  const suggestions = await analyzeSettings(context)

  // Sort suggestions by priority and impact
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority]
    const bPriority = priorityOrder[b.priority]
    
    if (aPriority !== bPriority) return bPriority - aPriority
    
    // If same priority, sort by impact
    const aImpact = Math.abs(a.impact.energy) + Math.abs(a.impact.cost)
    const bImpact = Math.abs(b.impact.energy) + Math.abs(b.impact.cost)
    return bImpact - aImpact
  })

  // Apply suggestions that meet criteria
  for (const suggestion of suggestions) {
    // Skip if comfort impact is too high and comfort is prioritized
    if (preferences.prioritizeComfort && suggestion.impact.comfort < -3) {
      continue
    }

    // Apply suggested values
    Object.entries(suggestion.suggestedValues).forEach(([code, value]) => {
      optimalSettings[code] = value
    })
  }

  // Validate final settings
  const validation = await validateSettings(optimalSettings, settingsDatabase)
  if (!validation.isValid) {
    throw new Error('Generated settings are invalid')
  }

  return optimalSettings
}