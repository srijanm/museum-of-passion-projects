import { defineConfig } from 'astro/config';

// Static output, zero client-side JavaScript.
// The entire site renders from src/data/works.json.
export default defineConfig({
  site: 'https://museum-of-passion-projects.vercel.app',
  output: 'static',
});
