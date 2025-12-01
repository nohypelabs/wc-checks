# Video Tutorial Guide & Scripts

**Last Updated:** 2025-12-01

This guide provides scripts, outlines, and production guidelines for creating tutorial videos for WC-Checks.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tutorial Series Structure](#tutorial-series-structure)
- [Recording Setup](#recording-setup)
- [Video Scripts](#video-scripts)
- [Production Guidelines](#production-guidelines)
- [Publishing Checklist](#publishing-checklist)

---

## 🎥 Overview

### Target Audience

**Primary Viewers:**
- New inspectors (first-time users)
- Admin staff (location/org management)
- IT staff (deployment & setup)
- Developers (contributing to project)

**Video Goals:**
- ✅ Reduce onboarding time from 2 hours to 30 minutes
- ✅ Decrease support tickets by 60%
- ✅ Improve user adoption rate
- ✅ Build confidence in using the system

---

## 📚 Tutorial Series Structure

### Series 1: End-User Tutorials (For Inspectors)

| # | Title | Duration | Target |
|---|-------|----------|--------|
| 1 | Getting Started with WC-Checks | 5 min | First-time inspectors |
| 2 | Scanning QR Codes for Quick Inspections | 3 min | Daily users |
| 3 | Filling Out Inspection Forms | 7 min | All inspectors |
| 4 | Uploading Photos & Documentation | 4 min | All inspectors |
| 5 | Viewing Reports & History | 6 min | Inspectors & supervisors |

**Total Series Duration:** ~25 minutes

---

### Series 2: Admin Tutorials (For Managers)

| # | Title | Duration | Target |
|---|-------|----------|--------|
| 1 | Admin Dashboard Overview | 8 min | New admins |
| 2 | Managing Organizations & Buildings | 10 min | Admin staff |
| 3 | Creating & Managing Locations | 8 min | Admin staff |
| 4 | User Management & Role Assignment | 7 min | Super admins |
| 5 | Generating QR Codes for Locations | 5 min | Admin staff |
| 6 | Analytics & Compliance Reports | 9 min | Management |

**Total Series Duration:** ~47 minutes

---

### Series 3: Technical Tutorials (For IT/Developers)

| # | Title | Duration | Target |
|---|-------|----------|--------|
| 1 | Local Development Setup | 12 min | Developers |
| 2 | Deploying to Vercel | 10 min | DevOps |
| 3 | Supabase Database Configuration | 15 min | Backend devs |
| 4 | Cloudinary Image Setup | 8 min | Developers |
| 5 | Environment Variables & Secrets | 6 min | DevOps |
| 6 | Monitoring & Error Tracking | 10 min | DevOps |

**Total Series Duration:** ~61 minutes

---

## 🎬 Recording Setup

### Required Equipment

**Minimum Setup:**
- 💻 Computer with good performance
- 🎤 USB microphone (e.g., Blue Yeti, Samson Q2U) - $50-100
- 🎧 Headphones (for monitoring audio)
- 🖱️ Mouse with smooth tracking

**Optional (Improved Quality):**
- 📹 Webcam for talking head intro/outro (Logitech C920)
- 💡 Ring light for better video quality
- 🎨 Green screen for professional background

---

### Recommended Software

**Screen Recording:**
- **macOS:** QuickTime Player (free), ScreenFlow ($129), Camtasia ($299)
- **Windows:** OBS Studio (free), Camtasia ($299), Screencast-O-Matic ($29/year)
- **Linux:** OBS Studio (free), SimpleScreenRecorder (free)

**Video Editing:**
- **Beginner:** iMovie (macOS, free), DaVinci Resolve (free)
- **Advanced:** Adobe Premiere Pro ($20/month), Final Cut Pro ($299)
- **Web-based:** Kapwing (free tier), Descript ($12/month)

**Audio Enhancement:**
- Audacity (free) - Remove background noise
- Adobe Audition ($20/month) - Professional audio editing

---

### Recording Settings

**Video:**
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30 FPS
- **Bitrate:** 8-12 Mbps
- **Format:** MP4 (H.264)

**Audio:**
- **Sample Rate:** 48 kHz
- **Bitrate:** 128-192 kbps
- **Format:** AAC or MP3

**Screen Recording:**
- **Cursor:** Show cursor, enable click effects
- **Zoom:** Highlight important areas
- **Pacing:** Slow down mouse movements for clarity

---

## 📝 Video Scripts

### Video 1: Getting Started with WC-Checks

**Duration:** 5 minutes
**Target Audience:** First-time inspectors

---

#### Script

**[0:00 - 0:20] Intro**

> "Hi, I'm [Name], and welcome to WC-Checks! In this tutorial, you'll learn how to use our toilet inspection system to ensure clean, well-maintained facilities. By the end of this video, you'll be able to log in, scan QR codes, and submit your first inspection. Let's get started!"

**[0:20 - 1:00] Logging In**

> "First, open your web browser and navigate to [your-domain].com. If you're on mobile, you can also install our app by clicking 'Add to Home Screen' in your browser menu."
>
> [SCREEN: Show login page]
>
> "Enter the email and password provided by your administrator. Click 'Sign In.'"
>
> [SCREEN: Type credentials, click Sign In]
>
> "Great! You're now logged in and can see the main dashboard."

**[1:00 - 2:00] Dashboard Overview**

> "This is your homepage. Let me walk you through the key features:"
>
> [SCREEN: Highlight each section as mentioned]
>
> "At the top, you'll see the navigation menu with four main sections:
> - **Inspections:** Start a new inspection
> - **Reports:** View past inspections
> - **Locations:** Browse all locations
> - **Profile:** Manage your account
>
> In the center, you'll see quick stats showing your inspections today, this week, and this month."

**[2:00 - 3:00] Starting Your First Inspection**

> "To start an inspection, click the 'New Inspection' button. You have two options:"
>
> [SCREEN: Show options]
>
> "1. **Scan QR Code:** Use your camera to scan the QR code posted at the location. This is the fastest method.
>
> 2. **Manual Selection:** Browse and select the location from a list."
>
> "For now, let's use the manual option. Click 'Select Location.'"

**[3:00 - 4:00] Selecting a Location**

> [SCREEN: Show location selector]
>
> "You'll see a hierarchical list of organizations, buildings, and locations. Let's select:
> - Organization: Main Campus
> - Building: Building A
> - Location: 1st Floor - Men's Restroom
>
> Click 'Continue' to proceed to the inspection form."

**[4:00 - 4:40] Next Steps Preview**

> "Perfect! You've successfully navigated to the inspection form. In the next video, we'll cover how to scan QR codes for even faster inspections. And in Video 3, we'll fill out this form completely."
>
> "Thanks for watching! If you have questions, check the Help section in the app or contact your administrator."

**[4:40 - 5:00] Outro**

> [TEXT OVERLAY: "Up Next: Video 2 - Scanning QR Codes"]
>
> "See you in the next tutorial!"

---

### Video 2: Scanning QR Codes for Quick Inspections

**Duration:** 3 minutes
**Target Audience:** Daily inspectors

---

#### Script

**[0:00 - 0:15] Intro**

> "Welcome back! In this tutorial, you'll learn how to use QR codes to start inspections in seconds. This is the fastest way to select locations and saves you time every day."

**[0:15 - 0:45] Finding QR Codes**

> "Every location in WC-Checks has a unique QR code. Your administrator has printed and posted these codes at each restroom entrance."
>
> [SCREEN: Show photo of QR code posted on wall]
>
> "Look for the QR code poster near the entrance. It looks like this."

**[0:45 - 1:30] Using the QR Scanner**

> "To scan a QR code, click 'New Inspection' on your homepage."
>
> [SCREEN: Click New Inspection button]
>
> "Then click 'Scan QR Code.'"
>
> [SCREEN: Click Scan QR Code button]
>
> "Your camera will open. Allow camera access if prompted."
>
> [SCREEN: Show camera permission dialog]
>
> "Point your camera at the QR code. Make sure the code is centered and well-lit."

**[1:30 - 2:00] Successful Scan**

> [SCREEN: Show QR code being scanned]
>
> "When the scan is successful, you'll see a green checkmark and the location name will appear."
>
> [SCREEN: Show success message: "Building A - 1st Floor Men's Restroom"]
>
> "Click 'Continue' to start your inspection."

**[2:00 - 2:30] Troubleshooting**

> "If the scan doesn't work:
> - Make sure the QR code is clean and not damaged
> - Improve lighting (use your phone flashlight)
> - Hold your device steady
> - Try moving closer or farther away
>
> If you still can't scan, use the 'Manual Selection' option instead."

**[2:30 - 3:00] Outro**

> "That's it! You now know how to use QR codes for lightning-fast inspections. In the next video, we'll fill out the inspection form step by step."
>
> [TEXT OVERLAY: "Up Next: Video 3 - Filling Out Inspection Forms"]

---

### Video 3: Filling Out Inspection Forms

**Duration:** 7 minutes
**Target Audience:** All inspectors

---

#### Script

**[0:00 - 0:20] Intro**

> "Welcome to Video 3! Now that you know how to select locations, let's learn how to complete an inspection form. We'll cover ratings, supply checks, maintenance issues, and notes."

**[0:20 - 1:30] Cleanliness Rating**

> "The first section is 'Cleanliness Rating.' This is your overall impression of how clean the restroom is."
>
> [SCREEN: Show rating stars]
>
> "Rate from 1 to 5 stars:
> - ⭐ Very Poor: Major cleanliness issues
> - ⭐⭐ Poor: Several problems
> - ⭐⭐⭐ Average: Acceptable but could improve
> - ⭐⭐⭐⭐ Good: Clean with minor issues
> - ⭐⭐⭐⭐⭐ Excellent: Spotless
>
> For this example, let's rate it 4 stars - Good."
>
> [SCREEN: Click 4th star]

**[1:30 - 3:00] Supplies Check**

> "Next, check which supplies are available and in good condition."
>
> [SCREEN: Show supplies checklist]
>
> "Go through each item:
> - ✅ Toilet Paper: Check if present and sufficient
> - ✅ Soap: Check dispensers are filled
> - ✅ Paper Towels: Check availability
> - ❌ Hand Sanitizer: Not available - leave unchecked
> - ✅ Trash Bins: Not overflowing
>
> Check the box if the supply is present and adequate. Leave unchecked if missing or insufficient."
>
> [SCREEN: Check appropriate boxes]
>
> "In this case, we're missing hand sanitizer, so we'll leave that unchecked."

**[3:00 - 4:30] Maintenance Issues**

> "The third section covers maintenance problems you notice."
>
> [SCREEN: Show maintenance checklist]
>
> "Check any issues you find:
> - 🚽 Toilet: Clogged, broken, leaking
> - 🚰 Sink: Not draining, no water, leaking
> - 🚪 Door: Broken lock, won't close
> - 💡 Lights: Burned out, flickering
> - 🧹 Floor: Wet, damaged tiles
>
> For this inspection, we notice one light is flickering, so we'll check that box."
>
> [SCREEN: Check "Lights" box]
>
> "Don't worry if you check multiple items - this helps maintenance prioritize repairs."

**[4:30 - 5:30] Photos (Optional)**

> "You can add up to 5 photos to document conditions. This is especially helpful for maintenance issues."
>
> [SCREEN: Show photo upload area]
>
> "Click 'Add Photo' to take a picture or upload from your gallery."
>
> [SCREEN: Simulate taking photo of flickering light]
>
> "Photos are automatically compressed to save storage space. You can delete any photo by clicking the X in the corner."

**[5:30 - 6:30] Additional Notes**

> "Finally, add any notes that don't fit the checkboxes."
>
> [SCREEN: Show notes text area]
>
> "For example:"
>
> [SCREEN: Type note]
>
> "'Light above second sink is flickering. May need bulb replacement soon.'"
>
> "Keep notes brief and specific. This helps maintenance staff understand exactly what needs attention."

**[6:30 - 7:00] Submitting**

> "Review your inspection, then click 'Submit Inspection.'"
>
> [SCREEN: Click Submit button]
>
> "You'll see a success message, and your inspection is now saved!"
>
> [SCREEN: Show success toast]
>
> "Great job! In the next video, we'll explore reports and history."

---

### Video 4: Uploading Photos & Documentation

**Duration:** 4 minutes
**Target Audience:** All inspectors

---

#### Script

**[0:00 - 0:15] Intro**

> "In this tutorial, you'll learn best practices for taking and uploading photos during inspections. Good documentation makes it easier for maintenance teams to fix issues quickly."

**[0:15 - 1:00] When to Take Photos**

> "You should take photos when:
> - There's a maintenance issue (broken fixture, leak, damage)
> - Cleanliness is particularly poor or excellent
> - You want to document before/after cleaning
> - Something is unusual or unclear
>
> You don't need photos for routine inspections where everything is normal."

**[1:00 - 2:00] Taking Good Photos**

> "Here are tips for clear, useful photos:"
>
> [SCREEN: Show examples of good vs bad photos]
>
> "✅ GOOD:
> - Well-lit (turn on lights, use flash if needed)
> - Focused on the issue
> - Shows context (not too zoomed in)
> - Horizontal orientation (landscape mode)
>
> ❌ AVOID:
> - Blurry or dark photos
> - Too far away to see details
> - Personal items or people in frame
> - Vertical photos (unless necessary)"

**[2:00 - 3:00] Uploading Photos**

> "On the inspection form, click 'Add Photo.'"
>
> [SCREEN: Click Add Photo button]
>
> "You have two options:
> 1. **Take Photo:** Opens camera to take new photo
> 2. **Choose from Gallery:** Upload existing photo
>
> Let's take a new photo."
>
> [SCREEN: Open camera, take photo of sink leak]
>
> "After taking the photo, you can:
> - Retake if not satisfied
> - Confirm to upload
>
> The app automatically compresses the photo to under 1MB for faster uploads."

**[3:00 - 3:45] Managing Photos**

> [SCREEN: Show uploaded photos]
>
> "Once uploaded, you can:
> - Add up to 5 photos total
> - Click the X to remove any photo
> - Reorder by dragging (if feature available)
>
> Photos are stored securely in the cloud and attached to your inspection report."

**[3:45 - 4:00] Outro**

> "That's everything you need to know about photo documentation. Next up: viewing reports and history!"

---

### Video 5: Viewing Reports & History

**Duration:** 6 minutes
**Target Audience:** Inspectors & supervisors

---

#### Script

**[0:00 - 0:15] Intro**

> "Welcome! In this video, you'll learn how to view past inspections, filter reports, and use the calendar to track inspection history."

**[0:15 - 1:00] Navigating to Reports**

> "Click 'Reports' in the main navigation."
>
> [SCREEN: Click Reports menu]
>
> "You'll see the Reports page with two main views:
> - **Calendar View:** Visual timeline of inspections
> - **List View:** Table of all inspections
>
> By default, you'll see the calendar view."

**[1:00 - 2:30] Using the Calendar**

> [SCREEN: Show calendar interface]
>
> "The calendar shows all inspections with color-coded dots:
> - 🟢 Green: Excellent rating (5 stars)
> - 🔵 Blue: Good rating (4 stars)
> - 🟡 Yellow: Average rating (3 stars)
> - 🟠 Orange: Poor rating (2 stars)
> - 🔴 Red: Very poor rating (1 star)
>
> Click any date to see all inspections from that day."
>
> [SCREEN: Click on December 1]
>
> "You'll see a list of inspections. Click any inspection to view full details."

**[2:30 - 3:30] Inspection Details Modal**

> [SCREEN: Click inspection, show modal]
>
> "The details modal shows:
> - Location name
> - Inspector name
> - Date and time
> - Cleanliness rating
> - Supplies checked
> - Maintenance issues reported
> - Photos (click to enlarge)
> - Notes
>
> This is useful for reviewing your work or checking on repairs."

**[3:30 - 4:30] Filtering Reports**

> "Use the filters at the top to narrow down results:"
>
> [SCREEN: Show filter controls]
>
> "- **Date Range:** Select start and end dates
> - **Location:** Filter by specific building or room
> - **Rating:** Show only inspections with certain ratings
> - **Issues:** Show only inspections with maintenance issues
>
> For example, let's find all inspections with maintenance issues from last week."
>
> [SCREEN: Apply filters]

**[4:30 - 5:30] Exporting Reports**

> "Supervisors and admins can export reports to Excel or PDF."
>
> [SCREEN: Show export button]
>
> "Click 'Export' and choose your format. The file will include all filtered inspections with complete details."
>
> "This is useful for:
> - Monthly compliance reports
> - Analyzing trends
> - Sharing with management"

**[5:30 - 6:00] Outro**

> "You now know how to review inspection history and generate reports. This completes the End-User Tutorial Series!"
>
> "If you're an admin, check out the Admin Tutorial Series for location management and analytics."

---

## 🎨 Production Guidelines

### Visual Style

**Branding:**
- Use WC-Checks logo in intro/outro
- Consistent color scheme (match app design)
- Professional fonts (Inter, Roboto, or SF Pro)

**On-Screen Elements:**
- **Cursor:** Large, visible cursor with click effects
- **Zoom:** Highlight important UI elements
- **Annotations:** Arrows, boxes, or circles to draw attention
- **Text Overlays:** Key points or definitions

---

### Audio Quality

**Recording Tips:**
- Record in quiet environment (no background noise)
- Speak clearly and at moderate pace
- Pause between sentences for easier editing
- Drink water to avoid mouth clicks

**Post-Production:**
- Remove long pauses and "um"s
- Normalize audio levels (-3dB peak)
- Add subtle background music (royalty-free)
- Use noise reduction if needed

---

### Pacing

**General Rules:**
- **Slow down:** Mouse movements, typing, navigation
- **Pause:** After each major action (3-5 seconds)
- **Repeat:** Important steps or concepts
- **Summarize:** Key takeaways at the end

**Typical Pacing:**
- 1-2 minutes per major feature
- 10-15 seconds per button click explanation
- 5 seconds pause for user to read on-screen text

---

### Accessibility

**Captions:**
- Add accurate closed captions (auto-generate, then manually correct)
- Use large, readable font
- High contrast (white text on dark background)

**Transcripts:**
- Provide full text transcript in video description
- Helpful for SEO and users who prefer reading

**Visuals:**
- Avoid red-green color combinations (colorblind accessibility)
- Use patterns in addition to colors
- Ensure sufficient contrast ratios

---

## ✅ Publishing Checklist

### Pre-Production

- [ ] Script written and reviewed
- [ ] Test environment set up (clean data, demo account)
- [ ] Recording software tested
- [ ] Microphone tested (check audio levels)
- [ ] Lighting adequate (if using webcam)

---

### Recording

- [ ] Close unnecessary apps (notifications off)
- [ ] Browser zoom at 100% (or 110% for visibility)
- [ ] Mouse cursor visible and large
- [ ] Record in highest quality settings
- [ ] Do test recording (first 30 seconds)
- [ ] Record 2-3 takes of tricky sections

---

### Post-Production

- [ ] Trim dead air at start/end
- [ ] Remove mistakes and long pauses
- [ ] Add intro/outro graphics
- [ ] Add on-screen annotations
- [ ] Normalize audio levels
- [ ] Add background music (quiet, non-distracting)
- [ ] Generate captions
- [ ] Review full video for errors

---

### Export Settings

- [ ] Format: MP4 (H.264)
- [ ] Resolution: 1920x1080 (1080p)
- [ ] Frame Rate: 30 FPS
- [ ] Bitrate: 8-12 Mbps
- [ ] Audio: AAC, 128-192 kbps

---

### Publishing (YouTube Example)

- [ ] Upload video
- [ ] Title: Clear, descriptive, includes keywords
- [ ] Description: Summary + links + transcript
- [ ] Tags: Relevant keywords (toilet inspection, facilities management, QR codes)
- [ ] Thumbnail: Custom, high-quality, readable text
- [ ] Playlist: Add to appropriate series
- [ ] End Screen: Link to next video
- [ ] Cards: Add at relevant timestamps
- [ ] Privacy: Public (or Unlisted for internal use)

---

### Example YouTube Metadata

**Title:**
```
WC-Checks Tutorial #1: Getting Started - Toilet Inspection System
```

**Description:**
```
Learn how to use WC-Checks, our toilet inspection system, in just 5 minutes!

In this tutorial, you'll learn:
✅ How to log in
✅ Navigate the dashboard
✅ Start your first inspection
✅ Select locations manually

🔗 Links:
- WC-Checks App: https://wc-checks.yourcompany.com
- User Guide: [link]
- Help & Support: [email]

📹 Tutorial Series:
1. Getting Started (this video)
2. Scanning QR Codes
3. Filling Out Forms
4. Uploading Photos
5. Viewing Reports

⏱️ Timestamps:
0:00 Intro
0:20 Logging In
1:00 Dashboard Overview
2:00 Starting an Inspection
3:00 Selecting a Location
4:00 Next Steps
4:40 Outro

📄 Full Transcript: [link to transcript]

#FacilitiesManagement #ToiletInspection #QRCodes #Tutorial
```

**Tags:**
```
wc-checks, toilet inspection, facilities management, QR codes, inspection software, tutorial, getting started, user guide, restroom inspection, maintenance, cleanliness, audit
```

---

## 📊 Analytics & Improvement

### Track Metrics

**YouTube Analytics:**
- View count
- Watch time (average % watched)
- Engagement rate (likes, comments)
- Traffic sources (search, suggested, external)

**Goals:**
- Average view duration > 60%
- Likes:Dislikes ratio > 10:1
- Comments with questions (address in FAQ)

---

### Iterate Based on Feedback

**Common Feedback → Actions:**
- "Too fast" → Slow down demonstrations
- "Hard to see" → Increase zoom on UI elements
- "Didn't cover X" → Add supplementary video
- "Music too loud" → Reduce background music volume

**Update Schedule:**
- Re-record if major app redesign
- Add supplementary videos for new features
- Update descriptions/links quarterly

---

## 🎓 Advanced: Series 3 Outline (Technical)

### Video 1: Local Development Setup (12 min)

**Outline:**
1. Prerequisites (Node.js, pnpm, Git)
2. Cloning repository
3. Installing dependencies
4. Environment variables setup
5. Running development server
6. Verifying setup (health check endpoint)

---

### Video 2: Deploying to Vercel (10 min)

**Outline:**
1. Creating Vercel account
2. Connecting GitHub repository
3. Configuring environment variables
4. First deployment
5. Custom domain setup
6. Troubleshooting common errors

---

### Video 3: Supabase Database Configuration (15 min)

**Outline:**
1. Creating Supabase project
2. Understanding database schema
3. Running migrations
4. Setting up Row Level Security (RLS)
5. Testing API keys
6. Backup and restore procedures

---

## 📚 Resources

**Stock Assets:**
- **Music:** YouTube Audio Library, Epidemic Sound, Artlist
- **Icons:** Font Awesome, Heroicons (already in app)
- **Fonts:** Google Fonts (Inter, Roboto)

**Learning:**
- **Video Editing:** YouTube Creator Academy
- **Screencasting Tips:** Screencast Best Practices (various blogs)

---

**Questions?** Contact the documentation team or check the [USER_GUIDE.md](./USER_GUIDE.md) for reference material.
