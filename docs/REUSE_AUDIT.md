# Reuse Audit — RealtyFlow Platform

Date: 2026-10-03

This audit records first-party components that should be evaluated before new RealtyFlow functionality is written.

## Olivia -> Finance / Operations

High-value candidates:
- `ExpenseCapturePanel.tsx` — expense/receipt intake pattern
- `ProfitabilityDashboard.tsx`
- `ProfitabilityOliviaDashboard.tsx`
- `ProfitabilityOliviaSeasonView.tsx` — profitability views and KPI composition
- `AutoTasksView.tsx` / `AutoTasksOliviaView.tsx` — automated work queue patterns
- `CommerceHub.tsx` — commerce/sales operations concepts
- `DonaAnnaSalesInventoryView.tsx` — sales + inventory relationships
- `DonaAnnaOrderDocumentsView.tsx` — order/document linkage
- `PropertyDocumentsView.tsx` — structured document handling
- `TasksView.tsx` / `TasksKanbanOliviaView.tsx` — task UX

Rule: extract generic transaction/document/task primitives. Keep farm, parcel, harvest and certification concepts in Olivia.

## Family -> Finance / Shared Core

High-value candidates:
- `BankManager.tsx`
- `BankStatementImporter.tsx`
- `BillsManager.tsx`
- `TransactionManager.tsx`
- `ReceiptScanner.tsx`
- `ReceiptMatchWidget.tsx`
- `DocumentScanHelper.tsx`
- `DocumentsManager.tsx`
- `LiquidityForecastCard.tsx`
- `AutoBudgetSuggestion.tsx`
- `BusinessManager.tsx`
- `GlobalSearch.tsx`
- `AITaskChief.tsx`
- `AppErrorBoundary.tsx`
- `OnboardingWizard.tsx`
- `IntegrationsSettings.tsx`

Rule: Finance should reuse proven bank/receipt/transaction/document concepts but normalize them around brand/company/project/lead/customer dimensions instead of household-only dimensions.

## Remaster -> Content

High-value candidates:
- `AdminReelsStudio.tsx` — Reels creation workflow
- `AdminAssets.tsx` / `AssetCard.tsx` / `AssetUpload.tsx` — asset library patterns
- `AdminJobs.tsx` — generation/production job queue
- `PipelineAssets.tsx` — media pipeline
- `PipelinePublishSettings.tsx` — publishing configuration
- `YouTubeHealthCard.tsx` — channel health / integration state
- `AutopilotControl.tsx` — controlled automation UX
- `AdminRecommendations.tsx` — recommendation workflow
- `RecommendationHistory.tsx` — recommendation audit/history

Rule: Content gets a generic media-production engine. Music-specific concepts stay in Remaster.

## Extraction order

1. Platform workspace shell
2. Shared transaction + receipt/document model
3. Finance UI using Olivia + Family patterns
4. Shared asset/media model
5. Reels / YouTube production flow using Remaster patterns
6. Shared task/automation primitives
7. Global search and activity/audit surface
8. Nexus feedback loop across Content -> Marketing -> Sales -> Finance

## Architecture guardrails

- No cross-app copy/paste forks without an explicit temporary migration note.
- One canonical service for every reusable capability.
- Apps may provide tailored views over shared services.
- Do not merge domain-specific data models into Shared Core unless at least two products need them.
- Existing production routes remain available until their workspace replacement is verified.
