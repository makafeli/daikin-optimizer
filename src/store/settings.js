import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    matrixData: {},
    heatPumpInfo: {
      model: '',
      systemSpecs: {},
      zoneConfig: {},
      performanceMetrics: {}
    },
    settingsDatabase: {}, // Will contain setting descriptions, ranges, and categories
    optimizationHistory: [],
    activeProfile: null,
    savedProfiles: [],
    isDarkMode: false
  }),

  getters: {
    getSettingValue: (state) => (id) => {
      return state.matrixData[id] || '00'
    },
    
    getSettingInfo: (state) => (id) => {
      return state.settingsDatabase[id] || {
        description: 'Unknown Setting',
        range: '00-FF',
        category: 'uncategorized'
      }
    },
    
    getOptimizationSuggestions: (state) => {
      // Implementation for generating optimization suggestions
      return []
    }
  },

  actions: {
    updateSetting(id, value) {
      this.matrixData[id] = value.toUpperCase()
      this.optimizationHistory.push({
        timestamp: new Date().toISOString(),
        settingId: id,
        oldValue: this.matrixData[id],
        newValue: value,
        type: 'manual'
      })
    },

    importSettings(data) {
      this.matrixData = { ...data }
    },

    saveProfile(name) {
      this.savedProfiles.push({
        name,
        data: { ...this.matrixData },
        timestamp: new Date().toISOString()
      })
    },

    loadProfile(name) {
      const profile = this.savedProfiles.find(p => p.name === name)
      if (profile) {
        this.matrixData = { ...profile.data }
        this.activeProfile = name
      }
    },

    updateHeatPumpInfo(info) {
      this.heatPumpInfo = { ...info }
    },

    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
    },

    // Optimization related actions
    applyOptimization(settingId, suggestedValue) {
      const oldValue = this.matrixData[settingId]
      this.matrixData[settingId] = suggestedValue
      this.optimizationHistory.push({
        timestamp: new Date().toISOString(),
        settingId,
        oldValue,
        newValue: suggestedValue,
        type: 'optimization'
      })
    },

    undoLastChange() {
      const lastChange = this.optimizationHistory.pop()
      if (lastChange) {
        this.matrixData[lastChange.settingId] = lastChange.oldValue
      }
    }
  }
})