/**
 * Table of contents component for documentation
 */
<template>
  <v-navigation-drawer
    permanent
    :width="280"
    class="toc-drawer"
    elevation="1"
  >
    <!-- Search Bar -->
    <v-text-field
      v-model="searchQuery"
      prepend-inner-icon="mdi-magnify"
      label="Search documentation"
      density="compact"
      variant="outlined"
      class="ma-2"
      hide-details
      clearable
      @update:model-value="handleSearch"
    ></v-text-field>

    <!-- Navigation Tree -->
    <v-list
      density="compact"
      nav
      class="mt-2"
    >
      <template v-if="showSearchResults">
        <!-- Search Results -->
        <v-list-subheader>Search Results</v-list-subheader>
        <v-list-item
          v-for="result in searchResults"
          :key="result.sectionId"
          :value="result.sectionId"
          :active="currentSection === result.sectionId"
          @click="$emit('select', result.sectionId)"
        >
          <template v-slot:prepend>
            <v-icon :icon="getMatchTypeIcon(result.matchType)" size="small"></v-icon>
          </template>
          <v-list-item-title>{{ result.title }}</v-list-item-title>
          <v-list-item-subtitle
            v-if="result.highlight"
            class="text-caption"
            v-html="result.highlight"
          ></v-list-item-subtitle>
        </v-list-item>
      </template>
      <template v-else>
        <!-- Regular TOC -->
        <template v-for="section in sections" :key="section.id">
          <v-list-group
            v-if="section.children?.length"
            :value="section.id"
          >
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :active="currentSection === section.id"
                @click="$emit('select', section.id)"
              >
                <v-list-item-title>{{ section.title }}</v-list-item-title>
              </v-list-item>
            </template>

            <v-list-item
              v-for="child in section.children"
              :key="child.id"
              :value="child.id"
              :active="currentSection === child.id"
              @click="$emit('select', child.id)"
            >
              <v-list-item-title>{{ child.title }}</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <v-list-item
            v-else
            :value="section.id"
            :active="currentSection === section.id"
            @click="$emit('select', section.id)"
          >
            <v-list-item-title>{{ section.title }}</v-list-item-title>
          </v-list-item>
        </template>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DocumentSection, SearchResult } from '../types'

const props = defineProps<{
  sections: DocumentSection[]
  currentSection?: string
}>()

const emit = defineEmits<{
  select: [sectionId: string]
}>()

// State
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])

// Computed
const showSearchResults = computed(() => searchQuery.value.trim().length > 0)

// Methods
const handleSearch = (query: string) => {
  if (!query.trim()) {
    searchResults.value = []
    return
  }

  // Perform search through sections
  const results: SearchResult[] = []
  const searchTerm = query.toLowerCase()

  const searchSection = (section: DocumentSection) => {
    const titleMatch = section.title.toLowerCase().includes(searchTerm)
    const contentMatch = section.content.toLowerCase().includes(searchTerm)
    const tagMatch = section.tags?.some(tag => tag.toLowerCase().includes(searchTerm))

    if (titleMatch || contentMatch || tagMatch) {
      let matchType: SearchResult['matchType'] = 'content'
      if (titleMatch) matchType = 'title'
      if (tagMatch) matchType = 'tag'

      // Create highlighted snippet
      let highlight = ''
      if (contentMatch) {
        const contentIndex = section.content.toLowerCase().indexOf(searchTerm)
        const start = Math.max(0, contentIndex - 40)
        const end = Math.min(section.content.length, contentIndex + searchTerm.length + 40)
        highlight = '...' + section.content.slice(start, end) + '...'
        highlight = highlight.replace(
          new RegExp(searchTerm, 'gi'),
          match => `<mark>${match}</mark>`
        )
      }

      results.push({
        sectionId: section.id,
        title: section.title,
        content: section.content,
        relevance: titleMatch ? 2 : 1,
        highlight,
        matchType
      })
    }

    // Search through children
    section.children?.forEach(searchSection)
  }

  props.sections.forEach(searchSection)

  // Sort by relevance
  searchResults.value = results.sort((a, b) => b.relevance - a.relevance)
}

const getMatchTypeIcon = (type: SearchResult['matchType']) => {
  switch (type) {
    case 'title': return 'mdi-text-box-search'
    case 'tag': return 'mdi-tag-search'
    default: return 'mdi-text-search'
  }
}
</script>

<style scoped>
.toc-drawer {
  border-right: 1px solid rgba(var(--v-border-color), 0.12);
}

:deep(.v-list-item--active) {
  font-weight: 600;
}
</style>