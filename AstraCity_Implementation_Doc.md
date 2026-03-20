# AstraCity — Complete Implementation Documentation
### Bengaluru Waste Ecosystem Spatial Intelligence Platform
**Generated:** 19 March 2026 · **Status:** All 6 pages + shared components fully implemented

---

## 0. Quick Reference

| Metric | Value |
|--------|-------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript + React 18 |
| **Styling** | Tailwind CSS 3.4 |
| **Theme** | Premium Light (white + slate + teal accents) |
| **Mapping** | MapLibre GL JS v5.20.2 + OpenFreeMap Positron tiles |
| **Charts** | Recharts 3.8 |
| **Animations** | Framer Motion 12.36 |
| **State** | Zustand 5.0 |
| **AI** | Google Gemini 1.5 Flash (REST API) |
| **Dev Server** | `npm run dev` → `http://localhost:3000` |

---

## 1. Project Structure (Implemented)

```
astracity/
├── app/
│   ├── layout.tsx                 # Root layout: Navbar + AIQueryBar (global)
│   ├── globals.css                # Global styles + MapLibre overrides
│   ├── page.tsx                   # Landing page (/)
│   ├── map/
│   │   └── page.tsx               # Smart Map page (/map)
│   ├── simulation/
│   │   └── page.tsx               # Simulation Panel (/simulation)
│   ├── impact/
│   │   └── page.tsx               # Economic Impact Dashboard (/impact)
│   ├── wards/
│   │   └── page.tsx               # Ward Scoring (/wards)
│   ├── report/
│   │   └── page.tsx               # Report Export (/report)
│   └── api/
│       └── geojson/
│           └── route.ts           # API route serving bengaluru_wards.geojson
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx             # Sticky top nav with page links
│   │   └── AIQueryBar.tsx         # Floating Gemini-powered query bar
│   ├── map/
│   │   ├── MapContainer.tsx       # MapLibre GL wrapper (all layers)
│   │   ├── LayerToggle.tsx        # 6-layer toggle panel (glassmorphism)
│   │   └── WardSidebar.tsx        # Ward detail slide-in panel
│   └── (ui/, impact/, simulation/, wards/ — placeholder dirs)
│
├── data/
│   ├── bengaluru_wards.geojson    # 20 ward polygons (generated grid)
│   ├── dump_sites.json            # 50 illegal dump site coordinates
│   ├── ward_scores.json           # 20 wards with scores + metrics
│   ├── simulation_lookup.json     # Pre-computed simulation outputs (54 combos)
│   └── economic_params.json       # BBMP cost constants
│
├── lib/
│   └── store.ts                   # Zustand global state (layers + selected ward)
│
├── .env.local                     # Environment variables
├── package.json                   # Dependencies
├── tailwind.config.ts             # Tailwind configuration
├── next.config.mjs                # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
└── generate_geojson.js            # Utility: generates bengaluru_wards.geojson
```

---

## 2. Environment Variables

File: `.env.local`

```env
NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key>
```

> [!NOTE]
> No Mapbox token is needed. The map uses **OpenFreeMap Positron** (free, zero API keys).

---

## 3. Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^12.36.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.0",
    "maplibre-gl": "^5.20.2",
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^3.8.0",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---

## 4. Global Architecture

### Root Layout (`app/layout.tsx`)

```
<html>
  <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
    <Navbar />                    ← Sticky top bar (all pages)
    <main className="flex-1">     ← Page content slot
      {children}
    </main>
    <AIQueryBar />                ← Fixed bottom bar (all pages)
  </body>
</html>
```

### Global State (Zustand — `lib/store.ts`)

```typescript
type LayerId = 'dumps' | 'methane' | 'waste' | 'dumpProbability' | 'routes' | 'wardVulnerability';

interface AppState {
  activeLayers: Record<LayerId, boolean>;   // Toggle map layers
  toggleLayer: (layer: LayerId) => void;
  selectedWardId: number | null;            // Currently selected ward
  setSelectedWardId: (id: number | null) => void;
}
```

**Default active layers:** `dumps` (on), `wardVulnerability` (on), all others off.

---

## 5. Page-by-Page Implementation Details

---

### PAGE 1 — Landing (`/`)

**File:** `app/page.tsx` (311 lines)

**Features implemented:**
- ✅ Full-screen hero with animated particle canvas (60 teal floating dots)
- ✅ Subtle grid overlay pattern
- ✅ Radial gradient depth effects (teal + emerald blurs)
- ✅ Pill badge: "🛰 Space Tech · Solid Waste Intelligence"
- ✅ Hero title: "AstraCity" (8xl font-black)
- ✅ Tagline: "Simulate. Predict. Optimize. Decarbonize."
- ✅ 3 animated stat counters using Framer Motion springs:
  - `₹4.2 Cr` — Saved Annually
  - `847` — Illegal Dumps Detected
  - `23%` — Methane Reduction
- ✅ "Enter AstraCity →" CTA button → links to `/map`
- ✅ 6 feature pills at bottom (Satellite AI, Digital Twin, etc.)
- ✅ Staggered entrance animations on all elements

**Key components:**
- `useCounter(target, duration, decimals)` — Custom animated counter hook
- `ParticleField` — Canvas-based floating particle background
- `StatCard` — Reusable metric card with prefix/suffix

---

### PAGE 2 — Smart Map (`/map`)

**Files:**
- `app/map/page.tsx` (18 lines) — Dynamic import wrapper with SSR disabled
- `components/map/MapContainer.tsx` (~340 lines) — Core map engine
- `components/map/LayerToggle.tsx` (143 lines) — Layer toggle UI
- `components/map/WardSidebar.tsx` (293 lines) — Ward detail panel

**Features implemented:**
- ✅ Full-viewport MapLibre GL map (OpenFreeMap Positron light tiles)
- ✅ Centered on Bengaluru `[77.5946, 12.9716]`, zoom 11, pitch 40°
- ✅ 6 toggleable data layers:

| Layer ID | Type | Source | Default |
|----------|------|--------|---------|
| `dumps` | Circle markers | `dump_sites.json` | ON |
| `methane` | Heatmap (red) | `ward_scores.json` (methaneIntensity) | OFF |
| `waste` | Heatmap (yellow) | `ward_scores.json` (wasteTons) | OFF |
| `dumpProbability` | Heatmap (blue) | `ward_scores.json` (dumpRisk) | OFF |
| `routes` | Dashed lines (green) | Generated from high-risk wards | OFF |
| `wardVulnerability` | Fill polygons | `bengaluru_wards.geojson` (score-colored) | ON |

- ✅ Ward polygons colored by interpolated score (red → orange → yellow → green)
- ✅ Click dump marker → popup with ward name, risk level, area, detection date
- ✅ Click ward polygon → WardSidebar slides in from right with:
  - Ward name + zone
  - Risk badge (High/Medium/Low — color-coded)
  - Score out of 100 with progress bar
  - Dump Probability percentage
  - Waste Generation (tons/day)
  - Trend indicator (Worsening/Improving/Stable with icon)
  - "Run Simulation for this ward →" CTA button
- ✅ Dark glassmorphism layer toggle panel (collapsible)
- ✅ Navigation controls (zoom + compass, bottom-right)
- ✅ Gradient overlays at top/bottom edges

**API Route:** `app/api/geojson/route.ts`
- Serves `data/bengaluru_wards.geojson` via `GET /api/geojson`

**Technical notes:**
- Map is dynamically imported with `ssr: false` to avoid SSR hydration issues
- `map.resize()` is called on load to force correct canvas dimensions
- Ward GeoJSON is enriched with scores from `ward_scores.json` at runtime
- Route lines are auto-generated connecting the 8 highest-risk ward centroids

---

### PAGE 3 — Simulation Panel (`/simulation`)

**File:** `app/simulation/page.tsx` (320 lines)

**Features implemented:**
- ✅ Two-column layout (35% controls / 65% results)
- ✅ Left panel (dark card, glassmorphism):
  - Title: "Scenario Controls" with ⚙️ icon
  - Ward selector dropdown (All Bengaluru + 20 ward names)
  - Population Growth slider: 0% to 50% (step 10)
  - Rainfall toggle: Low / Normal / Heavy (button group)
  - Festival Spike: None / Diwali / Ganesh Chaturthi (button group)
  - Transfer Station toggle: Active / Relocated (switch)
  - "Run Simulation" button (teal, full-width, loading spinner)
- ✅ Right panel:
  - 4 metric cards in 2×2 grid with animated values:
    1. 🗑️ Waste Generated (tons/day)
    2. 🗺️ Dumps Predicted (count)
    3. 📉 Landfill Inflow (tons)
    4. ☁️ Methane Projection (tons/month)
  - Each card shows: icon + label + large animated number + change vs baseline
  - Change indicators color-coded (green for improvement, rose for worsening)
  - "View Economic Impact →" link to `/impact`

**Simulation engine:**
- Uses `data/simulation_lookup.json` — 54 pre-computed output combinations
- Lookup key format: `pop_{growth}_rain_{level}_festival_{type}`
- Population growth: 0, 10, 20, 30, 40, 50
- Rainfall: low, normal, heavy
- Festival: none, diwali, ganesh
- Transfer station relocation applies a ±8% modifier
- 800ms artificial delay for "processing" feel

**Formulas (pre-computed):**
```
wasteGenerated = baseWaste × (1 + popGrowth) × festivalMultiplier × weatherFactor
dumpsPredicted = (wasteGenerated / collectionCapacity) × zonalRiskIndex
methaneProjection = landfillInflow × emissionFactor × (1 - captureRate)
```

---

### PAGE 4 — Economic Impact (`/impact`)

**File:** `app/impact/page.tsx` (237 lines)

**Features implemented:**
- ✅ Hero section: Giant animated counter `₹X.X Crores` (exact calc from JSON)
  - Subtitle: "Estimated annual savings for BBMP using AstraCity"
  - Sub-subtitle: "Across 198 wards · 2,800 trucks · 24 transfer stations"
- ✅ 4 savings cards (icon + value + description):
  1. 🚛 Fuel Savings — optimized route distance
  2. 🗑️ Cleanup Avoided — dumps prevented annually
  3. 🌿 Carbon Credits — CO₂e reduced × price/ton
  4. 👷 Labor Savings — hours/truck/day saved
- ✅ Before vs After bar chart (Recharts BarChart):
  - X-axis: Fuel, Cleanup, Carbon, Labor
  - Two bar groups: red (Before) / teal (After)
- ✅ ROI Timeline line chart (Recharts LineChart):
  - 24 months projected cumulative savings
  - Break-even annotation at Month 4
  - Amber badge: "Full ROI in 4 months"
- ✅ CTA buttons: "Export Full Report" → `/report` + "Download Raw Data"

**Economic calculations (live from JSON):**
```typescript
fuelCr    = (48km - 31km) × 2800 trucks × 365 days × ₹20/km ÷ 1Cr
cleanupCr = 1,240 dumps × ₹62,000/dump ÷ 1Cr
carbonCr  = 3,400 tons × ₹2,000/ton ÷ 1Cr
laborCr   = 1.8 hrs × 2,800 trucks × 365 days × ₹180/hr ÷ 1Cr
totalCr   = sum of above ≈ ₹44.9 Crores
```

**Data source:** `data/economic_params.json`

---

### PAGE 5 — Ward Scoring (`/wards`)

**File:** `app/wards/page.tsx` (402 lines)

**Features implemented:**
- ✅ Summary strip at top:
  - Total Wards: 198 | High Risk: 47 | Medium: 89 | Low Risk: 62
  - Pulsing red alert: "5 wards need immediate action"
- ✅ Two-column layout (40% visual map / 60% data table)
- ✅ Left — Schematic Ward Map:
  - DOM-based visualization (no external mapping library)
  - 5 zone blocks arranged geographically: North (top), West-Central-East (middle), South (bottom)
  - Each ward rendered as a colored square (score-based: red/amber/green)
  - Click ward → highlights with ring + shows detail panel below
  - Hover shows tooltip with ward name and score
- ✅ Left — Detail Panel (AnimatePresence):
  - Ward name + zone
  - Score badge (colored)
  - 4 metric cards: Dump Risk, Methane Int., Efficiency, Trend
- ✅ Right — Sortable Data Table:
  - Columns: Ward | Zone | Score | Dump Risk | Methane | Efficiency | Trend
  - Click column headers to sort (asc/desc toggle)
  - Sort indicator arrows (▲/▼)
  - Score displayed as colored badge
  - Trend displayed as directional arrow (↑↓→)
  - Search bar (filter by ward name)
  - Zone dropdown filter
  - Click row → highlights ward on visual map (bidirectional sync)
  - Selected row has teal left border
- ✅ Pagination: 10 rows per page, Prev/Next buttons, "Showing X to Y of Z"

**Score color mapping:**
```
0–40:  Rose (High Risk)
41–70: Amber (Medium Risk)
71+:   Emerald (Low Risk)
```

**Data source:** `data/ward_scores.json` (20 wards)

---

### PAGE 6 — Report Export (`/report`)

**File:** `app/report/page.tsx` (~250 lines)

**Features implemented:**
- ✅ Two-column layout (35% config / 65% preview)
- ✅ Left — Report Configuration:
  - Title: "Generate Report"
  - 6 section checkboxes (animated SVG checkmarks):
    - ✅ Executive Summary
    - ✅ Ward Risk Analysis
    - ✅ Economic Impact Summary
    - ✅ Methane Emission Projection
    - ✅ Recommended Actions
    - ☐ Raw Data Tables
  - Date range dropdown: This Month / Last Quarter / This Year
  - "Generate PDF" button (teal, prominent) → `window.print()`
  - "Mock Email to BBMP" button → success toast animation
- ✅ Right — Live PDF Preview:
  - A4-proportioned white panel with shadow (mimics printed page)
  - AstraCity logo + header (teal circle icon)
  - "OFFICIAL REPORT — Bruhat Bengaluru Mahanagara Palike"
  - Date range + generation date
  - Title: "Waste Management Intelligence Report" with teal divider
  - Dynamic content sections (appear/disappear with checkboxes):
    1. Executive Summary (prose paragraph with economic data)
    2. Ward Risk Analysis (Critical Zones 47 / At-Risk 89 cards)
    3. Economic Impact Profile (3 line items with ₹ values)
    4. Methane Emission Projection (dark card with tons reduced)
    5. Recommended Actions (4-item bullet list)
    6. Raw Data Tables (first 10 wards from ward_scores.json)
  - Footer: "CONFIDENTIAL REPORT GENERATED ELECTRONICALLY BY ASTRACITY"
- ✅ `@media print` CSS directives:
  - Config panel hidden during print
  - Preview expands to full width
  - Shadows/borders removed for clean PDF output
- ✅ Toast notification (Framer Motion animated):
  - "Report sent to bbmp@bruhat.org"
  - Auto-dismisses after 4 seconds

---

### SHARED — AI Query Bar

**File:** `components/layout/AIQueryBar.tsx` (~130 lines)

**Features implemented:**
- ✅ Fixed bottom bar, renders on ALL pages (mounted in `layout.tsx`)
- ✅ Dark glassmorphism panel (`bg-slate-900/90 backdrop-blur-xl`)
- ✅ Height: 64px normally, expands when response arrives
- ✅ Left: Teal "AI" badge pill
- ✅ Center: Text input with placeholder text
- ✅ Right: Teal arrow send button (disabled when empty)
- ✅ Enter key + click both trigger submission
- ✅ Loading state: 3 bouncing teal dots
- ✅ API Integration:
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
  - API key from `NEXT_PUBLIC_GEMINI_API_KEY`
  - System prompt: Bengaluru waste intelligence assistant, 1-2 sentences max, specific ward names, cost savings insights
- ✅ Response panel:
  - Slides up with Framer Motion animation
  - Teal left border accent
  - Sparkle icon
  - "X" dismiss button
  - Scrollable (max 40vh)
- ✅ Graceful error handling (missing API key, network failures)

---

### SHARED — Navbar

**File:** `components/layout/Navbar.tsx` (20 lines)

- ✅ Sticky top bar (`sticky top-0 z-50`)
- ✅ "AstraCity" brand link (teal, font-extrabold)
- ✅ Navigation links: Home | Map | Simulation | Impact | Wards | Report
- ✅ Hover effects (text → teal-600)
- ✅ White background with subtle border + shadow

---

## 6. Data Files

### `ward_scores.json`
20 sample wards with structure:
```json
{
  "id": 1,
  "name": "Koramangala",
  "zone": "South",
  "score": 80,
  "dumpRisk": 0.28,
  "methaneIntensity": 0.24,
  "routeEfficiency": 1.0,
  "complaintRate": 0.28,
  "trend": "down",
  "wasteTons": 133
}
```
**Zones:** North, South, East, West, Central (4 wards each)

### `dump_sites.json`
~50 dump site locations:
```json
{
  "id": 1,
  "lat": 12.9352,
  "lon": 77.6245,
  "risk": "high",
  "area_sqm": 1200,
  "ward": "Koramangala",
  "detected": "2024-01-15"
}
```

### `economic_params.json`
BBMP cost constants:
```json
{
  "costPerKmTruck": 20,
  "avgCleanupCostPerDump": 62000,
  "carbonPricePerTon": 2000,
  "laborCostPerHour": 180,
  "totalTrucks": 2800,
  "daysPerYear": 365,
  "baselineRouteKm": 48,
  "optimizedRouteKm": 31,
  "dumpsPreventedPerYear": 1240,
  "methaneReductionTons": 3400,
  "hoursSavedPerTruckPerDay": 1.8
}
```

### `simulation_lookup.json`
54 pre-computed simulation output combinations:
- Key format: `pop_{0-50}_rain_{low|normal|heavy}_festival_{none|diwali|ganesh}`
- Values: `wasteGenerated`, `dumpsPredicted`, `landfillInflow`, `methaneProjection`

### `bengaluru_wards.geojson`
GeoJSON FeatureCollection with 20 ward polygons:
- Generated by `generate_geojson.js` from `ward_scores.json`
- Each feature includes: `id`, `name`, `zone` properties
- Polygon coordinates arranged in a 4×5 grid centered on Bengaluru

---

## 7. Design System

### Color Palette (Light Theme)

| Token | Value | Usage |
|-------|-------|-------|
| `bg-slate-50` | `#f8fafc` | Page backgrounds |
| `bg-white` | `#ffffff` | Cards, panels |
| `text-slate-900` | `#0f172a` | Primary text |
| `text-slate-700` | `#334155` | Secondary text |
| `text-slate-500` | `#64748b` | Muted text |
| `text-teal-600` | `#0d9488` | Primary accent |
| `bg-teal-500` | `#14b8a6` | Buttons, badges |
| `text-rose-600` | `#e11d48` | High risk / danger |
| `text-amber-500` | `#f59e0b` | Medium risk / warning |
| `text-emerald-600` | `#059669` | Low risk / success |

### Typography
- **Font:** Inter (Google Fonts, loaded via `next/font`)
- **Weights:** Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800), Black (900)

### Component Patterns
- Cards: `bg-white border border-slate-200 rounded-3xl p-6 shadow-sm`
- Buttons: `bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl`
- Inputs: `bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500`
- Badges: `px-3 py-1 rounded-full text-xs font-bold`
- Dark panels: `bg-slate-900/90 backdrop-blur-xl border border-slate-700`

---

## 8. Known Issues & Future Upgrades

### Current Limitations
- Ward data is limited to 20 sample wards (blueprint targets 198)
- Simulation uses lookup table (not real-time ML computation)
- Route optimization lines are auto-generated from ward centroids (not real GPS data)
- Report PDF generation uses `window.print()` (browser-native, not programmatic jsPDF)
- No mobile responsive hamburger menu on Navbar
- AI Query Bar doesn't parse JSON actions to update map/tables (text-only responses)

### Recommended Upgrades

| Priority | Feature | Effort |
|----------|---------|--------|
| 🔴 High | Expand to 198 real BBMP wards with actual GeoJSON boundaries | ~2hrs |
| 🔴 High | Integrate actual satellite imagery processing pipeline | ~4hrs |
| 🟡 Medium | Add mobile responsive design (hamburger nav, stacked layouts) | ~2hrs |
| 🟡 Medium | Implement jsPDF programmatic export instead of `window.print()` | ~1hr |
| 🟡 Medium | Parse Gemini JSON actions to highlight wards / filter tables | ~2hrs |
| 🟢 Low | Add loading skeletons for all pages | ~1hr |
| 🟢 Low | Add sparkline charts in ward table (trend column) | ~1hr |
| 🟢 Low | Dark mode toggle | ~2hrs |
| 🟢 Low | Add BBMP complaint API integration | ~3hrs |

---

## 9. Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod

# Generate ward GeoJSON from ward_scores.json
node generate_geojson.js

# Lint
npm run lint
```

---

## 10. File Size Summary

| File | Lines | Bytes |
|------|-------|-------|
| `app/page.tsx` (Landing) | 311 | 10,391 |
| `app/simulation/page.tsx` | 320 | 18,526 |
| `app/impact/page.tsx` | 237 | 12,947 |
| `app/wards/page.tsx` | 402 | 19,738 |
| `app/report/page.tsx` | ~250 | ~12,000 |
| `app/layout.tsx` | 29 | 755 |
| `app/globals.css` | 83 | 2,029 |
| `components/map/MapContainer.tsx` | ~340 | ~12,500 |
| `components/map/LayerToggle.tsx` | 143 | 6,012 |
| `components/map/WardSidebar.tsx` | 293 | 11,488 |
| `components/layout/AIQueryBar.tsx` | ~130 | ~5,500 |
| `components/layout/Navbar.tsx` | 20 | 1,010 |
| `lib/store.ts` | 27 | 758 |
| `data/ward_scores.json` | 242 | 4,709 |
| `data/dump_sites.json` | ~300 | 5,602 |
| `data/economic_params.json` | 13 | 312 |
| `data/simulation_lookup.json` | 272 | 7,174 |
| `data/bengaluru_wards.geojson` | 705 | 12,440 |
| **Total** | **~3,900+** | **~140 KB** |

---

*AstraCity Implementation Documentation v1.0 — Built for Space Tech Hackathon, Bengaluru*
