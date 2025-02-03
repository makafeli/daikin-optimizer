/**
 * Main documentation viewer component
 */
<template>
  <v-card class="d-flex fill-height">
    <!-- Table of Contents -->
    <table-of-contents
      v-if="config.showToc"
      :sections="sections"
      :current-section="currentSectionId"
      @select="handleSectionSelect"
    />

    <!-- Content Area -->
    <div class="flex-grow-1">
      <content-viewer
        v-if="currentSection"
        :section="currentSection"
        :show-settings="config.showRelatedSettings"
        :can-go-back="canNavigateBack"
        :can-go-forward="canNavigateForward"
        @navigate="handleNavigation"
      />
      
      <!-- Empty State -->
      <v-card
        v-else
        flat
        class="fill-height d-flex align-center justify-center"
      >
        <div class="text-center">
          <v-icon
            icon="mdi-file-document-outline"
            size="64"
            color="grey-lighten-1"
          ></v-icon>
          <div class="text-h6 text-grey mt-4">
            Select a document to view
          </div>
        </div>
      </v-card>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type {
  DocumentSection,
  DocumentViewerConfig,
  NavigationState
} from './types'
import TableOfContents from './components/TableOfContents.vue'
import ContentViewer from './components/ContentViewer.vue'

// Props
const props = withDefaults(defineProps<{
  config?: Partial<DocumentViewerConfig>
}>(), {
  config: () => ({
    showToc: true,
    enableSearch: true,
    showRelatedSettings: true,
    autoExpandReferences: true,
    showDiagrams: true
  })
})

// State
const navigation = ref<NavigationState>({
  currentSectionId: '',
  history: [],
  historyIndex: -1
})

const sections = ref<DocumentSection[]>([
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: '# Getting Started\n\nThis guide will help you understand how to use the Daikin Altherma 3 heat pump system.',
    children: [
      {
        id: 'initial-setup',
        title: 'Initial Setup',
        content: '## Initial Setup\n\nLearn how to set up your heat pump for the first time.',
        tags: ['setup', 'configuration']
      },
      {
        id: 'basic-operation',
        title: 'Basic Operation',
        content: '## Basic Operation\n\nUnderstand the day-to-day operation of your heat pump.',
        tags: ['operation', 'daily-use']
      }
    ]
  },
  {
    id: 'optimization',
    title: 'Optimization Guide',
    content: '# Optimization Guide\n\nLearn how to optimize your heat pump settings for maximum efficiency.',
    children: [
      {
        id: 'heating-curve',
        title: 'Heating Curve',
        content: '## Heating Curve\n\nUnderstand and optimize the heating curve for better performance.',
        tags: ['efficiency', 'heating'],
        relatedSettings: ['1-00', '1-01', '1-02', '1-03']
      },
      {
        id: 'scheduling',
        title: 'Scheduling',
        content: '## Scheduling\n\nSet up efficient heating and cooling schedules.',
        tags: ['efficiency', 'scheduling']
      }
    ]
  }
])

// Computed
const currentSectionId = computed(() => navigation.value.currentSectionId)

const currentSection = computed(() => {
  if (!currentSectionId.value) return null
  
  const findSection = (sections: DocumentSection[]): DocumentSection | null => {
    for (const section of sections) {
      if (section.id === currentSectionId.value) return section
      if (section.children?.length) {
        const found = findSection(section.children)
        if (found) return found
      }
    }
    return null
  }
  
  return findSection(sections.value)
})

const canNavigateBack = computed(() =>
  navigation.value.historyIndex > 0
)

const canNavigateForward = computed(() =>
  navigation.value.historyIndex < navigation.value.history.length - 1
)

// Methods
const handleSectionSelect = (sectionId: string) => {
  // Remove forward history if we're not at the end
  if (navigation.value.historyIndex < navigation.value.history.length - 1) {
    navigation.value.history = navigation.value.history.slice(
      0,
      navigation.value.historyIndex + 1
    )
  }
  
  // Add new section to history
  navigation.value.history.push(sectionId)
  navigation.value.historyIndex = navigation.value.history.length - 1
  navigation.value.currentSectionId = sectionId
}

const handleNavigation = (direction: 'back' | 'forward') => {
  if (direction === 'back' && canNavigateBack.value) {
    navigation.value.historyIndex--
  } else if (direction === 'forward' && canNavigateForward.value) {
    navigation.value.historyIndex++
  }
  
  navigation.value.currentSectionId =
    navigation.value.history[navigation.value.historyIndex]
}

// Lifecycle
onMounted(() => {
  // Load initial section if specified
  if (sections.value.length > 0) {
    handleSectionSelect(sections.value[0].id)
  }
})
</script>

<style scoped>
.fill-height {
  height: 100%;
}
</style>