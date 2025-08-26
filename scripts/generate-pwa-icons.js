#!/usr/bin/env node

/**
 * PWA Icon Generator for DENSE App
 * 
 * This script generates all required PWA icons from your existing icon.png
 * 
 * Prerequisites:
 * 1. Install sharp: npm install sharp
 * 2. Ensure you have assets/images/icon.png (512x512 or larger)
 * 
 * Usage: node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Paths
const sourceIcon = path.join(__dirname, '../assets/images/icon.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // Create public directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if source icon exists
    if (!fs.existsSync(sourceIcon)) {
      console.error('❌ Source icon not found at:', sourceIcon);
      console.log('📝 Please ensure you have assets/images/icon.png');
      return;
    }

    console.log('🚀 Generating PWA icons...');
    console.log('📁 Source:', sourceIcon);
    console.log('📁 Output:', outputDir);
    console.log('');

    // Generate each icon size
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(sourceIcon)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    // Copy favicon
    const faviconSource = path.join(__dirname, '../assets/images/favicon.png');
    const faviconOutput = path.join(outputDir, 'favicon.png');
    
    if (fs.existsSync(faviconSource)) {
      fs.copyFileSync(faviconSource, faviconOutput);
      console.log('✅ Copied favicon.png');
    }

    // Generate maskable icons (with padding for safety area)
    console.log('\n🎭 Generating maskable icons...');
    
    for (const { size, name } of iconSizes) {
      const maskableName = name.replace('.png', '-maskable.png');
      const outputPath = path.join(outputDir, maskableName);
      
      // Add 20% padding for maskable icon safety area
      const paddedSize = Math.round(size * 0.8);
      const padding = Math.round((size - paddedSize) / 2);
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 255, b: 136, alpha: 1 } // DENSE theme color
        }
      })
      .composite([{
        input: await sharp(sourceIcon)
          .resize(paddedSize, paddedSize, {
            kernel: sharp.kernel.lanczos3,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer(),
        top: padding,
        left: padding
      }])
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);
      
      console.log(`✅ Generated ${maskableName} (maskable)`);
    }

    console.log('\n🎉 PWA icons generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy all generated icons to your public/ folder');
    console.log('2. Update your web server to serve these static files');
    console.log('3. Test the manifest at: https://manifest-validator.appspot.com/');
    console.log('');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

// Run the generator
generateIcons();
