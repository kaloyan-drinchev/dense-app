# 🚀 PWA Setup Instructions for DENSE App

## 📋 Day 1 Progress Checklist

### ✅ Completed
- [x] Web app manifest created (`public/manifest.json`)
- [x] Expo configuration updated (`app.json`)
- [x] HTML template with PWA tags (`web/index.html`)

### 🔄 Next Steps

## Step 1: Generate PWA Icons (Choose Method A or B)

### Method A: Automated with Node.js (Recommended)

1. **Install Sharp (image processing library):**
   ```bash
   npm install sharp
   ```

2. **Run the icon generator:**
   ```bash
   node scripts/generate-pwa-icons.js
   ```

3. **Verify icons are created in `public/` folder**

### Method B: Manual (if you prefer)

Using any image editor (Photoshop, GIMP, Canva, etc.):

1. **Start with `assets/images/icon.png`**
2. **Generate these sizes and save to `public/` folder:**
   - `icon-72x72.png` (72x72)
   - `icon-96x96.png` (96x96)
   - `icon-128x128.png` (128x128)
   - `icon-144x144.png` (144x144)
   - `icon-152x152.png` (152x152)
   - `icon-192x192.png` (192x192)
   - `icon-384x384.png` (384x384)
   - `icon-512x512.png` (512x512)

3. **Copy `assets/images/favicon.png` to `public/favicon.png`**

### Method C: Online PWA Icon Generator

1. **Visit:** https://www.pwabuilder.com/imageGenerator
2. **Upload:** `assets/images/icon.png`
3. **Download:** Generated icon pack
4. **Copy:** All icons to `public/` folder

## Step 2: Test Installability

### 🔧 Build and Serve
```bash
# Build the web version
expo export -p web

# Serve locally (use any static server)
npx serve dist

# Or if you have Python
python -m http.server 3000 -d dist
```

### 📱 Test on Mobile
1. **Open in Chrome/Safari:** `http://your-local-ip:3000`
2. **Look for install prompt** or "Add to Home Screen" option
3. **Install the app**
4. **Launch from home screen** - should open without browser UI

### 💻 Test on Desktop
1. **Open in Chrome:** `http://localhost:3000`
2. **Check address bar** for install icon ⊕
3. **Click install** and test app

## 🔍 Troubleshooting

### ❌ Install prompt not showing?
- **Manifest issues:** Check browser dev tools → Application → Manifest
- **HTTPS required:** Use ngrok for testing: `npx ngrok http 3000`
- **Icon missing:** Verify all icon files exist in `public/`

### ❌ Icons not loading?
- **Path issues:** Ensure icons are in `public/` folder
- **Size issues:** Icons must be exact sizes specified
- **Format issues:** Use PNG format only

## 📊 Testing Tools

### Manifest Validator
- **URL:** https://manifest-validator.appspot.com/
- **Test:** Paste your manifest.json content

### Lighthouse PWA Audit
1. **Open DevTools** → Lighthouse
2. **Select PWA**
3. **Run audit**
4. **Fix any issues**

## 🎯 Day 1 Success Criteria

- [ ] App installs on mobile device
- [ ] App installs on desktop
- [ ] Manifest passes validation
- [ ] Icons display correctly
- [ ] App opens without browser UI
- [ ] Lighthouse PWA score > 80

---

## 📅 Day 2 Preview: Service Worker

Tomorrow we'll add:
- **Offline functionality**
- **Asset caching**
- **Background sync**

## 🆘 Need Help?

If you encounter issues:
1. **Check browser console** for errors
2. **Verify all files** are in correct locations
3. **Test with fresh browser** (incognito mode)
4. **Use HTTPS** for full PWA features

---

**🎉 Once Day 1 is complete, you'll have an installable PWA!**
