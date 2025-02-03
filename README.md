# Daikin Altherma 3 Settings Optimizer

A modern web application for optimizing and managing Daikin Altherma 3 Heat Pump settings. This tool helps users maximize efficiency and comfort while ensuring all settings remain within safe and compatible ranges.

## Features

### Current Features

#### Upload/Input Section
- Drag-and-drop zone for MMI export files
- Text area for direct matrix data pasting
- File format validation and error handling

#### Interactive Settings Matrix
- Visual grid representation (0-F × 00-0E)
- Color-coded cells indicating setting categories
- Hover tooltips showing setting descriptions
- Click-to-edit functionality with validation

#### Heat Pump Information Panel
- Model details display
- System specifications
- Zone configuration
- Performance metrics

#### Settings Optimization Features
- Setting-by-setting explanation panel
- Real-time impact analysis
- Energy efficiency recommendations
- Visual indicators for optimal ranges
- Interactive adjustment sliders/inputs
- Before/after comparison tools

#### Documentation Integration
- Searchable documentation viewer
- Context-sensitive help
- Quick reference guides
- Setting interdependency visualization

### Planned Features

- Real-time heat pump communication
- Historical performance analysis
- Schedule optimization
- Energy cost calculator
- User preferences system
- Mobile responsiveness
- Localization support
- Profile management
- Advanced reporting features

## Tech Stack

- **Frontend:**
  - Vue 3 with Composition API
  - Vuetify 3 for UI components
  - Pinia for state management
  - Vue Router for navigation
  - ECharts for data visualization

- **Development Tools:**
  - Vite for build tooling
  - ESLint for code linting
  - Prettier for code formatting
  - Jest for unit testing

## Project Structure

```
src/
├── components/           # Vue components
│   ├── upload/          # File upload components
│   ├── matrix/          # Settings matrix components
│   ├── info/            # System information components
│   ├── optimization/    # Optimization components
│   └── docs/            # Documentation components
├── store/               # Pinia stores
├── utils/               # Utility functions
├── services/            # API services
└── assets/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v7+)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/makafeli/daikin-optimizer.git
cd daikin-optimizer
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Development Status

### Completed
- Basic project structure
- Core components framework
- Settings validation system
- Optimization algorithms
- Documentation viewer

### In Progress
- API integration
- Testing implementation
- Mobile responsiveness
- User preferences system

### Planned
- Backend development
- Real-time updates
- Advanced optimization features
- Deployment pipeline

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Daikin documentation and technical specifications
- Vue.js team for the excellent framework
- All contributors and users of the application