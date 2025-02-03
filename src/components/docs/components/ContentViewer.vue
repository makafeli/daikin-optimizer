/**
 * Document content viewer component
 */
<template>
  <v-card flat class="content-viewer">
    <!-- Navigation Bar -->
    <v-toolbar
      density="compact"
      class="border-b"
    >
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        :disabled="!canGoBack"
        @click="$emit('navigate', 'back')"
      ></v-btn>
      <v-btn
        icon="mdi-arrow-right"
        variant="text"
        :disabled="!canGoForward"
        @click="$emit('navigate', 'forward')"
      ></v-btn>
      <v-breadcrumbs :items="breadcrumbs" density="compact">
        <template v-slot:divider>
          <v-icon icon="mdi-chevron-right"></v-icon>
        </template>
      </v-breadcrumbs>
    </v-toolbar>

    <!-- Content -->
    <div class="content pa-4">
      <!-- Title -->
      <h1 class="text-h5 mb-4">{{ section.title }}</h1>

      <!-- Tags -->
      <div v-if="section.tags?.length" class="mb-4">
        <v-chip
          v-for="tag in section.tags"
          :key="tag"
          class="mr-2"
          size="small"
          variant="flat"
        >
          {{ tag }}
        </v-chip>
      </div>

      <!-- Main Content -->
      <div class="markdown-body" v-html="renderedContent"></div>

      <!-- Related Settings -->
      <template v-if="showSettings && relatedSettings.length">
        <v-divider class="my-4"></v-divider>
        <h2 class="text-h6 mb-2">Related Settings</h2>
        <v-list density="compact">
          <v-list-item
            v-for="setting in relatedSettings"
            :key="setting.code"
            :subtitle="setting.description"
          >
            <template v-slot:prepend>
              <v-icon
                :color="getCategoryColor(setting.category)"
                size="small"
              >
                mdi-cog
              </v-icon>
            </template>
            <v-list-item-title>
              {{ setting.name }}
              <span class="text-caption">({{ setting.code }})</span>
            </v-list-item-title>
            <template v-slot:append>
              <v-chip
                size="x-small"
                :color="getValueColor(setting)"
              >
                {{ setting.value || 'N/A' }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </template>

      <!-- References -->
      <template v-if="references.length">
        <v-divider class="my-4"></v-divider>
        <h2 class="text-h6 mb-2">References</h2>
        <v-expansion-panels>
          <v-expansion-panel
            v-for="ref in references"
            :key="ref.id"
          >
            <v-expansion-panel-title>
              <v-icon
                :icon="getReferenceIcon(ref.type)"
                size="small"
                class="mr-2"
              ></v-icon>
              {{ ref.title }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-2">{{ ref.description }}</div>
              <div class="mt-2" v-html="ref.content"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { DocumentSection, DocumentReference } from '../types'
import type { Setting, SettingCategory } from '@/types'
import { useSettingsStore } from '@/store/settingsStore'

const props = defineProps<{
  section: DocumentSection
  showSettings?: boolean
  canGoBack?: boolean
  canGoForward?: boolean
}>()

const emit = defineEmits<{
  navigate: ['back' | 'forward']
}>()

// Store
const settingsStore = useSettingsStore()

// Computed
const breadcrumbs = computed(() => {
  const items = []
  let current: DocumentSection | undefined = props.section
  
  while (current) {
    items.unshift({
      title: current.title,
      disabled: false
    })
    current = current.parent
      ? settingsStore.getDocumentSection(current.parent)
      : undefined
  }
  
  return items
})

const renderedContent = computed(() => {
  const html = marked(props.section.content)
  return DOMPurify.sanitize(html)
})

const relatedSettings = computed(() => {
  if (!props.section.relatedSettings) return []
  
  return props.section.relatedSettings
    .map(code => settingsStore.getSettingByCode(code))
    .filter((setting): setting is Setting => !!setting)
})

const references = computed<DocumentReference[]>(() => {
  // This would typically come from the store or props
  // For now, returning an empty array
  return []
})

// Methods
const getCategoryColor = (category: SettingCategory) => {
  const colors: Record<SettingCategory, string> = {
    'Room': 'primary',
    'Main Zone': 'secondary',
    'Additional Zone': 'success',
    'Space Heating/Cooling': 'warning',
    'Tank': 'info',
    'User Settings': 'error',
    'Installer Settings': 'grey'
  }
  return colors[category] || 'grey'
}

const getValueColor = (setting: Setting) => {
  if (!setting.value) return 'grey'
  if (setting.value !== setting.originalValue) return 'warning'
  return undefined
}

const getReferenceIcon = (type: DocumentReference['type']) => {
  switch (type) {
    case 'setting': return 'mdi-cog'
    case 'diagram': return 'mdi-image'
    case 'example': return 'mdi-code-tags'
    default: return 'mdi-file-document'
  }
}
</script>

<style>
.content-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content {
  flex-grow: 1;
  overflow-y: auto;
}

/* Markdown Styles */
.markdown-body h1 { font-size: 2em; margin-bottom: 0.5em; }
.markdown-body h2 { font-size: 1.5em; margin: 1em 0 0.5em; }
.markdown-body h3 { font-size: 1.25em; margin: 1em 0 0.5em; }
.markdown-body p { margin-bottom: 1em; }
.markdown-body ul, .markdown-body ol { margin-bottom: 1em; padding-left: 2em; }
.markdown-body code { padding: 0.2em 0.4em; background-color: rgba(var(--v-theme-surface-variant), 0.1); border-radius: 3px; }
.markdown-body pre { padding: 1em; margin-bottom: 1em; background-color: rgba(var(--v-theme-surface-variant), 0.1); border-radius: 4px; overflow-x: auto; }
.markdown-body blockquote { padding: 0 1em; border-left: 4px solid rgba(var(--v-theme-primary), 0.5); margin-bottom: 1em; }
.markdown-body img { max-width: 100%; height: auto; }
.markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
.markdown-body th, .markdown-body td { padding: 0.5em; border: 1px solid rgba(var(--v-border-color), 0.12); }
</style>