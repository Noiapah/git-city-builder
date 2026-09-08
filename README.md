# GitHub City

Turn a GitHub user's contribution history into an interactive 3D city. Each day is a plot; each contribution adds exactly one floor.

## Screenshot

Screenshot placeholder: the landing page features an interactive, clearly labeled sample city in a soft green architectural style.

## Features

- Search a GitHub username and choose any year from 2008 through the current year.
- Live contribution data through a backend-only GitHub GraphQL integration.
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

3. Create a GitHub personal access token using [GitHub's token setup instructions](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). Use access appropriate to the contribution data you intend to read. Private activity visibility depends on GitHub profile settings and the token's permissions; this application does not request repository contents.
4. Copy the environment template:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

5. Replace `your_github_token_here` in `server/.env` with your token. Never put it in the client or a `VITE_` variable. `.env` files are ignored by Git.
6. Start both apps from the root:

   ```powershell
   npm run dev
   ```

7. Open **http://localhost:5173**, enter **Noiapah**, choose **2026**, and click **Build City**. You can also open **http://localhost:5173/Noiapah/2026** directly.

Restart the backend after changing `server/.env`. No visitor sign-in is required; the application operator supplies the backend token.

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

Run `npm run test:e2e` for browser checks with installed Google Chrome; the command starts dev servers if needed. Tests use fixture API responses and save desktop/mobile screenshots to `artifacts/`. They test the real Three.js canvas, hover/click inspection, search, year switching, loading, direct links, and empty/error states. Live authenticated GitHub requests require your token and are not covered by the fixture tests. Change `channel` in `playwright.config.ts` if using a different Playwright-supported browser. Run `npm run format` to format the source and documentation.

## Environment variables

| Variable       | Location      | Purpose                                             |
| -------------- | ------------- | --------------------------------------------------- |
| `GITHUB_TOKEN` | `server/.env` | GitHub API authentication; required for real cities |
| `PORT`         | `server/.env` | Backend port; defaults to 3000                      |

If you change `PORT` during development, update the proxy target in `client/vite.config.ts` too. No environment file is required to explore the landing-page sample.

## Architecture

```text
client/src/
  components/   Search form, city canvas, day detail
  services/     Backend client and illustrative sample data
  three/        Scene lifecycle, calendar geometry, camera, visual constants
  views/        Landing page and routed user city
server/src/
  routes/       Username/year validation and HTTP errors
  services/     GitHub GraphQL request and calendar normalization
  app.ts        Express configuration and production SPA serving
  index.ts      Environment loading and server startup
shared/
  github.ts     Shared types and UTC calendar generation
```

The browser calls `GET /api/github/:username/contributions?year=YYYY`. Vite proxies `/api` to Express in development. Express calls `https://api.github.com/graphql` with the server token, then returns only `{ username, year, totalContributions, days }`. Each day contains `{ date, weekday, week, contributions }`. Dates outside the selected year are excluded; missing days become empty plots. Totals are summed from the rendered days.

The query uses GitHub's [`contributionsCollection` and `contributionCalendar`](https://docs.github.com/en/graphql/reference/users). Only activity visible to the token is returned. The current year's future days stay empty.

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

- **GitHub access is not configured:** create `server/.env`, set the token, and restart the server.
- **Invalid or expired token:** replace the backend token and check its access.
- **Rate limit / restricted access:** wait and retry; verify GitHub token and organization policies.
- **Backend unavailable:** ensure `npm run dev` starts both processes and ports 3000/5173 are available.
- **No contributions:** empty plots are expected; try another year. Private activity may not be visible.
- **WebGL unavailable:** enable browser hardware acceleration or use a WebGL-capable browser.

## Future ideas

Repository colors and per-floor attribution; footprint based on changed files/lines; pull request rooftops and issue structures; monthly districts and roads; chronological construction and time-lapse controls; adjacent yearly cities and user comparison; richer statistics; screenshot sharing; GLTF, OBJ, and STL export for 3D printing. These are intentionally outside the MVP.
