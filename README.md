# Rupee Radar Desk

Build a responsive Indian stock market intelligence web app (desktop & mobile) in a crisp White Financial Newspaper theme using global 'Comic Sans MS', 'Comic Neue', cursive, sans-serif font. Name it 'MY MARKET DESK'. Include:

Top Bar: Live ticker (NIFTY 50, SENSEX, BANK NIFTY, INDIA VIX, DOW JONES), Language switcher (Hinglish, Pure Hindi, Pure English), a dedicated '🎙️ Voice Settings' tab (to test and pick natural Hindi/Indian English voices), and '5-Min Morning Audio Brief' button.

Pulse Bar: 'What Changed Today?' counter and 'Market Noise Meter' based on India VIX.

Smart News Cards: Show ONLY Headline, upload time, Source Name, Quality Score (out of 5), Verification status (hide Bull/Bear & Impact if Source Conflict/Pending), Signal/Watch/Noise tag, Portfolio Relevance (0-100), Valuation 'Priced-In' Meter (Current P/E vs 5Y Median), 3-bullet TLDR, clickable financial terms (pop-up dictionary), and an expandable 'Deep Dive ▼' (Impact, Winners/Losers, Bull/Bear Case, Thesis tag, Historic Pattern Finder, Story Timeline).

Clean Card Audio: Show ONLY a 'Listen' button initially; when playing/paused, expand a bar with true Pause/Resume (from exact spot), Stop, and a smooth 1.0x–2.0x (0.1x step) speed slider. Read ONLY Headline + TLDR.

Left Menu & Right Sidebar: Left tabs (Command Center, My Portfolio, Theme Exposure, Dual Event Calendar, Smart Money & Heatmaps, Feed Preferences with BSE/NSE Filings Only toggle). Right widgets (Instant Red Flag Alerts, Weekly Portfolio Health Score, Morning/Evening Market Brief, Smart Money FII/DII & Sector Heatmap). Dual Calendar must separate Watchlist events from General Market events.

My Portfolio & Theme Exposure: '+ Add/Edit Stock' (with Buy Date, Conviction, Buying Reason, Pre-Mortem Failure Risks), Position Sizing Assistant (8-12% High / 4-7% Med / 1-3% Low), Theme Concentration warning (>35%), and STCG/LTCG Tax Check based on Buy Date.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rupee-radar-desk.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/70a8523a-5ec8-44f1-81c5-fa984aa5d39a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
