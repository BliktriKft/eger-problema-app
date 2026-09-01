module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated MUST be last per expo-router docs.
      'react-native-reanimated/plugin',
    ],
  };
};
