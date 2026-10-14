const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow importing 3D model assets (.glb/.gltf) through the Metro bundler.
config.resolver.assetExts.push('glb', 'gltf');

module.exports = withNativeWind(config, { input: './src/global.css' });
