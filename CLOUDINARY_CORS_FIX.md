# 🔥 CLOUDINARY CORS ERROR FIX

## ❌ Error Yang Terjadi:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading 
the remote resource at https://api.cloudinary.com/v1_1/dcg56qkae/image/upload
```

## 🔍 Root Cause:
**CLOUDINARY NOT CONFIGURED PROPERLY!**

---

## ✅ SOLUTION - 2 Scenarios:

### **Scenario 1: Local Development**

**Step 1: Create .env file**
```bash
cp .env.example .env
```

**Step 2: Fill in Cloudinary credentials**
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_FOLDER=toilet-inspections
```

**Step 3: Get credentials from Cloudinary Dashboard**
1. Login: https://cloudinary.com/console
2. Copy **Cloud Name** (top left)
3. Go to: Settings → Upload → Upload presets
4. Create **unsigned upload preset**:
   - Preset name: `wc-check-upload` (or any name)
   - Signing mode: **Unsigned**
   - Folder: `toilet-inspections`
   - Save

**Step 4: Restart dev server**
```bash
npm run dev
# or
pnpm dev
```

---

### **Scenario 2: Production (Vercel)**

**Step 1: Go to Vercel Dashboard**
1. Open project: https://vercel.com/[username]/wc-checks
2. Settings → Environment Variables

**Step 2: Add variables**
```
VITE_CLOUDINARY_CLOUD_NAME = your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET = your_unsigned_preset
VITE_CLOUDINARY_FOLDER = toilet-inspections
```

**Step 3: Redeploy**
- Vercel will auto-redeploy
- Or manual: Deployments → Redeploy

---

## 🎯 How to Create Unsigned Upload Preset (IMPORTANT!)

**Why unsigned?**
- Frontend upload without API secret
- Secure (no credentials exposed)
- Works with CORS

**Steps:**
1. Cloudinary Dashboard → Settings
2. Upload tab → Upload presets
3. Click **"Add upload preset"**
4. Settings:
   ```
   Preset name: wc-check-upload
   Signing mode: UNSIGNED ✅ (IMPORTANT!)
   Folder: toilet-inspections
   Tags: inspection, toilet (optional)
   ```
5. Save
6. Copy preset name to .env

---

## 🔒 Security Check:

**DON'T expose:**
- ❌ API Secret
- ❌ API Key (in frontend code)

**ONLY use:**
- ✅ Cloud Name (public, safe)
- ✅ Upload Preset (unsigned, safe)

---

## 🧪 Test Upload:

**After config:**
1. Restart server
2. Submit inspection dengan foto
3. Check console - should show:
   ```
   📤 Uploading photo...
   ✅ Uploaded in 2.3s
   ```
4. No CORS error! 🎉

---

## 📝 Current Config (from error):

Your cloud name: `dcg56qkae`

**What you need:**
- ✅ Cloud name: dcg56qkae (already correct!)
- ❓ Upload preset: need to create UNSIGNED preset
- ❓ Env vars: need to set in .env or Vercel

---

## 🚨 Common Mistakes:

1. **Using SIGNED preset** → CORS error
   - Fix: Change to UNSIGNED

2. **Missing .env file** → undefined vars
   - Fix: Create .env from .env.example

3. **Wrong preset name** → Upload failed
   - Fix: Double check name matches Cloudinary

4. **Forgot to restart server** → Old config
   - Fix: Restart dev server

---

## 💡 Quick Test Command:

```bash
# Check if env vars loaded
npm run dev

# Should NOT see error:
# "Missing required Cloudinary environment variables"
```

---

## ✅ Success Indicators:

When working correctly:
```
📤 Uploading photo-1.webp (123KB)...
✅ Uploaded photo-1.webp in 1.2s
📤 Uploading photo-2.webp (98KB)...
✅ Uploaded photo-2.webp in 0.9s
📤 Submitting inspection to database...
✅ Inspection submitted successfully!
```

When BROKEN:
```
Cross-Origin Request Blocked...
❌ Upload error: NetworkError
```

---

## 🎉 After Fix:

Upload will work smoothly! Photos uploaded to Cloudinary, URLs saved to database, inspection submitted successfully! 🚀
