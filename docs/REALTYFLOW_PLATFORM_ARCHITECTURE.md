# RealtyFlow Platform Architecture

Status: Locked direction — 2026-10-03

## Product model

RealtyFlow is one platform with four primary workspaces:

- Sales
- Marketing
- Content
- Finance

Shared platform services sit underneath all workspaces:

- Shared Core
- Nexus
- Platform / Operations

The workspaces are user-facing boundaries, not separate data silos.

## Shared Core owns

- people, leads and customers
- companies
- brands
- users and roles
- permissions
- communication history
- files
- activities and audit log
- Nexus signals
- shared identifiers and relationships

## Reuse-first rule

Before creating a new subsystem, inspect the other first-party apps and reuse proven patterns where appropriate.

### Olivia

Candidate capabilities to generalize:
- income and expense capture
- receipts and document intake
- work and purchase registration
- profitability views
- tasks and automatic tasks
- operational dashboard patterns
- document archive and traceability patterns

Use these as sources for a shared finance/operations engine. Farm-specific concepts remain in Olivia.

### Family

Candidate capabilities to generalize:
- payment entry
- household/transaction flows that are generic enough for finance
- PDF/document handling
- recurring/shared record patterns
- lightweight forms that work well on mobile

Only generic capabilities move into Shared Core / Finance.

### Remaster

Candidate capabilities to generalize:
- media ingestion and playback patterns
- YouTube channel integration
- media queue / sequencing patterns
- visual production workflow ideas
- responsive creator UI patterns

Use these as sources for Content and publishing workflows. Music-specific concepts remain in Remaster.

## Migration principles

1. Do not rewrite backend services unless the current implementation blocks reuse.
2. Keep existing routes working while new workspace routes are introduced.
3. Move navigation first, behavior second, data model last.
4. One shared customer/brand identity across every workspace.
5. Every reusable capability should have one canonical implementation.
6. Workspace-specific UI may wrap a shared service without duplicating the service.
7. New work must declare which workspace owns the user journey and which shared service owns the data.

## First migration map

### Sales
- Pipeline
- CRM / customer cards
- Calendar
- Inventory
- Plot database
- Valuation
- Lead scanner

### Marketing
- Growth Hub
- Marketing tasks
- campaigns and outreach as they are consolidated

### Content
- Content CMS / Content Studio
- Image Studio
- Reels / video / YouTube workflows as they are migrated

### Finance
- Business Overview
- Business Hub
- future shared income, expense, receipt, commission, budget and ROI services

### Platform / Operations
- settings
- permissions
- integrations
- automations
- assistant / Nexus admin surfaces
- system health and audit

## Target flow

Content creates assets -> Marketing distributes -> Sales captures and progresses demand -> Finance records outcome -> Nexus learns across the full loop.
