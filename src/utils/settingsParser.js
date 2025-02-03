// Utility to parse and structure Daikin Altherma 3 settings
const parseSettingsDatabase = (settingsData) => {
  const categories = {
    ROOM: 'Room',
    MAIN_ZONE: 'Main Zone',
    ADDITIONAL_ZONE: 'Additional Zone',
    SPACE_HEATING_COOLING: 'Space Heating/Cooling',
    TANK: 'Tank',
    USER_SETTINGS: 'User Settings',
    INSTALLER_SETTINGS: 'Installer Settings'
  };

  const settingTypes = {
    TEMPERATURE: 'temperature',
    MODE: 'mode',
    CONFIGURATION: 'configuration',
    TIME: 'time',
    POWER: 'power',
    BOOLEAN: 'boolean'
  };

  const parseRange = (rangeStr) => {
    if (!rangeStr) return null;
    
    // Handle different range formats
    const matches = {
      numeric: /(-?\d+)~(-?\d+)°?C,?\s*step:\s*(\d+\.?\d*)°?C/,
      enumerated: /(\d+):\s*([^|]+)(?:\|(\d+):\s*([^|]+))*/g,
      boolean: /0:\s*([^|]+)\|1:\s*([^|]+)/
    };

    if (matches.numeric.test(rangeStr)) {
      const [_, min, max, step] = rangeStr.match(matches.numeric);
      return {
        type: 'numeric',
        min: parseFloat(min),
        max: parseFloat(max),
        step: parseFloat(step)
      };
    }

    if (matches.boolean.test(rangeStr)) {
      const [_, falseVal, trueVal] = rangeStr.match(matches.boolean);
      return {
        type: 'boolean',
        options: {
          false: falseVal.trim(),
          true: trueVal.trim()
        }
      };
    }

    // Handle enumerated values
    const options = {};
    let match;
    while ((match = matches.enumerated.exec(rangeStr)) !== null) {
      options[match[1]] = match[2].trim();
    }
    
    return Object.keys(options).length > 0 ? {
      type: 'enum',
      options
    } : null;
  };

  const guessSettingType = (setting) => {
    if (setting.name.toLowerCase().includes('temp')) return settingTypes.TEMPERATURE;
    if (setting.range?.type === 'boolean') return settingTypes.BOOLEAN;
    if (setting.range?.type === 'enum') return settingTypes.MODE;
    if (setting.name.toLowerCase().includes('time')) return settingTypes.TIME;
    if (setting.name.toLowerCase().includes('capacity') || setting.name.toLowerCase().includes('power')) return settingTypes.POWER;
    return settingTypes.CONFIGURATION;
  };

  // Transform raw settings data into structured format
  const settings = {};
  let currentCategory = '';

  settingsData.split('\n').forEach(line => {
    // Parse category headers
    if (Object.values(categories).some(cat => line.includes(cat))) {
      currentCategory = line.trim();
      return;
    }

    // Parse setting lines
    const settingMatch = line.match(/\[([^\]]+)\]\s+(.*?)\s*\|\s*([R|W|R\/W|R\/O]*)\s*\|\s*(.*)/);
    if (settingMatch) {
      const [_, code, name, access, rangeStr] = settingMatch;
      const range = parseRange(rangeStr);
      
      settings[code] = {
        code,
        name: name.trim(),
        category: currentCategory,
        access,
        range,
        type: guessSettingType({ name, range })
      };
    }
  });

  return {
    categories,
    settingTypes,
    settings
  };
};

export default parseSettingsDatabase;