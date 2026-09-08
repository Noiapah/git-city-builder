# GitHub City

Turn a GitHub user's contribution history into an interactive 3D city. Each day is a plot; each contribution adds exactly one floor.

## Screenshot

Screenshot placeholder: the landing page features an interactive, clearly labeled sample city in a soft green architectural style.

## Features

- Search a GitHub username and choose any year from 2008 through the current year.
- Public contribution data fetched directly from GitHub's calendar. No token, account connection, or sign-in required.
- Complete 365- or 366-day calendars, including empty and future plots.
- Exact contribution heights with secondary green intensity colors.
- Rotate, zoom, pan, reset the camera, and inspect dates by hovering or clicking.
- Shareable `/:username/:year` routes, including direct page loads.
- Responsive canvas, loading, retry, empty states, validation, and readable API errors.
- Interactive sample on the landing page works without a token. Sample data is never substituted for a real user's contributions.

## Tech stack

Vue 3, Vue Router, TypeScript, Vite, Three.js, Node.js, Express. npm workspaces keep frontend and backend in one repository.

## Setup

Use Node.js 22.12+ (Node 24 recommended), npm, and a browser with WebGL enabled.

1. Clone this repository and open its directory in VS Code or PowerShell.
2. Install all workspace dependencies from the repository root:

   ```powershell
   npm install
   ```

3. Start both apps from the root:

   ```powershell
   npm run dev
   ```

4. Open **http://localhost:5173**, enter a GitHub username, and click **Build City**. The year defaults to the current year and can be changed. You can also open **http://localhost:5173/Noiapah/2026** directly.

No `.env` file or GitHub token is needed. If you previously configured `GITHUB_TOKEN`, it is no longer used and can be removed from your local environment file.

## Commands

| Command              | Purpose                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`        | Start Vite and Express together; Ctrl+C stops both                               |
| `npm run dev:client` | Start only Vite on port 5173                                                     |
| `npm run dev:server` | Start only Express on port 3000                                                  |
| `npm run build`      | Type-check and build both workspaces                                             |
| `npm test`           | Test calendar normalization, API errors/validation, geometry, and camera framing |
| `npm start`          | Serve the built frontend and API at http://127.0.0.1:3000                        |

Run `npm run build` before `npm start`. Express serves the SPA fallback so direct city links work in the production build too. The server binds to loopback for local use.

Run `npm run test:e2e` for browser checks with installed Google Chrome; the command starts dev servers if needed. Tests use fixture API responses and save desktop/mobile screenshots to `artifacts/`. They test the real Three.js canvas, hover/click inspection, search, year switching, loading, direct links, and empty/error states. The opt-in live browser test fetches GitHub's public calendar through the real backend: in PowerShell run `$env:LIVE_GITHUB='1'` followed by `npm run test:e2e`, then `Remove-Item Env:LIVE_GITHUB`. Change `channel` in `playwright.config.ts` if using a different Playwright-supported browser. Run `npm run format` to format the source and documentation.

## Environment variables

`PORT` is optional and defaults to 3000. To change it, copy `server/.env.example` to `server/.env`, edit `PORT`, and restart the server. If you change it during development, update the proxy target in `client/vite.config.ts` too. `.env` files remain ignored by Git.

## Architecture

```text
client/src/
  components/   Search form, city canvas, day detail
  services/     Backend client and illustrative sample data
  three/        Scene lifecycle, calendar geometry, camera, visual constants
  views/        Landing page and routed user city
server/src/
  routes/       Username/year validation and HTTP errors
  services/     Public GitHub HTML fetch, parsing, caching, and normalization
  app.ts        Express configuration and production SPA serving
  index.ts      Environment loading and server startup
shared/
  github.ts     Shared types and UTC calendar generation
```

The browser calls `GET /api/github/:username/contributions?year=YYYY`. Vite proxies `/api` to Express in development. Express fetches `https://github.com/users/:username/contributions?from=YYYY-01-01&to=YYYY-12-31` as public HTML without credentials or third-party services, then returns only `{ username, year, totalContributions, days }`. Each day contains `{ date, weekday, week, contributions }`.

Cheerio parses calendar cells and their associated tooltips to obtain exact counts; color intensity is never used to estimate height. Dates outside the selected year are excluded, absent future days become empty plots, and totals are summed from the rendered days. Missing past days or unrecognized counts produce a readable error instead of misleading zero activity. Successful results are cached in memory for 15 minutes (up to 100 cities), and simultaneous requests for the same user/year share one upstream request. Restarting the backend clears the cache.

This reads the contribution calendar visible to a signed-out visitor. It cannot access hidden private activity or repository details. GitHub may include anonymized private contribution counts when a user's profile makes them public. The HTML endpoint is not a stable, documented API: markup changes may require a parser update, and GitHub may throttle requests.

Three.js maps weeks to X, weekdays to Z, and contributions to Y. Change dimensions and colors in `client/src/three/constants.ts`; height defaults to `contributions × 0.35` and is never capped or logarithmic. Shared geometry/materials are disposed when cities are replaced or the viewer unmounts. A single animation loop drives damping and rendering; ResizeObserver updates and reframes the canvas.

## Controls

- Left-drag / one-finger drag: rotate.
- Scroll / pinch: zoom; on-screen + and − buttons also work.
- Right-drag or Ctrl/Command-drag / two-finger drag: pan.
- Focus the canvas and use arrow keys to pan.
- Hover a building or plot: date and contribution count. Click/tap to pin; × closes the details.
- Crosshair button: fit the complete city back into view.

These gestures use [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).

## Troubleshooting

- **Calendar could not be read:** GitHub may be temporarily blocking requests or may have changed its HTML. Retry later; persistent failures may need a parser update.
- **Rate limit:** wait and retry. Successful city data is cached for 15 minutes to reduce requests.
- **Backend unavailable:** ensure `npm run dev` starts both processes and ports 3000/5173 are available.
- **No contributions:** empty plots are expected; try another year. Private activity may not be visible.
- **WebGL unavailable:** enable browser hardware acceleration or use a WebGL-capable browser.

## Future ideas

Repository colors and per-floor attribution; footprint based on changed files/lines; pull request rooftops and issue structures; monthly districts and roads; chronological construction and time-lapse controls; adjacent yearly cities and user comparison; richer statistics; screenshot sharing; GLTF, OBJ, and STL export for 3D printing. These are intentionally outside the MVP.
