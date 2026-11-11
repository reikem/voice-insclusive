const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Añadir .bin a los assetExts para que Metro pueda empaquetar el modelo de Whisper
config.resolver.assetExts.push('bin');

// Mapear los polyfills de Node requeridos por librerías nativas como whisper.rn
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
};

module.exports = config;