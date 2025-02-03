<template>
  <v-card class="documentation-viewer">
    <v-card-title class="d-flex align-center">
      Documentation
      <v-spacer></v-spacer>
      <v-text-field
        v-model="searchQuery"
        prepend-icon="mdi-magnify"
        label="Search documentation"
        single-line
        hide-details
        density="compact"
        class="mx-4"
      ></v-text-field>
      <v-btn-toggle v-model="viewMode" mandatory>
        <v-btn value="tree" icon="mdi-file-tree"></v-btn>
        <v-btn value="search" icon="mdi-text-search"></v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="pa-0">
      <v-container fluid class="pa-0">
        <v-row no-gutters>
          <!-- Navigation Panel -->
          <v-col cols="4" class="border-r">
            <v-list density="compact" nav>
              <template v-if="viewMode === 'tree'">
                <v-list-item
                  v-for="category in documentationTree"
                  :key="category.id"
                  :value="category"
                  :title="category.title"
                  @click="selectCategory(category)"
                >
                  <template v-slot:prepend>
                    <v-icon>{{ category.icon }}</v-icon>
                  </template>
                </v-list-item>
              </template>
              <template v-else>
                <v-list-item
                  v-for="result in searchResults"
                  :key="result.id"
                  :value="result"
                  @click="selectSearchResult(result)"
                >
                  <template v-slot:prepend>
                    <v-icon>mdi-text-search</v-icon>
                  </template>
                  <v-list-item-title>{{ result.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ result.preview }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-list>
          </v-col>

          <!-- Content Panel -->
          <v-col cols="8">
            <v-card flat>
              <v-card-text v-if="selectedContent">
                <div class="text-h6 mb-4">{{ selectedContent.title }}</div>
                <div class="mb-4">
                  <v-chip
                    v-for="tag in selectedContent.tags"
                    :key="tag"
                    class="mr-2 mb-2"
                    color="primary"
                    label
                    small
                  >
                    {{ tag }}
                  </v-chip>
                </div>
                <div class="content-body" v-html="formattedContent"></div>

                <!-- Related Settings -->
                <template v-if="selectedContent.relatedSettings?.length">
                  <v-divider class="my-4"></v-divider>
                  <div class="text-h6 mb-2">Related Settings</div>
                  <v-list density="compact">
                    <v-list-item
                      v-for="setting in selectedContent.relatedSettings"
                      :key="setting.code"
                      :title="setting.name"
                      :subtitle="setting.description"
                    >
                      <template v-slot:prepend>
                        <v-icon>mdi-cog</v-icon>
                      </template>
                      <template v-slot:append>
                        <v-chip
                          :color="setting.valueColor"
                          label
                          small
                        >
                          {{ setting.currentValue }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                </template>

                <!-- Technical Diagrams -->
                <template v-if="selectedContent.diagrams?.length">
                  <v-divider class="my-4"></v-divider>
                  <div class="text-h6 mb-2">Technical Diagrams</div>
                  <v-carousel
                    show-arrows="hover"
                    height="300"
                    hide-delimiter-background
                  >
                    <v-carousel-item
                      v-for="diagram in selectedContent.diagrams"
                      :key="diagram.id"
                      :src="diagram.url"
                    >
                      <v-sheet
                        height="100%"
                        class="d-flex align-center justify-center"
                      >
                        <div class="text-center">
                          <div class="text-h6">{{ diagram.title }}</div>
                          <div class="text-subtitle-1">{{ diagram.description }}</div>
                        </div>
                      </v-sheet>
                    </v-carousel-item>
                  </v-carousel>
                </template>
              </v-card-text>
              <v-card-text v-else class="text-center">
                <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
                <div class="text-h6 mt-4">Select a document to view</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const viewMode = ref('tree')
const searchQuery = ref('')
const selectedContent = ref(null)

// Sample documentation tree structure
const documentationTree = ref([
  {
    id: 1,
    title: 'Getting Started',
    icon: 'mdi-book-open-page-variant',
    content: `
# Getting Started with Daikin Altherma 3

This guide will help you understand the basic configuration and operation of your heat pump system.

## Initial Setup

1. Check system pressure
2. Configure basic settings
3. Test operation modes

## Key Components

- Heat pump unit
- User interface
- DHW tank
- Space heating/cooling emitters
    `,
    tags: ['setup', 'configuration', 'basics'],
    relatedSettings: [
      {
        code: '2-0C',
        name: 'Emitter Type',
        description: 'Type of heating emitter in the main zone',
        currentValue: 'Underfloor',
        valueColor: 'success'
      }
    ]
  },
  {
    id: 2,
    title: 'Operation Modes',
    icon: 'mdi-tune',
    content: '...',
    tags: ['operation', 'modes']
  },
  {
    id: 3,
    title: 'Maintenance',
    icon: 'mdi-tools',
    content: '...',
    tags: ['maintenance', 'service']
  }
])

// Computed Properties
const searchResults = computed(() => {
  if (!searchQuery.value) return []
  
  // Search through documentation tree
  return documentationTree.value.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).map(doc => ({
    id: doc.id,
    title: doc.title,
    preview: doc.content.substring(0, 100) + '...',
    content: doc.content
  }))
})

const formattedContent = computed(() => {
  if (!selectedContent.value?.content) return ''
  const htmlContent = marked(selectedContent.value.content)
  return DOMPurify.sanitize(htmlContent)
})

// Methods
const selectCategory = (category) => {
  selectedContent.value = category
}

const selectSearchResult = (result) => {
  const fullContent = documentationTree.value.find(doc => doc.id === result.id)
  selectedContent.value = fullContent
}

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (newQuery) {
    viewMode.value = 'search'
  }
})
</script>

<style scoped>
.documentation-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.border-r {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.content-body {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.content-body :deep(h1) {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.content-body :deep(h2) {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.content-body :deep(ul) {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.content-body :deep(p) {
  margin-bottom: 1rem;
}
</style>