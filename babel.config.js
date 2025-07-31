module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      // Updated Reanimated plugin location
      'react-native-worklets/plugin',
    ],
  };
};
