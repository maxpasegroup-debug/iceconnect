# Herbalife CRM - Product Requirements Document

## Project Overview
Production-grade Herbalife Distributor Growth CRM built with Next.js 16, MongoDB (Railway), and JWT authentication.

## Original Problem Statement
Build a comprehensive CRM with 8 modules: My Journey, My Team, My Customers, Sales Booster (Leads), My Club, My Organization, Reports, Settings. All modules must use JWT authentication (ice_token cookie), owner-scoped queries, and follow strict security rules.

## Architecture
- **Framework**: Next.js 16 with App Router
- **Database**: MongoDB on Railway
- **Auth**: JWT with HttpOnly cookies (ice_token)
- **Frontend**: React with Tailwind CSS
- **Deployment**: Railway-ready

## User Personas
1. **Herbalife Distributors** - Track personal journey, manage team and customers
2. **Club Owners** - Monitor club qualification progress
3. **Organization Leaders** - View organization hierarchy and performance

## Core Requirements (Static)
- ✅ JWT authentication via HttpOnly cookie
- ✅ Owner-scoped data isolation
- ✅ No hardcoded MongoDB URLs
- ✅ credentials: "include" on all fetch calls
- ✅ Protected dashboard routes

## What's Been Implemented

### Feb 21, 2026 - Full Implementation

**1. My Journey Module**
- Model: currentRank, nextRank, monthlyPV, monthlyGV, goals, milestones
- Features: Editable rank, goals, progress bar, milestone timeline
- API: GET/PUT/POST /api/journey

**2. My Team Module (Upgraded)**
- Model: owner, name, phone, rank, joiningDate, personalVolume, teamVolume, level, performanceTag, status
- Features: Add/Edit/Delete members, status toggle, summary stats
- API: GET/POST /api/team, PATCH/DELETE /api/team/[id]

**3. My Customers Module**
- Model: owner, name, phone, productPlan, subscriptionStatus, renewalDate, monthlyVolume, paymentMode, notes
- Features: CRUD, Active/Expired filter, renewal badges, revenue calculation
- API: GET/POST /api/customers, PATCH/DELETE /api/customers/[id]

**4. Sales Booster (Leads) Module**
- Model: owner, name, source, status, followUpDate, notes
- Features: CRUD, status updates, follow-up reminders, conversion tracker
- API: GET/POST /api/leads, PATCH/DELETE /api/leads/[id]

**5. My Club Module**
- Model: owner, currentClubLevel, pvRequired, gvRequired, activeLinesRequired, currentPV, currentGV, activeLines, qualificationMonth, maintenanceStatus
- Features: Progress bars, qualification tracking, maintenance status
- API: GET/PUT /api/club

**6. My Organization Module**
- Reuses Team model with hierarchy support
- Features: Level filtering, strongest/weakest line calculation, tree view
- API: GET /api/organization

**7. Reports Module**
- Dynamic calculations: totalTeam, totalCustomers, totalLeads, activeCustomers, monthlyNewMembers, monthlyNewLeads, totalMonthlyPV, totalRevenue
- Features: Lead conversion rate, customer retention rate, 6-month PV trend chart
- API: GET /api/reports

**8. Settings Module**
- Profile: Update name, change PIN
- Business: Monthly target, currency, timezone
- Security: Logout all sessions
- Data: Export JSON, delete account with cascade
- API: GET/PUT/DELETE /api/settings, GET /api/settings/export

## Models Created
- `/app/models/Journey.ts`
- `/app/models/Club.ts`
- `/app/models/Settings.ts`
- Updated: `/app/models/Team.ts`
- Updated: `/app/models/Customer.ts`
- Updated: `/app/models/Lead.ts`

## API Endpoints Summary
| Module | Endpoints |
|--------|-----------|
| Journey | GET/PUT/POST /api/journey |
| Team | GET/POST /api/team, PATCH/DELETE /api/team/[id] |
| Customers | GET/POST /api/customers, PATCH/DELETE /api/customers/[id] |
| Leads | GET/POST /api/leads, PATCH/DELETE /api/leads/[id] |
| Club | GET/PUT /api/club |
| Organization | GET /api/organization |
| Reports | GET /api/reports |
| Settings | GET/PUT/DELETE /api/settings, GET /api/settings/export |

## Security Implementation
- All queries scoped by `owner: userId`
- JWT verified on every API call
- No global data exposure
- PIN hashed with bcrypt
- No password/pin returned in responses

## Prioritized Backlog

### P0 (Completed)
- ✅ All 8 modules implemented
- ✅ JWT authentication
- ✅ Owner-scoped queries
- ✅ Production build passing

### P1 (Next)
- Push notifications for follow-ups
- Email reminders for renewals
- Advanced analytics dashboard
- WhatsApp integration for leads

### P2 (Future)
- Bulk import/export
- Team chat functionality
- Goal achievement badges
- Mobile PWA optimization

## Next Tasks
1. Add push notifications for follow-up reminders
2. Implement email integration for customer renewals
3. Add advanced filtering and search across modules
4. Create mobile-optimized views
