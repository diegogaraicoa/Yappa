#!/usr/bin/env node
/**
 * Patch for ExpoReactNativeFactory.swift to fix RCTReleaseLevel error
 * This is needed because RCTReleaseLevel was introduced in React Native 0.80
 * but we're using 0.79.x
 * 
 * Strategy: Completely remove the problematic init block
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
if (content.includes('// PATCHED: Removed RCTReleaseLevel block')) {
  console.log('ExpoReactNativeFactory.swift already patched');
  process.exit(0);
}

// Check if needs patching
if (!content.includes('RCTReleaseLevel')) {
  console.log('No RCTReleaseLevel found, file may already be compatible');
  process.exit(0);
}

// Remove the entire problematic block
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
console.log('✅ ExpoReactNativeFactory.swift patched successfully');
