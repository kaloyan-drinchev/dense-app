module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { 
      jsxImportSource: 'nativewind',
      unstable_transformImportMeta: true // Fix for zustand import.meta issue
    }]],
    plugins: [
      ['inline-import', { extensions: ['.sql'] }], // Support for importing .sql files
      'react-native-reanimated/plugin', // MUST be last - Required for Moti animations
    ],
  };
};
