const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to patch ExpoReactNativeFactory.swift
 * This fixes the RCTReleaseLevel error for React Native < 0.80
 * 
 * Strategy: Completely remove the problematic init block since the parent class
 * RCTReactNativeFactory already has a proper init(delegate:) method
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
      if (content.includes('// PATCHED: Removed RCTReleaseLevel block')) {
        console.log('[patch-expo-factory] Already patched');
        return config;
      }

      // Check if needs patching
      if (!content.includes('RCTReleaseLevel')) {
        console.log('[patch-expo-factory] No RCTReleaseLevel found');
        return config;
      }

      // Simply remove the entire problematic block including #if/#endif
      // The parent class RCTReactNativeFactory already has a suitable init
      const oldBlockRegex = /\s*\/\/ TODO: Remove check when react-native-macos 0\.81 is released\s*\n\s*#if !os\(macOS\)[\s\S]*?#endif\s*\n/;

      if (oldBlockRegex.test(content)) {
        content = content.replace(oldBlockRegex, '\n  // PATCHED: Removed RCTReleaseLevel block for RN 0.79 compatibility\n\n');
        fs.writeFileSync(filePath, content);
        console.log('[patch-expo-factory] ✅ Patched successfully - removed RCTReleaseLevel block');
      } else {
        console.log('[patch-expo-factory] ⚠️ Could not find block to patch, trying alternative approach');
        
        // Alternative: try to find and remove just the RCTReleaseLevel lines
        const lines = content.split('\n');
        const filteredLines = [];
        let skipUntilEndif = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes('TODO: Remove check when react-native-macos 0.81')) {
            skipUntilEndif = true;
            filteredLines.push('  // PATCHED: Removed RCTReleaseLevel block for RN 0.79 compatibility');
            continue;
          }
          
          if (skipUntilEndif) {
            if (line.trim() === '#endif') {
              skipUntilEndif = false;
            }
            continue;
          }
          
          filteredLines.push(line);
        }
        
        content = filteredLines.join('\n');
        fs.writeFileSync(filePath, content);
        console.log('[patch-expo-factory] ✅ Patched successfully (alternative method)');
      }

      return config;
    },
  ]);
}

module.exports = withPatchExpoFactory;
