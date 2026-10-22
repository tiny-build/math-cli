# @tiny-build/poem-site

A scroll-driven 3D poem for Math: a low-poly pink valley whose weather follows the verses. It starts as a gloomy sky full of bugs, then comes sunrise, clouds, December snow and a field of floating question marks, and it ends on a golden sunburst.

Built with [Vite](https://vite.dev) and [three.js](https://threejs.org), using plain HTML, CSS and JS. It is hosted on GitHub Pages.

## Develop

```bash
pnpm site:dev        # or: pnpx nx run @tiny-build/poem-site:dev
pnpm site:build      # production build → packages/poem-site/dist
pnpm site:preview    # build + serve dist locally
```

| Nx target | What it does                                                             |
| --------- | ------------------------------------------------------------------------ |
| `dev`     | Vite dev server (also exposed on your LAN so you can test on a phone)    |
| `build`   | Production build into `dist/`                                            |
| `preview` | Builds, then serves `dist/`                                              |
| `lint`    | Biome check                                                              |
| `og`      | Re-renders `public/og-image.png` + touch icon from SVG (needs `rsvg-convert`) |
| `deploy`  | Builds, then pushes `dist/` to the `gh-pages` branch                     |

## Where things live

- `index.html`: the poem text, Open Graph tags and page structure
- `src/main.js`: maps scroll position to a smoothed 0→1 progress value and reveals the lines word by word
- `src/mood.js`: weather keyframes (sky, fog, sun, snow, bugs and so on) keyed to that progress value
- `src/scene.js`: the three.js world (terrain, trees, clouds, sun rays, particles)
- `scripts/og-image.svg`: source for the link-preview card

If you change the stanza timing in `main.js`, move the keyframes in `mood.js` to match.

## Publish to GitHub Pages

### Option A: GitHub Actions (recommended)

1. Push to GitHub.
2. Go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Push to `main`. The [`Deploy poem site`](../../.github/workflows/poem-site.yml) workflow runs on any change under `packages/poem-site/`. You can also start it by hand from the Actions tab.

The workflow reads the base path and public URL from `actions/configure-pages`. That means asset paths and Open Graph URLs stay correct after a repo rename or a switch to a custom domain.

### Option B: from your machine (`gh-pages` branch)

```bash
pnpm site:deploy
```

Then set **Settings → Pages → Source** to **Deploy from a branch** with branch `gh-pages` and folder `/ (root)`.

### URLs and base path

By default the site builds for `https://tiny-build.github.io/demo-repository/`. You can override this when building:

```bash
BASE_PATH=/my-repo/ SITE_URL=https://me.github.io/my-repo/ pnpm site:build
# custom domain:
BASE_PATH=/ SITE_URL=https://poem.example.com/ pnpm site:build
```

`SITE_URL` must be absolute, because link-preview scrapers ignore relative `og:image` URLs.

## Link preview

The `og:image` is `public/og-image.png` (1200×630). To change it, edit `scripts/og-image.svg` and run `pnpx nx run @tiny-build/poem-site:og`. After deploying, you can check the preview with [opengraph.xyz](https://www.opengraph.xyz) or LinkedIn's Post Inspector.
