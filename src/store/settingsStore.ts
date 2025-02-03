/**
 * Settings store implementation
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { validateSetting, validateSettings } from '@/utils/validation'
import { analyzeSettings, generateOptimalSettings } from '@/utils/optimization'
import type {
  Setting,
  SystemStatus,
  OptimizationSuggestion,
  ValidationResult,
  UserPreferences,
  SystemMetrics
} from '@/types'
import type {
  SettingsState,
  SettingChange,
  OptimizationConfig,
  ValidationConfig,
  SettingUpdateResult
} from './types'

const DEFAULT_PREFERENCES: UserPreferences = {
  prioritizeEfficiency: true,
  prioritizeComfort: false,
  quietOperation: false,
  scheduleOptimization: true,
  notifications: {
    errors: true,
    warnings: true,
    suggestions: true,
    updates: true
  },
  temperatureUnit: 'C',
  theme: 'system',
  language: 'en'
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const currentSettings: Ref<Record<string, string>> = ref({})
  const originalSettings: Ref<Record<string, string>> = ref({})
  const settingsDatabase: Ref<Record<string, Setting>> = ref({})
  const validationErrors: Ref<Record<string, ValidationResult>> = ref({})
  const optimizationSuggestions: Ref<OptimizationSuggestion[]> = ref([])
  const changeHistory: Ref<SettingChange[]> = ref([])
  const systemStatus: Ref<SystemStatus | null> = ref(null)
  const preferences: Ref<UserPreferences> = ref({ ...DEFAULT_PREFERENCES })
  const metrics: Ref<SystemMetrics | null> = ref(null)

  // Getters
  const getSettingByCode = computed(() => (code: string): Setting | undefined => {
    const setting = settingsDatabase.value[code]
    if (setting) {
      return {
        ...setting,
        value: currentSettings.value[code],
        originalValue: originalSettings.value[code]
      }
    }
    return undefined
  })

  const getSettingsByCategory = computed(() => (category: string): Setting[] => {
    return Object.values(settingsDatabase.value)
      .filter(setting => setting.category === category)
      .map(setting => ({
        ...setting,
        value: currentSettings.value[setting.code],
        originalValue: originalSettings.value[setting.code]
      }))
  })

  const getChangedSettings = computed((): Setting[] => {
    return Object.entries(currentSettings.value)
      .filter(([code, value]) => value !== originalSettings.value[code])
      .map(([code]) => getSettingByCode.value(code)!)
  })

  const hasUnsavedChanges = computed((): boolean => {
    return Object.entries(currentSettings.value)
      .some(([code, value]) => value !== originalSettings.value[code])
  })

  const isValid = computed((): boolean => {
    return Object.keys(validationErrors.value).length === 0
  })

  // Actions
  async function initializeStore(settingsData: Record<string, Setting>) {
    settingsDatabase.value = settingsData
    await validateAllSettings()
    await analyzeCurrentSettings()
  }

  async function importSettings(settings: Record<string, string>) {
    currentSettings.value = { ...settings }
    originalSettings.value = { ...settings }
    changeHistory.value = []
    
    await validateAllSettings()
    await analyzeCurrentSettings()
  }

  async function validateSingleSetting(
    code: string,
    value: string,
    config?: ValidationConfig
  ): Promise<ValidationResult> {
    const validation = await validateSetting(
      code,
      value,
      settingsDatabase.value,
      currentSettings.value,
      config
    )

    if (!validation.isValid) {
      validationErrors.value[code] = validation
    } else {
      delete validationErrors.value[code]
    }

    return validation
  }

  async function validateAllSettings(config?: ValidationConfig): Promise<boolean> {
    const validation = await validateSettings(
      currentSettings.value,
      settingsDatabase.value,
      config
    )
    validationErrors.value = validation.errors || {}
    return validation.isValid
  }

  async function updateSetting(
    code: string,
    value: string,
    config?: ValidationConfig
  ): Promise<SettingUpdateResult> {
    // Validate before updating
    const validation = await validateSingleSetting(code, value, config)
    if (!validation.isValid && !config?.allowOverride) {
      return { success: false, errors: validation.errors }
    }

    const previousValue = currentSettings.value[code]
    currentSettings.value[code] = value
    
    changeHistory.value.push({
      timestamp: new Date().toISOString(),
      code,
      previousValue,
      newValue: value,
      type: 'manual'
    })

    // Analyze impact of change
    await analyzeCurrentSettings()

    const setting = getSettingByCode.value(code)
    return { success: true, setting }
  }

  async function analyzeCurrentSettings(config?: OptimizationConfig) {
    optimizationSuggestions.value = await analyzeSettings(
      currentSettings.value,
      settingsDatabase.value,
      {
        ...preferences.value,
        ...config
      }
    )
  }

  async function applyOptimization(
    suggestion: OptimizationSuggestion,
    config?: ValidationConfig
  ): Promise<boolean> {
    const changes: SettingChange[] = []
    
    // Apply suggested values
    for (const [code, value] of Object.entries(suggestion.suggestedValues)) {
      const validation = await validateSingleSetting(code, value, config)
      if (validation.isValid || config?.allowOverride) {
        changes.push({
          timestamp: new Date().toISOString(),
          code,
          previousValue: currentSettings.value[code],
          newValue: value,
          type: 'optimization'
        })
        currentSettings.value[code] = value
      }
    }

    // Record changes in history
    if (changes.length > 0) {
      changeHistory.value.push(...changes)
      await analyzeCurrentSettings()
      return true
    }

    return false
  }

  async function generateOptimalSettings(config?: OptimizationConfig): Promise<boolean> {
    const optimalSettings = await generateOptimalSettings(
      currentSettings.value,
      settingsDatabase.value,
      {
        ...preferences.value,
        ...config
      }
    )

    // Validate optimal settings
    const validation = await validateSettings(
      optimalSettings,
      settingsDatabase.value
    )
    
    if (!validation.isValid) {
      validationErrors.value = validation.errors || {}
      return false
    }

    // Record changes
    const changes: SettingChange[] = []
    for (const [code, value] of Object.entries(optimalSettings)) {
      if (value !== currentSettings.value[code]) {
        changes.push({
          timestamp: new Date().toISOString(),
          code,
          previousValue: currentSettings.value[code],
          newValue: value,
          type: 'optimization',
          description: 'Optimal settings generated'
        })
      }
    }

    if (changes.length > 0) {
      currentSettings.value = { ...optimalSettings }
      changeHistory.value.push(...changes)
      await analyzeCurrentSettings()
    }

    return true
  }

  function undoLastChange(): boolean {
    const lastChange = changeHistory.value.pop()
    if (lastChange) {
      currentSettings.value[lastChange.code] = lastChange.previousValue
      analyzeCurrentSettings()
      return true
    }
    return false
  }

  function resetChanges(): void {
    currentSettings.value = { ...originalSettings.value }
    changeHistory.value = []
    validationErrors.value = {}
    validateAllSettings()
    analyzeCurrentSettings()
  }

  function updatePreferences(newPreferences: Partial<UserPreferences>): void {
    preferences.value = {
      ...preferences.value,
      ...newPreferences
    }
    analyzeCurrentSettings()
  }

  function updateSystemStatus(status: SystemStatus): void {
    systemStatus.value = status
    metrics.value = status.metrics
  }

  return {
    // State
    currentSettings,
    originalSettings,
    settingsDatabase,
    validationErrors,
    optimizationSuggestions,
    changeHistory,
    systemStatus,
    preferences,
    metrics,

    // Getters
    getSettingByCode,
    getSettingsByCategory,
    getChangedSettings,
    hasUnsavedChanges,
    isValid,

    // Actions
    initializeStore,
    importSettings,
    validateSingleSetting,
    validateAllSettings,
    updateSetting,
    analyzeCurrentSettings,
    applyOptimization,
    generateOptimalSettings,
    undoLastChange,
    resetChanges,
    updatePreferences,
    updateSystemStatus
  }
})