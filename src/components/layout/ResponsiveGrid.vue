/** 
 * Responsive grid component for cards and widgets
 */
<template>
  <v-container :fluid="fluid" :class="containerClass">
    <!-- Grid Header -->
    <div
      v-if="$slots.header"
      :class="[
        'mb-4',
        { 'px-2': isMobile }
      ]"
    >
      <slot name="header"></slot>
    </div>

    <!-- Grid Items -->
    <v-row
      :dense="dense"
      :align="align"
      :justify="justify"
      :class="{ 'flex-nowrap': !wrap }"
    >
      <v-col
        v-for="(item, index) in items"
        :key="getItemKey(item, index)"
        v-bind="getColProps(item)"
      >
        <slot
          name="item"
          :item="item"
          :index="index"
        >
          <v-card
            :elevation="elevation"
            :class="cardClass"
            :height="height"
          >
            <!-- Card Media -->
            <slot
              name="media"
              :item="item"
              :index="index"
            >
              <v-img
                v-if="item.image"
                :src="item.image"
                :height="imageHeight"
                :cover="true"
              ></v-img>
            </slot>

            <!-- Card Content -->
            <v-card-item>
              <slot
                name="title"
                :item="item"
                :index="index"
              >
                <v-card-title v-if="item.title">
                  {{ item.title }}
                </v-card-title>
              </slot>

              <slot
                name="subtitle"
                :item="item"
                :index="index"
              >
                <v-card-subtitle v-if="item.subtitle">
                  {{ item.subtitle }}
                </v-card-subtitle>
              </slot>

              <slot
                name="content"
                :item="item"
                :index="index"
              >
                <v-card-text v-if="item.content">
                  {{ item.content }}
                </v-card-text>
              </slot>
            </v-card-item>

            <!-- Card Actions -->
            <template v-if="$slots.actions || item.actions">
              <v-divider></v-divider>
              <v-card-actions>
                <slot
                  name="actions"
                  :item="item"
                  :index="index"
                >
                  <template v-if="item.actions">
                    <v-spacer></v-spacer>
                    <v-btn
                      v-for="action in item.actions"
                      :key="action.key"
                      :color="action.color"
                      :variant="action.variant"
                      @click="handleAction(action, item, index)"
                    >
                      {{ action.label }}
                    </v-btn>
                  </template>
                </slot>
              </v-card-actions>
            </template>
          </v-card>
        </slot>
      </v-col>
    </v-row>

    <!-- Grid Footer -->
    <div
      v-if="$slots.footer"
      :class="[
        'mt-4',
        { 'px-2': isMobile }
      ]"
    >
      <slot name="footer"></slot>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

interface GridItem {
  id?: string | number
  cols?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  title?: string
  subtitle?: string
  content?: string
  image?: string
  actions?: Array<{
    key: string
    label: string
    color?: string
    variant?: string
    action: (item: GridItem, index: number) => void
  }>
  [key: string]: unknown
}

const props = withDefaults(defineProps<{
  items: GridItem[]
  fluid?: boolean
  dense?: boolean
  elevation?: number
  height?: string | number
  imageHeight?: string | number
  align?: string
  justify?: string
  wrap?: boolean
  cardClass?: string
  containerClass?: string
}>(), {
  fluid: true,
  dense: false,
  elevation: 1,
  wrap: true,
  align: 'start',
  justify: 'start'
})

const emit = defineEmits<{
  action: [action: string, item: GridItem, index: number]
}>()

// Responsive
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// Methods
const getItemKey = (item: GridItem, index: number) => {
  return item.id || index
}

const getColProps = (item: GridItem) => {
  return {
    cols: item.cols || 12,
    sm: item.sm,
    md: item.md,
    lg: item.lg,
    xl: item.xl
  }
}

const handleAction = (
  action: GridItem['actions'][0],
  item: GridItem,
  index: number
) => {
  action.action(item, index)
  emit('action', action.key, item, index)
}
</script>

<style scoped>
.v-row {
  margin: 0 -8px;
}

.v-col {
  padding: 8px;
}

/* Grid scrolling for nowrap rows */
.flex-nowrap {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.flex-nowrap::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

.flex-nowrap .v-col {
  scroll-snap-align: start;
}

/* Hover effects */
@media (hover: hover) {
  .v-card {
    transition: transform 0.2s ease-in-out;
  }

  .v-card:hover {
    transform: translateY(-2px);
  }
}
</style>