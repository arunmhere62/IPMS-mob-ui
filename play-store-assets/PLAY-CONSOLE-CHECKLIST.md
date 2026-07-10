# Play Console Upload Checklist

## Step-by-Step Guide to Publish on Google Play Store

### 1. Build Release AAB (Android App Bundle)
```bash
cd d:\pg-mobile-app\IPMS-mob\IPMS-mob-ui
npm install
eas build -p android --profile production
```

### 2. Access Google Play Console
- Go to: https://play.google.com/console
- Sign in with your Google account
- Select your app: "PG Management System"

### 3. Store Listing Section

#### Main Store Listing

**App Name:**
```
PG Management System
```

**Short Description:** (Max 80 chars)
```
Manage PGs, hostels & tenants effortlessly. Rent tracking, payments, complaints & more!
```

**Full Description:** (Copy from listing-metadata.json)
```
PG Management System (PGMS) is the ultimate all-in-one solution for PG owners, hostel managers, and property managers to streamline their operations and maximize efficiency.

🎯 KEY FEATURES:
✅ Tenant Management - Add, track, and manage tenants with ease
✅ Rent & Payment Tracking - Automated rent collection, payment reminders, and receipt generation
✅ Room & Bed Allocation - Smart occupancy management and availability tracking
✅ Complaint & Maintenance - Streamlined issue tracking and resolution
✅ Notifications & Alerts - Instant updates for payments, complaints, and announcements
✅ Expense Management - Track PG expenses and generate financial reports
✅ Document Management - Store tenant documents securely
✅ Multi-PG Support - Manage multiple properties from a single dashboard

💡 WHY CHOOSE PG MANAGEMENT SYSTEM?
• Save time with automated rent reminders and payment tracking
• Reduce manual paperwork with digital tenant records
• Improve tenant satisfaction with quick complaint resolution
• Boost occupancy with real-time room availability
• Generate professional rent receipts and reports
• Secure cloud storage for all your data

🏠 PERFECT FOR:
• Paying Guest (PG) Accommodation Owners
• Hostel Managers
• Property Management Companies
• Real Estate Investors
• Rental Property Owners
• Student Housing Managers

Download PG Management System today and take your property management to the next level!
```

#### Graphics Upload

**App Icon:**
- Upload: `assets/app-icon.png`
- Requirements: 512 x 512 px, PNG-32

**Feature Graphic:**
- Create: 1024 x 500 px
- File: `play-store-assets/feature-graphic.png` (you need to create this)
- Safe zone: Keep text within 924 x 400 px center

**Phone Screenshots:** (Minimum 2, upload 5-8)
1. Screenshot sizes: 1080x1920 (9:16 portrait) or 1280x720 (16:9 landscape)
2. File format: PNG or JPEG
3. Upload to: Phone screenshots section

**Tablet Screenshots:** (Optional)
- 7-inch: 1080x1920 or higher
- 10-inch: 1920x1080 or higher

#### Categorization

**Application Type:** Applications

**Category:** Business

**Tags:** (Select all that apply)
- Finance
- Productivity
- Tools

**External Marketing:**
- Marketing URL: https://pgmanagement.site
- Privacy Policy URL: https://pgmanagement.site/privacy-policy

### 4. App Content Section

**Privacy Policy:**
- [ ] Add privacy policy URL: `https://pgmanagement.site/privacy-policy`
- [ ] If no website, create a simple privacy policy page

**App Access:**
- [ ] Select: "All or some functionality is restricted"
- [ ] Add testing credentials if required

**Content Rating:**
- [ ] Click "Start questionnaire"
- [ ] Category: "Reference, News, or Educational"
- [ ] Answer all questions
- [ ] Expected rating: "Everyone"

**Target Audience:**
- [ ] Primary: 18+ (PG owners/managers)
- [ ] Secondary: All ages

**News Apps:**
- [ ] Select "No"

**COVID-19 Contact Tracing:**
- [ ] Select "No"

**Data Safety:** (Required)
- [ ] Click "Start survey"
- [ ] Data collection: Email, Phone, Device ID
- [ ] Data sharing: None with third parties
- [ ] Security: Encryption, Secure transmission
- [ ] Data deletion: Available on request

### 5. Pricing & Distribution

**App Pricing:**
- [ ] Select: "Free"

**Countries:**
- [ ] Select: All countries (or specific: India, UAE, Singapore, etc.)

**Primary Category:**
- [ ] Business

**Secondary Category:**
- [ ] Productivity

**Contact Details:**
- [ ] Email: support@pgmanagement.site
- [ ] Phone: (optional)
- [ ] Website: https://pgmanagement.site

### 6. Release Section

**Production Track:**
- [ ] Click "Production" > "Create new release"
- [ ] Upload your AAB file (from EAS build)
- [ ] Add release notes:

```
Release 1.0.0:
• Complete PG management solution
• Tenant and room management
• Rent tracking and payment collection
• Complaint management system
• Push notifications
• Expense tracking
• Multi-PG support
```

**Review and Rollout:**
- [ ] Review all sections for errors
- [ ] Click "Start rollout to Production"
- [ ] Submit for review

### 7. Additional Settings

**Store Listing Experiments:**
- [ ] Set up A/B tests for:
  - Feature graphic variations
  - Screenshot order
  - Short description variations

**Translations:**
- [ ] Add Hindi (hi-IN) translation for India market
- [ ] Title: पीजी मैनेजमेंट सिस्टम
- [ ] Short description: पीजी, होस्टल और टेनेंट आसानी से मैनेज करें। रेंट ट्रैकिंग, पेमेंट्स, शिकायतें और बहुत कुछ!

**Store Listing Preview:**
- [ ] Check how it looks on different devices
- [ ] Verify all images display correctly

---

## Post-Submission Timeline

- **Review Time**: 1-7 days (typically 2-3 days for new apps)
- **Status Updates**: Check email notifications
- **Rejected?**: Fix issues and resubmit

## Quick Reference: Asset Sizes

| Asset | Size | Format | Location |
|-------|------|--------|----------|
| App Icon | 512x512 | PNG-32 | assets/app-icon.png |
| Feature Graphic | 1024x500 | PNG/JPG | play-store-assets/feature-graphic.png |
| Phone Screenshots | 1080x1920 | PNG/JPG | Screenshot from device |
| Tablet 7" | 1080x1920 | PNG/JPG | Optional |
| Tablet 10" | 1920x1080 | PNG/JPG | Optional |

## SEO Checklist for Top Rankings

- [ ] Keywords in title: "PG Management System"
- [ ] Keywords in short description
- [ ] 3-5% keyword density in full description
- [ ] High-quality screenshots with captions
- [ ] Feature graphic with value proposition
- [ ] Promo video (30-60 seconds)
- [ ] Quick response to user reviews
- [ ] Regular app updates (monthly)
- [ ] Encourage positive reviews
- [ ] Low crash rate (<1%)

---

**Next Steps:**
1. Create feature graphic (1024x500 px)
2. Take 5-8 professional screenshots
3. Build production AAB
4. Upload to Play Console
5. Submit for review

**Questions?** Check README.md in this folder for detailed ASO guidelines.
