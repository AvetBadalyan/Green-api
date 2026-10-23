import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Inject <link rel="preload"> for every .woff2 font in the build.
// Fonts are deep in the network dependency tree (discovered after CSS is parsed).
// Preloading moves them to the start of the critical path so they're ready before FCP.
function fontPreloadPlugin() {
  return {
    name: 'font-preload',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        return Object.keys(ctx.bundle)
          .filter((key) => key.endsWith('.woff2'))
          .map((key) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              crossorigin: true,
              href: `/${key}`,
            },
            injectTo: 'head',
          }));
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fontPreloadPlugin()],
});
