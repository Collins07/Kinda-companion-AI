/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { handleApiRequest } from './src/server/apiRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Meta WhatsApp Webhook verification and all /api routes
app.all('/api/*', async (req, res) => {
  try {
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const url = new URL(fullUrl);
    const result = await handleApiRequest(req.method, url.pathname, url.searchParams, req.body);

    res.status(result.status);
    if (result.headers) {
      for (const [k, v] of Object.entries(result.headers)) {
        res.setHeader(k, v);
      }
    }
    if (typeof result.body === 'string') {
      res.send(result.body);
    } else {
      res.json(result.body);
    }
  } catch (error: any) {
    console.error('[Server API Error]', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Serve static frontend assets in production build
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Kinda Care AI Server running on http://localhost:${PORT}`);
  console.log(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/api/webhook/whatsapp`);
});
