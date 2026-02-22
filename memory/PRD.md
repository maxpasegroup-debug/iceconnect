# ICECONNECT CRM - Product Requirements Document

## Overview
ICECONNECT is a Herbalife Distributor Growth CRM built with Next.js 16, MongoDB, and TailwindCSS. It provides tools for managing customers, team members, leads, and business growth tracking.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** TailwindCSS
- **Database:** MongoDB (Railway-hosted)
- **Authentication:** JWT stored in HttpOnly cookie

## Core Features

### Authentication
- ✅ Registration with phone and PIN
- ✅ Login with phone and PIN
- ✅ Session management via `/api/session`
- ✅ Logout functionality

### Dashboard Modules
1. **My Customers** - Customer management with subscription tracking
2. **My Team** - Team member management with performance metrics
3. **My Journey** - Personal growth tracking (PV, GV, ranks)
4. **My Club** - Club qualification tracking
5. **My Organization** - Organizational hierarchy view
6. **Sales Booster** - Lead management and digital marketing tools
7. **Reports** - Business analytics and performance reports
8. **Settings** - User preferences and data export

### Boost Digitally (Sales Booster)
- **My Leads Tab:** Lead tracking with Add Lead modal
- **Generate Leads Tab:** Subscription-gated funnel features
- **Digital Marketing Tab:** Placeholder for future services

## UI/UX Implementation Status (Feb 2026)

### ✅ Completed Features
1. **Demo Data Removed** - All hardcoded values replaced with real API data
2. **Profile Dropdown** - Avatar clickable with:
   - My Profile modal (account & subscription info)
   - Subscription link
   - Mobile Experience modal
   - Logout option
3. **Notification Dropdown** - Bell icon with static notifications
4. **Support Chatbot** - Help button opens rule-based chatbot:
   - Quick action buttons
   - WhatsApp escalation for technical issues
5. **Mobile Banner** - Bottom-right banner (mobile only) for home screen setup
6. **Subscription Gating** - Generate Leads tab shows:
   - ACTIVE badge when subscribed
   - Activation banner when not subscribed
7. **Add Lead Modal** - Full CRUD for leads in Sales Booster

### Data-TestID Implementation
All interactive elements have data-testid attributes for testing:
- `profile-avatar-btn`, `notification-bell-btn`, `help-btn`
- `mobile-banner`, `mobile-banner-setup-btn`, `mobile-banner-dismiss-btn`
- `add-lead-btn`, `tab-leads`, `tab-boost`

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/session` - Get current session
- `POST /api/logout` - User logout

### Core Data
- `/api/customers` - Customer CRUD
- `/api/team` - Team member CRUD
- `/api/leads` - Lead CRUD
- `/api/journey` - Journey tracking
- `/api/club` - Club status
- `/api/organization` - Org hierarchy
- `/api/reports` - Business reports
- `/api/settings` - User settings

### Subscription
- `POST /api/subscription` - Activate subscription (mock payment)

## Database Models

### User
```javascript
{
  name, phone, pin, role,
  subscriptionActive, salesBoosterActive,
  onboardingStatus, onboardingFeePaid, onboardingCompleted,
  generateLeadsSubscription: { active, startDate, expiryDate, autopayEnabled }
}
```

### Lead
```javascript
{
  owner, name,
  source: ["WhatsApp", "Instagram", "Referral", "Manual", "Funnel", "Other"],
  status: ["New", "Hot", "Warm", "Cold"],
  followUpDate, notes
}
```

## Future Tasks (Backlog)

### P0 - High Priority
- [ ] Preview environment infrastructure fix (currently showing "Preview Unavailable")

### P1 - Medium Priority
- [ ] Razorpay payment integration for subscription activation
- [ ] Backend notification system (replace static notifications)
- [ ] AI-powered support chatbot

### P2 - Lower Priority
- [ ] PWA implementation for true mobile app experience
- [ ] Push notifications
- [ ] Email/SMS notifications for follow-ups

## Testing Status
- ✅ All UI/UX features tested via testing agent (100% pass rate)
- ✅ Lead model updated with proper enum values
- ✅ Login cookie configuration fixed for development

## Known Issues
- Preview URL showing "Preview Unavailable" - platform hibernation issue
- Local testing works perfectly via localhost:3000

## File Structure
```
/app
├── app/
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard pages
│   ├── funnel/       # Public funnel page
│   └── page.tsx      # Landing page
├── models/           # Mongoose schemas
├── lib/              # Database connection
└── .env.local        # Environment variables
```
