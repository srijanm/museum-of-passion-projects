# Museum of Passion Projects

A static museum of small works made for their own sake. Built with [Astro](https://astro.build), static output, zero client-side JavaScript.

## Architecture

The entire site renders from a single source of truth: [`src/data/works.json`](src/data/works.json).

Each work is one object with these placard fields:

| field       | meaning                                                            |
| ----------- | ----------------------------------------------------------------- |
| `title`     | name of the work                                                  |
| `year`      | e.g. `2025` or `2025–ongoing`                                      |
| `medium`    | the materials line                                                 |
| `accession` | catalogue number, format `MPP.YYYY.NNN`                           |
| `credit`    | `Collection of the Museum` or `On loan from the artists`          |
| `status`    | `on view`, `upcoming`, or `in storage`                            |
| `url`       | where the work lives                                              |
| `image`     | path to a screenshot under `public/` (e.g. `/works/mpp-2025-004.png`) |
| `note`      | the curator's note                                                |

## Adding a future work

1. Add a screenshot to `public/works/` (any web image format).
2. Append one object to `src/data/works.json` with the next accession number and the image path.

No code changes are required. The gallery, placards, and counts all derive from the JSON.

> The current screenshots are SVG stand-ins. Replace any `public/works/*.svg` with a real
> screenshot and update that work's `image` path.

## Develop

```sh
npm install
npm run dev      # local preview
npm run build    # static build to dist/
```

## Pages

- `/` — the gallery: Permanent Collection, Upcoming Exhibitions, Storage.
- `/about` — the colophon.
