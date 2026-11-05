# GitScope

Explore any public GitHub profile: avatar and bio, star/fork/issue totals, a language donut, a repos-by-stars chart, a contribution heatmap built from public events, a searchable repository browser with README previews, and a recent activity feed.

**Live site:** https://pixelpioneer08-oss.github.io/gitscope/ — open a profile directly with `?user=torvalds`.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix primitives) · Recharts · lucide-react · DOMPurify · sonner

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs dist/
npm run typecheck
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to GitHub Pages (Settings → Pages → Source: GitHub Actions).

## Notes

- Data comes from GitHub's public REST API, called directly from the browser. Anonymous use is limited to 60 requests per hour; one profile takes about 3–9. The key button in the header stores an optional personal access token in `localStorage` to raise the limit to 5,000.
- GitHub's events API only covers roughly the last 90 days, so the heatmap shows the last 20 weeks.
- The repo list API reports `watchers_count` equal to stars; the repo drawer fetches the real watcher count (`subscribers_count`).
- Language stats count each repository's primary language.
