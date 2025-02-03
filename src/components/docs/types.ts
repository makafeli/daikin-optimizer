/**
 * Types for DocumentViewer components
 */
export interface DocumentSection {
  id: string
  title: string
  content: string
  parent?: string
  children?: DocumentSection[]
  tags?: string[]
  relatedSettings?: string[]
}

export interface SearchResult {
  sectionId: string
  title: string
  content: string
  relevance: number
  highlight?: string
  matchType: 'title' | 'content' | 'tag'
}

export interface TableOfContents {
  sections: DocumentSection[]
  currentSection?: string
}

export interface DocumentLink {
  id: string
  title: string
  type: 'internal' | 'external'
  url?: string
  sectionId?: string
}

export interface DocumentReference {
  id: string
  type: 'setting' | 'diagram' | 'example'
  title: string
  description: string
  content: string
}

export interface DocumentViewerConfig {
  showToc: boolean
  enableSearch: boolean
  showRelatedSettings: boolean
  autoExpandReferences: boolean
  showDiagrams: boolean
}

export interface NavigationState {
  currentSectionId: string
  history: string[]
  historyIndex: number
}