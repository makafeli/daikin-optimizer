<template>
  <v-app>
    <v-app-bar app elevation="1">
      <v-app-bar-title>Daikin Altherma 3 Settings Optimizer</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDarkTheme ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <!-- Left Panel - Upload and Heat Pump Info -->
          <v-col cols="12" md="3">
            <file-upload />
            <heat-pump-info />
          </v-col>

          <!-- Center Panel - Settings Matrix -->
          <v-col cols="12" md="6">
            <settings-matrix />
          </v-col>

          <!-- Right Panel - Optimization and Documentation -->
          <v-col cols="12" md="3">
            <optimization-panel />
            <document-viewer />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import FileUpload from './components/upload/FileUpload.vue'
import SettingsMatrix from './components/matrix/SettingsMatrix.vue'
import HeatPumpInfo from './components/info/HeatPumpInfo.vue'
import OptimizationPanel from './components/optimization/OptimizationPanel.vue'
import DocumentViewer from './components/docs/DocumentViewer.vue'

const isDarkTheme = ref(false)

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
}
</script>

<style>
.v-application {
  font-family: 'Roboto', sans-serif;
}
</style>