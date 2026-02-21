# Herbalife CRM - Product Requirements Document

## Project Overview
Next.js 16 CRM application for Herbalife business management, deployed on Railway using MongoDB.

## Original Problem Statement
Build CRM modules (Customers, Leads/Sales Booster, Reports) following the existing Team module pattern with:
- JWT authentication using HttpOnly cookie `ice_token`
- MongoDB with Mongoose
- App Router (Next.js 16)
- All APIs prefixed with `/api`

## Architecture
- **Framework**: Next.js 16 with App Router
- **Database**: MongoDB (Railway)
- **Auth**: JWT with HttpOnly cookies
- **Frontend**: React with Tailwind CSS

## User Personas
1. **Herbalife Distributors** - Manage team, customers, and leads
2. **Club Owners** - Track customer subscriptions and volumes
3. **Organization Leaders** - View reports and team performance

## Core Requirements (Static)
- ✅ JWT authentication via HttpOnly cookie
- ✅ Protected dashboard routes
- ✅ CRUD operations for all modules
- ✅ Owner-based data isolation

## What's Been Implemented

### Feb 21, 2026
1. **Customers Module**
   - Model: Customer (owner, name, phone, productPlan, subscriptionStatus, renewalDate, monthlyVolume)
   - APIs: POST /api/customers, GET /api/customers, DELETE /api/customers/[id]
   - Frontend: /dashboard/my-customers (add form, list view, delete)

2. **Leads Module (Sales Booster)**
   - Model: Lead (owner, name, source, status, followUpDate, notes)
   - APIs: POST /api/leads, GET /api/leads, PATCH /api/leads/[id], DELETE /api/leads/[id]
   - Frontend: /dashboard/sales-booster (add, update status, delete)

3. **Reports Module**
   - API: GET /api/reports
   - Returns: totalTeam, totalCustomers, totalLeads, activeCustomers, monthlyNewMembers, monthlyNewLeads
   - Frontend: /dashboard/reports (stats cards, summary)

4. **Bug Fixes by Testing Agent**
   - Fixed login route secure cookie for development
   - Added auto-login after registration

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/customers | Add new customer |
| GET | /api/customers | List all customers |
| DELETE | /api/customers/[id] | Delete customer |
| POST | /api/leads | Add new lead |
| GET | /api/leads | List all leads |
| PATCH | /api/leads/[id] | Update lead |
| DELETE | /api/leads/[id] | Delete lead |
| GET | /api/reports | Get dashboard stats |

## Prioritized Backlog

### P0 (Completed)
- ✅ Customers CRUD
- ✅ Leads CRUD
- ✅ Reports Dashboard

### P1 (Next)
- My Journey page implementation
- My Club page implementation
- My Organization page implementation

### P2 (Future)
- Customer subscription renewal reminders
- Lead follow-up notifications
- Advanced analytics and charts
- Export data to CSV/Excel
- Bulk import customers/leads

## Next Tasks
1. Implement My Journey page for tracking business milestones
2. Build My Club page for club management
3. Add My Organization hierarchy view
4. Implement Settings page for user preferences
