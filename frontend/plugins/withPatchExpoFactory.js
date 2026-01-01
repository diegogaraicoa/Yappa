const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to patch ExpoReactNativeFactory.swift
 * This fixes the RCTReleaseLevel error for React Native < 0.80
 */
function withPatchExpoFactory(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'expo',
        'ios',
        'AppDelegates',
        'ExpoReactNativeFactory.swift'
      );

      if (!fs.existsSync(filePath)) {
        console.log('[patch-expo-factory] File not found, skipping patch');
        return config;
      }

      let content = fs.readFileSync(filePath, 'utf8');

      // Check if already patched
      if (content.includes('// PATCHED FOR RN 0.79')) {
        console.log('[patch-expo-factory] Already patched');
        return config;
      }

      // Check if needs patching
      if (!content.includes('RCTReleaseLevel')) {
        console.log('[patch-expo-factory] No RCTReleaseLevel found');
        return config;
      }

      // Replace the problematic init block
      const oldBlockRegex = /\/\/ TODO: Remove check when react-native-macos 0\.81 is released\s*\n\s*#if !os\(macOS\)\s*\n\s*@objc public override init\(delegate: any RCTReactNativeFactoryDelegate\) \{[\s\S]*?super\.init\(delegate: delegate, releaseLevel: releaseLevel\)\s*\n\s*\}\s*\n\s*#endif/;

      const newBlock = `// PATCHED FOR RN 0.79 - RCTReleaseLevel not available in RN < 0.80
  #if !os(macOS)
  @objc public convenience init(delegate: any RCTReactNativeFactoryDelegate) {
    self.init(delegate: delegate, bundleURLBlock: nil)
  }
  #endif`;

      if (oldBlockRegex.test(content)) {
        content = content.replace(oldBlockRegex, newBlock);
        fs.writeFileSync(filePath, content);
        console.log('[patch-expo-factory] ✅ Patched successfully');
      } else {
        console.log('[patch-expo-factory] ⚠️ Could not find block to patch');
      }

      return config;
    },
  ]);
}

module.exports = withPatchExpoFactory;
