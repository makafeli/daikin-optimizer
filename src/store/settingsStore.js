import { defineStore } from 'pinia'
import { validateSetting, validateSettings } from '@/utils/validation'
import { analyzeSettings, generateOptimalSettings } from '@/utils/optimization'
import parseSettingsDatabase from '@/utils/settingsParser'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    currentSettings: {},
    originalSettings: {},
    settingsDatabase: {},
    categories: {},
    settingTypes: {},
    validationErrors: {},
    optimizationSuggestions: [],
    changeHistory: [],
    systemInfo: {
      model: '',
      specifications: {},
      zones: [],
      performanceMetrics: {}
    },
    preferences: {
      prioritizeEfficiency: true,
      prioritizeComfort: false,
      quietOperation: false,
      scheduleOptimization: true
    }
  }),

  getters: {
    getSettingByCode: (state) => (code) => {
      return {
        ...state.settingsDatabase[code],
        currentValue: state.currentSettings[code],
        originalValue: state.originalSettings[code],
        validationErrors: state.validationErrors[code]
      }
    },

    getSettingsByCategory: (state) => (category) => {
      return Object.values(state.settingsDatabase)
        .filter(setting => setting.category === category)
        .map(setting => ({
          ...setting,
          currentValue: state.currentSettings[setting.code],
          originalValue: state.originalSettings[setting.code],
          validationErrors: state.validationErrors[setting.code]
        }))
    },

    getChangedSettings: (state) => {
      return Object.entries(state.currentSettings)
        .filter(([code, value]) => value !== state.originalSettings[code])
        .map(([code, value]) => ({
          ...state.settingsDatabase[code],
          currentValue: value,
          originalValue: state.originalSettings[code],
          validationErrors: state.validationErrors[code]
        }))
    },

    hasUnsavedChanges: (state) => {
      return Object.entries(state.currentSettings)
        .some(([code, value]) => value !== state.originalSettings[code])
    },

    isValid: (state) => {
      return Object.keys(state.validationErrors).length === 0
    }
  },

  actions: {
    async initializeStore(settingsData) {
      const { categories, settingTypes, settings } = parseSettingsDatabase(settingsData)
      this.categories = categories
      this.settingTypes = settingTypes
      this.settingsDatabase = settings
      
      // Validate initial settings
      this.validateAllSettings()
      
      // Generate initial optimization suggestions
      await this.analyzeSettings()
    },

    async importSettings(settingsData) {
      this.currentSettings = { ...settingsData }
      this.originalSettings = { ...settingsData }
      this.changeHistory = []
      
      // Validate imported settings
      this.validateAllSettings()
      
      // Generate optimization suggestions
      await this.analyzeSettings()
    },

    validateSetting(code, value) {
      const validation = validateSetting(
        code,
        value,
        this.settingsDatabase,
        this.currentSettings
      )

      if (!validation.isValid) {
        this.validationErrors[code] = validation.errors
      } else {
        delete this.validationErrors[code]
      }

      return validation
    },

    validateAllSettings() {
      const validation = validateSettings(this.currentSettings, this.settingsDatabase)
      this.validationErrors = validation.errors
      return validation
    },

    async updateSetting(code, value) {
      // Validate before updating
      const validation = this.validateSetting(code, value)
      if (!validation.isValid) {
        return { success: false, errors: validation.errors }
      }

      const previousValue = this.currentSettings[code]
      this.currentSettings[code] = value
      
      this.changeHistory.push({
        timestamp: new Date().toISOString(),
        code,
        previousValue,
        newValue: value,
        type: 'manual'
      })

      // Trigger optimization analysis
      await this.analyzeSettings()

      return { success: true }
    },

    async analyzeSettings() {
      this.optimizationSuggestions = analyzeSettings(
        this.currentSettings,
        this.settingsDatabase,
        this.systemInfo
      )
    },

    async applyOptimization(recommendation) {
      const changes = []
      
      // Apply suggested values
      for (const [code, value] of Object.entries(recommendation.suggestedValues)) {
        const validation = this.validateSetting(code, value)
        if (validation.isValid) {
          changes.push({
            code,
            previousValue: this.currentSettings[code],
            newValue: value
          })
          this.currentSettings[code] = value
        }
      }

      // Record changes in history
      if (changes.length > 0) {
        this.changeHistory.push({
          timestamp: new Date().toISOString(),
          changes,
          type: 'optimization',
          recommendation: recommendation.title
        })

        // Re-analyze settings
        await this.analyzeSettings()
      }

      return { success: changes.length > 0, changes }
    },

    async generateOptimalSettings() {
      const optimalSettings = generateOptimalSettings(
        this.currentSettings,
        this.preferences
      )

      // Validate optimal settings
      const validation = validateSettings(optimalSettings, this.settingsDatabase)
      if (!validation.isValid) {
        return { success: false, errors: validation.errors }
      }

      // Record changes
      const changes = []
      for (const [code, value] of Object.entries(optimalSettings)) {
        if (value !== this.currentSettings[code]) {
          changes.push({
            code,
            previousValue: this.currentSettings[code],
            newValue: value
          })
        }
      }

      if (changes.length > 0) {
        this.currentSettings = { ...optimalSettings }
        this.changeHistory.push({
          timestamp: new Date().toISOString(),
          changes,
          type: 'optimization',
          description: 'Applied optimal settings based on preferences'
        })

        await this.analyzeSettings()
      }

      return { success: true, changes }
    },

    undoLastChange() {
      const lastChange = this.changeHistory.pop()
      if (lastChange) {
        if (Array.isArray(lastChange.changes)) {
          // Revert multiple changes
          lastChange.changes.forEach(change => {
            this.currentSettings[change.code] = change.previousValue
          })
        } else {
          // Revert single change
          this.currentSettings[lastChange.code] = lastChange.previousValue
        }
        
        // Re-validate and analyze
        this.validateAllSettings()
        this.analyzeSettings()
      }
    },

    resetChanges() {
      this.currentSettings = { ...this.originalSettings }
      this.changeHistory = []
      this.validationErrors = {}
      this.validateAllSettings()
      this.analyzeSettings()
    },

    exportSettings() {
      // Validate before export
      const validation = this.validateAllSettings()
      if (!validation.isValid) {
        return { success: false, errors: validation.errors }
      }

      return {
        success: true,
        settings: this.currentSettings,
        timestamp: new Date().toISOString(),
        changes: this.changeHistory
      }
    },

    updatePreferences(newPreferences) {
      this.preferences = {
        ...this.preferences,
        ...newPreferences
      }
      // Re-analyze with new preferences
      this.analyzeSettings()
    }
  }
})