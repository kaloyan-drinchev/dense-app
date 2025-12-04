module.exports = function (api) {
  // Safely call cache only if the API and method exist
  if (api && typeof api.cache === 'function') {
    api.cache(true);
  }

  return {
    presets: [
      '@babel/preset-flow', // Fixes the "typeof" error
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      ['inline-import', { extensions: ['.sql'] }],
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};
