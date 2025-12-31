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

// Find and replace the problematic init method
const oldInit = `  public convenience init(delegate: any RCTReactNativeFactoryDelegate) {
    let releaseLevel = (Bundle.main.object(forInfoDictionaryKey: "ReactNativeReleaseLevel") as? String)
      .flatMap { [
        "canary": RCTReleaseLevel.Canary,
        "experimental": RCTReleaseLevel.Experimental,
        "stable": RCTReleaseLevel.Stable
      ][$0.lowercased()]
      }
    ?? RCTReleaseLevel.Stable

    super.init(delegate: delegate, releaseLevel: releaseLevel)
  }`;

const newInit = `  // PATCHED FOR RN 0.79 - RCTReleaseLevel not available
  public convenience init(delegate: any RCTReactNativeFactoryDelegate) {
    self.init(delegate: delegate, bundleURLBlock: nil)
  }`;

if (content.includes('RCTReleaseLevel')) {
  content = content.replace(oldInit, newInit);
  
  // Also try alternative patterns if the exact match fails
  if (content.includes('RCTReleaseLevel')) {
    // More aggressive replacement - remove the entire init block that uses RCTReleaseLevel
    const regex = /public convenience init\(delegate: any RCTReactNativeFactoryDelegate\) \{[\s\S]*?RCTReleaseLevel[\s\S]*?super\.init\(delegate: delegate, releaseLevel: releaseLevel\)\s*\}/;
    content = content.replace(regex, newInit);
  }
  
  fs.writeFileSync(filePath, content);
  console.log('✅ ExpoReactNativeFactory.swift patched successfully');
} else {
  console.log('No RCTReleaseLevel found, file may already be compatible');
}
