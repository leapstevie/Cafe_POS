import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    allowedHosts: [
      'congress-contribution-information-recall.trycloudflare.com'
    ]
  }
});
