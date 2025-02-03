# Daikin Altherma 3 Settings Optimizer

A modern web application for optimizing and managing Daikin Altherma 3 Heat Pump settings.

## Features

### Upload/Input Section
- Drag-and-drop zone for MMI export files
- Text area for direct matrix data pasting
- File format validation and error handling

### Interactive Settings Matrix
- Visual grid representation (0-F × 00-0E)
- Color-coded cells indicating setting categories
- Hover tooltips showing setting descriptions
- Click-to-edit functionality with validation

### Heat Pump Information Panel
- Model details display
- System specifications
- Zone configuration
- Performance metrics

### Settings Optimization Features
- Setting-by-setting explanation panel
- Real-time impact analysis
- Energy efficiency recommendations
- Visual indicators for optimal ranges
- Interactive adjustment sliders/inputs
- Before/after comparison tools

### Documentation Integration
- Searchable documentation viewer
- Context-sensitive help
- Quick reference guides
- Setting interdependency visualization

## Tech Stack
- Vue 3 with Composition API
- Vuetify 3 for UI components
- Pinia for state management
- Vue Router for navigation
- ECharts for data visualization

## Project Structure
```
src/
├── components/
│   ├── upload/
│   │   └── FileUpload.vue
│   ├── matrix/
│   │   └── SettingsMatrix.vue
│   ├── info/
│   │   └── HeatPumpInfo.vue
│   ├── optimization/
│   │   └── OptimizationPanel.vue
│   └── docs/
│       └── DocumentViewer.vue
├── store/
│   └── settingsStore.js
├── utils/
│   ├── settingsParser.js
│   ├── validation.js
│   └── optimization.js
├── services/
│   └── api.js
└── App.vue
```

## Installation

```bash
npm install
npm run dev
```

## Contributing
Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License
[MIT License](LICENSE)