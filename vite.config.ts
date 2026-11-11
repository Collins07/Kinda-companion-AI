import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { handleApiRequest } from './src/server/apiRouter';

function apiBackendPlugin(): Plugin {
  return {
    name: 'api-backend-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
          const method = req.method || 'GET';

          let bodyData: any = null;
          if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            bodyData = await new Promise<any>((resolve) => {
              let raw = '';
              req.on('data', (chunk: Buffer | string) => {
                raw += chunk.toString();
              });
              req.on('end', () => {
                if (!raw.trim()) return resolve(null);
                try {
                  resolve(JSON.parse(raw));
                } catch {
                  resolve(raw);
                }
              });
              req.on('error', () => resolve(null));
            });
          }

          const result = await handleApiRequest(method, url.pathname, url.searchParams, bodyData);
          res.statusCode = result.status;
          if (result.headers) {
            for (const [k, v] of Object.entries(result.headers)) {
              res.setHeader(k, v);
            }
          }
          if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', typeof result.body === 'string' ? 'text/plain' : 'application/json');
          }
          res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body));
        } catch (err: any) {
          console.error('[Vite API Middleware Error]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
