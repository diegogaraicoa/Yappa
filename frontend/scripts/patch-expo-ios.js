#!/usr/bin/env node
/**
 * Patch for ExpoReactNativeFactory.swift to fix RCTReleaseLevel error
 * This is needed because RCTReleaseLevel was introduced in React Native 0.80
 * but we're using 0.79.x
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'ios',
  'AppDelegates',
  'ExpoReactNativeFactory.swift'
);

if (!fs.existsSync(filePath)) {
  console.log('ExpoReactNativeFactory.swift not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

// Check if already patched
if (content.includes('// PATCHED FOR RN 0.79')) {
  console.log('ExpoReactNativeFactory.swift already patched');
  process.exit(0);
}

// Check if needs patching
if (!content.includes('RCTReleaseLevel')) {
  console.log('No RCTReleaseLevel found, file may already be compatible');
  process.exit(0);
}

// Replace the problematic init block
const oldBlock = `  // TODO: Remove check when react-native-macos 0.81 is released
  #if !os(macOS)
  @objc public override init(delegate: any RCTReactNativeFactoryDelegate) {
    let releaseLevel = (Bundle.main.object(forInfoDictionaryKey: "ReactNativeReleaseLevel") as? String)
      .flatMap { [
        "canary": RCTReleaseLevel.Canary,
        "experimental": RCTReleaseLevel.Experimental,
        "stable": RCTReleaseLevel.Stable
      ][$0.lowercased()]
      }
    ?? RCTReleaseLevel.Stable

    super.init(delegate: delegate, releaseLevel: releaseLevel)
  }
  #endif`;

const newBlock = `  // PATCHED FOR RN 0.79 - RCTReleaseLevel not available in RN < 0.80
  #if !os(macOS)
  @objc public convenience init(delegate: any RCTReactNativeFactoryDelegate) {
    self.init(delegate: delegate, bundleURLBlock: nil)
  }
  #endif`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content);
  console.log('✅ ExpoReactNativeFactory.swift patched successfully');
} else {
  // Try line-by-line replacement as fallback
  const lines = content.split('\n');
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('TODO: Remove check when react-native-macos 0.81')) {
      startIndex = i;
    }
    if (startIndex !== -1 && lines[i].trim() === '#endif' && i > startIndex) {
      endIndex = i;
      break;
    }
  }
  
  if (startIndex !== -1 && endIndex !== -1) {
    const newLines = [
      '  // PATCHED FOR RN 0.79 - RCTReleaseLevel not available in RN < 0.80',
      '  #if !os(macOS)',
      '  @objc public convenience init(delegate: any RCTReactNativeFactoryDelegate) {',
      '    self.init(delegate: delegate, bundleURLBlock: nil)',
      '  }',
      '  #endif'
    ];
    
    lines.splice(startIndex, endIndex - startIndex + 1, ...newLines);
    content = lines.join('\n');
    fs.writeFileSync(filePath, content);
    console.log('✅ ExpoReactNativeFactory.swift patched successfully (fallback method)');
  } else {
    console.log('❌ Could not find the exact block to patch. Manual intervention may be needed.');
    console.log('Start index:', startIndex, 'End index:', endIndex);
    process.exit(1);
  }
}
