# User Guide - WC-Checks

**Version:** 3.0.0
**Last Updated:** 2025-12-01

Welcome to WC-Checks! This guide will help you use the app effectively for toilet inspections and management.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Daily Inspection Workflow](#daily-inspection-workflow)
- [Viewing Reports](#viewing-reports)
- [Mobile App Features](#mobile-app-features)
- [Admin Features](#admin-features)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## 🚀 Getting Started

### 1. **Accessing the App**

**Web Browser** (Desktop/Laptop):
- Visit: `https://your-company.wc-checks.app`
- Login with your email and password

**Mobile Device** (Recommended):
- Visit the website on your phone
- Tap the "Install App" prompt
- Or tap "Add to Home Screen" from browser menu

### 2. **First Login**

```
1. Open the app
2. Enter your email address
3. Enter your password
4. Tap "Login"

✅ You're in! Welcome to your Dashboard.
```

### 3. **Understanding Your Role**

Your account has one of three roles:

| Role | What You Can Do |
|------|----------------|
| **Inspector** | Scan QR codes, submit inspections, view your history |
| **Admin** | Everything Inspector can do + manage locations, view all reports |
| **Super Admin** | Everything + manage users, assign roles, access all settings |

💡 **How to check your role:**
- Open the sidebar (tap ☰ menu icon)
- Your role is shown under your name

---

## 📱 Daily Inspection Workflow

### Step 1: Find the Location

**Option A: Scan QR Code** (Fastest)
```
1. Tap "Scan QR" button (camera icon)
2. Allow camera access
3. Point camera at location's QR code
4. Auto-redirects to inspection form
```

**Option B: Manual Select**
```
1. Tap "Locations" in the menu
2. Browse or search for location
3. Tap location card
4. Tap "Start Inspection"
```

---

### Step 2: Fill Inspection Form

#### **Cleanliness Rating** (Required)
```
⭐⭐⭐⭐⭐  Excellent - Spotless, fresh smell
⭐⭐⭐⭐    Good - Clean, minor issues
⭐⭐⭐      Average - Needs attention
⭐⭐        Poor - Dirty, urgent cleaning needed
⭐          Very Poor - Unsanitary conditions
```

💡 **Tip:** Be honest! This data helps improve maintenance.

---

#### **Supplies Check** (Required)
Check all available supplies:
```
✅ Toilet Paper
✅ Hand Soap
✅ Paper Towels
✅ Trash Can
```

💡 **Tip:** If something is low but not empty, still check it. Add notes if refill needed soon.

---

#### **Maintenance Issues** (Optional)
Select any problems:
```
🚽 Toilet - Clogged, broken flush, leaking
🚰 Sink - Clogged, leaking, broken faucet
🚪 Door - Lock broken, hinge loose
💡 Lighting - Bulb out, flickering
🧻 Dispenser - Broken, empty, jammed
🧼 Other - Smell, graffiti, etc.
```

---

#### **Photos** (Optional but Recommended)
```
1. Tap "Add Photos"
2. Take photo OR choose from gallery
3. Upload up to 5 photos
4. Photos auto-compress to save space
```

📸 **Photo Tips:**
- Capture maintenance issues clearly
- Good lighting helps
- Take multiple angles if needed
- Photos are stored securely in the cloud

---

#### **Notes** (Optional)
```
Add any additional details:
- "Soap dispenser empty, refilled from storage"
- "Floor wet, caution sign placed"
- "Strong odor, ventilation fan not working"
```

---

### Step 3: Submit Inspection

```
1. Review your form
2. Tap "Submit Inspection"
3. Wait for confirmation ✅
4. Done! Inspection saved.
```

💡 **What happens next:**
- Your inspection is saved to the database
- Admin/Manager can view it immediately
- You can see it in your Reports page

---

## 📊 Viewing Reports

### Your Inspection History

```
1. Tap "Reports" in the menu
2. See calendar view (monthly)
3. Dates with inspections are highlighted
4. Tap a date to see inspections
```

### Calendar Colors:
```
🟢 Green Day  - All inspections excellent/good
🟡 Yellow Day - Some inspections average
🔴 Red Day    - Inspections with poor ratings
⚪ Gray Day   - No inspections
```

---

### Viewing Inspection Details

```
1. Tap a date on calendar
2. See list of inspections for that day
3. Tap an inspection card
4. View full details:
   - Cleanliness rating
   - Supplies checked
   - Maintenance issues
   - Photos (tap to view full size)
   - Notes
   - Timestamp
   - Inspector name
```

---

### Filtering Reports

**Admin/Manager Only:**

```
1. Open Reports page
2. Use filter buttons:
   - "All Users" - See everyone's inspections
   - "My Inspections" - See only yours
   - "Select Building" - Filter by building
3. Calendar updates automatically
```

---

## 📱 Mobile App Features

### Installing as App

**iPhone/iPad (Safari):**
```
1. Open website in Safari
2. Tap Share button (⬆️)
3. Scroll down, tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen
```

**Android (Chrome):**
```
1. Open website in Chrome
2. Tap menu (⋮)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen
```

---

### Offline Mode

**What works offline:**
- ✅ View previously loaded inspections
- ✅ See cached location list
- ✅ Access help pages

**What needs internet:**
- ❌ Submitting new inspections
- ❌ Scanning QR codes
- ❌ Uploading photos
- ❌ Viewing real-time reports

💡 **Tip:** Fill out inspection offline, submit when back online!

---

## 🛠️ Admin Features

### Managing Locations

**View All Locations:**
```
1. Sidebar → Admin → Locations
2. See table of all locations
3. Sort by organization, building, floor
```

**Add New Location:**
```
1. Tap "+ Add Location"
2. Fill in details:
   - Name (e.g., "Floor 1 - Men's Restroom")
   - Organization (dropdown)
   - Building (dropdown)
   - Floor (text)
   - Short Code (e.g., "1M")
3. Tap "Generate QR Code"
4. Tap "Save Location"
```

**Edit Location:**
```
1. Find location in table
2. Tap "Edit" button
3. Update details
4. Tap "Save Changes"
```

**Delete Location:**
```
1. Find location in table
2. Tap "Delete" button
3. Confirm deletion
⚠️ WARNING: This cannot be undone!
```

---

### Managing Organizations

**Add Organization:**
```
1. Sidebar → Admin → Organizations
2. Tap "+ Add Organization"
3. Fill in:
   - Name (e.g., "Company HQ")
   - Short Code (e.g., "HQ")
   - Address (optional)
   - Contact email (optional)
4. Tap "Save"
```

**Edit/Delete:**
- Same process as locations

---

### Managing Buildings

**Add Building:**
```
1. Sidebar → Admin → Buildings
2. Tap "+ Add Building"
3. Fill in:
   - Name (e.g., "Building A")
   - Organization (select from dropdown)
   - Short Code (e.g., "BLD-A")
   - Address
   - Total floors
   - Type (office, warehouse, etc.)
4. Tap "Save"
```

---

### Generating QR Codes

**Single QR Code:**
```
1. Go to location details
2. Tap "Download QR Code"
3. Save PNG file
4. Print and post at location
```

**Bulk QR Codes:**
```
1. Sidebar → Admin → QR Generator
2. Select organization/building
3. Tap "Generate All"
4. Download ZIP file with all QR codes
5. Print in batch
```

💡 **Printing Tips:**
- Print at 300 DPI for clarity
- Use waterproof labels for humid areas
- Place QR codes at eye level
- Laminate for durability

---

### Viewing All Inspections (Admin)

**Dashboard:**
```
1. Sidebar → Admin → Dashboard
2. See stats:
   - Total inspections (today/week/month)
   - Average cleanliness score
   - Active users
   - Locations with issues
```

**Reports Page (Admin View):**
```
1. Reports → Filter → "All Users"
2. See all inspections from all users
3. Filter by:
   - User (dropdown)
   - Building (dropdown)
   - Date range
```

---

## 🔒 Super Admin Features

### User Management

**View All Users:**
```
1. Sidebar → Super Admin → User Management
2. See table of all users:
   - Name
   - Email
   - Role
   - Status (active/inactive)
   - Last login
```

**Assign Role:**
```
1. Find user in table
2. Click "Assign Role" button
3. Select role from dropdown:
   - User (Inspector)
   - Admin
   - Super Admin
4. Confirm assignment
```

⚠️ **WARNING:** Cannot change your own role (safety feature)

**Activate/Deactivate User:**
```
1. Find user in table
2. Toggle "Active" switch
3. Inactive users cannot login
```

💡 **Use Cases:**
- Deactivate: Employee left company
- Reactivate: Employee returned from leave

---

### Viewing Audit Logs

**Access Audit Logs:**
```
1. Sidebar → Super Admin → Audit Logs
2. See all admin actions:
   - Who did what
   - When it happened
   - Success or failure
   - Details (if any)
```

**Filter Audit Logs:**
```
- By user
- By action type (assign role, toggle status, etc.)
- By success/failure
- By date range
```

💡 **Why Audit Logs?**
- Compliance (who changed what)
- Security (detect unauthorized actions)
- Debugging (what went wrong when)

---

## 🐛 Troubleshooting

### "Cannot Login"

**Check:**
```
✓ Email address spelled correctly
✓ Password caps lock not on
✓ Internet connection active
✓ Account is active (ask admin)
```

**Still can't login?**
- Contact your admin/manager
- They can check if your account is active

---

### "QR Code Won't Scan"

**Try:**
```
1. Clean camera lens
2. Ensure good lighting
3. Hold phone steady
4. Get closer/farther from QR code
5. Try manual location select instead
```

**If QR code is damaged:**
- Report to admin
- Use manual location select
- Admin can print new QR code

---

### "Photo Upload Failed"

**Reasons:**
```
❌ Internet connection lost
❌ Photo too large (> 10MB original)
❌ Server busy (try again in 1 minute)
```

**Solutions:**
1. Check internet connection
2. Try a smaller/compressed photo
3. Wait and retry
4. Skip photo and add notes instead

---

### "Inspection Won't Submit"

**Check:**
```
✓ All required fields filled (cleanliness, supplies)
✓ Internet connection active
✓ No red error messages on form
```

**If stuck:**
1. Take screenshot of form
2. Refresh page
3. Fill form again (use screenshot)
4. Contact support if persists

---

### "Don't See Admin Menu"

**Possible Reasons:**
```
❌ Your role is "Inspector" (not Admin)
❌ Page hasn't refreshed since role change
❌ Browser cache issue
```

**Solutions:**
1. Check your role in profile
2. Refresh page (Ctrl+R or Cmd+R)
3. Clear browser cache
4. Ask admin to verify your role

---

## ❓ FAQ

### Q: How often should I inspect?

**A:** Depends on your facility policy. Common schedules:
- High-traffic areas: 2-3 times daily
- Medium-traffic: Once daily
- Low-traffic: 2-3 times weekly

### Q: What if I forget to do an inspection?

**A:** No problem! The app doesn't enforce schedules (yet). Just do it when you remember. Admins can see inspection history and frequency.

### Q: Can I edit an inspection after submitting?

**A:** Not currently. If you made a mistake:
1. Submit a new inspection with correct info
2. Add note explaining the correction
3. Contact admin to delete wrong one (if needed)

### Q: Who can see my inspections?

**A:**
- **You:** See your own inspections
- **Admin:** See all inspections in organization
- **Super Admin:** See everything

### Q: Can I delete my inspection?

**A:**
- **Inspectors:** No (ask admin)
- **Admin:** Yes, can delete any inspection
- **Super Admin:** Yes, can delete anything

### Q: Is my data secure?

**A:** Yes!
- ✅ Encrypted database (Supabase)
- ✅ Secure photo storage (Cloudinary)
- ✅ Role-based access control
- ✅ Audit logs track all changes
- ✅ HTTPS encrypted connection

### Q: Can I use this offline?

**A:** Partially:
- ✅ View cached data
- ❌ Cannot submit new inspections offline
- 📱 Install as PWA for best offline experience

### Q: How do I export inspection data?

**A:** (Admin only)
```
1. Reports page
2. Filter as needed
3. Tap "Export to Excel"
4. Download XLSX file
```

### Q: Can I print QR codes at home?

**A:** Yes! Download QR code PNG and print on any printer. For best results:
- Use sticker paper or laminate
- Print at 100% size (no scaling)
- Use waterproof labels for bathrooms

---

## 📞 Getting Help

### Support Channels:

**General Questions:**
- Email: support@yourcompany.com
- Phone: +1 (555) 123-4567
- Hours: Mon-Fri 9AM-5PM

**Technical Issues:**
- Email: tech@yourcompany.com
- Slack: #wc-checks-support
- Response time: < 24 hours

**Training:**
- New user training: Every Monday 10AM
- Admin training: First Friday of month
- Contact: training@yourcompany.com

---

## 🎓 Video Tutorials

- **Getting Started** (5 min): `https://youtu.be/abc123`
- **Daily Inspection Workflow** (3 min): `https://youtu.be/def456`
- **Admin Features** (10 min): `https://youtu.be/ghi789`
- **QR Code Setup** (8 min): `https://youtu.be/jkl012`

---

## 💡 Pro Tips

### For Inspectors:
1. **Install PWA** - Faster than browser
2. **Use QR codes** - 10x faster than manual select
3. **Add photos** - Worth 1000 words for maintenance team
4. **Be specific in notes** - "Needs soap" vs "Soap dispenser broken, needs replacement"

### For Admins:
1. **Print QR codes in batches** - Save time
2. **Review reports weekly** - Spot trends early
3. **Export data monthly** - Track improvements
4. **Deactivate old users** - Keep user list clean

### For Everyone:
1. **Bookmark the app** - Quick access
2. **Enable notifications** - Get updates (coming soon)
3. **Check reports regularly** - Learn from patterns
4. **Give feedback** - Help us improve!

---

**Happy Inspecting! 🚽✨**

*For questions or feedback, contact your admin or support team.*
