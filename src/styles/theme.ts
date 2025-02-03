/**
 * Custom theme configuration
 */
export const theme = {
  dark: false,
  colors: {
    primary: '#1976D2',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',

    // Custom colors
    'device-online': '#4CAF50',
    'device-offline': '#9E9E9E',
    'device-error': '#FF5252',
    'optimization-high': '#F44336',
    'optimization-medium': '#FFC107',
    'optimization-low': '#4CAF50',
    'chart-line-1': '#1976D2',
    'chart-line-2': '#4CAF50',
    'chart-line-3': '#FFC107',
    'chart-line-4': '#FF5252'
  },

  // Light theme variables
  light: {
    dark: false,
    colors: {
      'background': '#FFFFFF',
      'surface': '#FFFFFF',
      'surface-variant': '#F5F5F5',
      'on-surface-variant': '#424242',
      'primary-darken-1': '#1565C0',
      'secondary-darken-1': '#212121',
      'error-darken-1': '#D32F2F',
    },
  },

  // Dark theme variables
  dark: {
    dark: true,
    colors: {
      'background': '#121212',
      'surface': '#1E1E1E',
      'surface-variant': '#2D2D2D',
      'on-surface-variant': '#EEEEEE',
      'primary-darken-1': '#1565C0',
      'secondary-darken-1': '#9E9E9E',
      'error-darken-1': '#D32F2F',
    },
  }
}

/**
 * Theme defaults
 */
export const defaultSettings = {  
  // Global defaults
  defaults: {
    VCard: {
      elevation: 1,
      rounded: 'lg'
    },
    VBtn: {
      variant: 'elevated',
      rounded: 'lg'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VList: {
      density: 'comfortable'
    },
    VTooltip: {
      location: 'top'
    }
  },

  // Component specific styles
  components: {
    VAppBar: {
      elevation: 0,
      style: {
        borderBottom: '1px solid rgba(var(--v-border-color), 0.12)'
      }
    },
    VNavigationDrawer: {
      elevation: 0,
      style: {
        borderRight: '1px solid rgba(var(--v-border-color), 0.12)'
      }
    },
    VFooter: {
      elevation: 0,
      style: {
        borderTop: '1px solid rgba(var(--v-border-color), 0.12)'
      }
    }
  }
}

/**
 * Icon configuration
 */
export const icons = {
  defaultSet: 'mdi',
  aliases: {
    // Custom icon aliases
    'device': 'mdi-hvac',
    'settings': 'mdi-cog',
    'optimization': 'mdi-trending-up',
    'schedule': 'mdi-calendar',
    'profile': 'mdi-account',
    'documentation': 'mdi-book-open-page-variant',
    'support': 'mdi-help-circle',
    'logout': 'mdi-logout',
    'error': 'mdi-alert-circle',
    'warning': 'mdi-alert',
    'success': 'mdi-check-circle',
    'info': 'mdi-information',
    'edit': 'mdi-pencil',
    'delete': 'mdi-delete',
    'add': 'mdi-plus',
    'refresh': 'mdi-refresh',
    'search': 'mdi-magnify',
    'filter': 'mdi-filter',
    'sort': 'mdi-sort',
    'menu': 'mdi-menu',
    'close': 'mdi-close',
    'back': 'mdi-arrow-left',
    'forward': 'mdi-arrow-right'
  }
}