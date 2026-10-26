import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authMiddleware } from './server/middleware/auth';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import API routers
import authRouter from './server/routes/auth';
import dashboardRouter from './server/routes/dashboard';
import findingsRouter from './server/routes/findings';
import productsRouter from './server/routes/products';
import ordersRouter from './server/routes/orders';
import alertsRouter from './server/routes/alerts';
import shopifyRouter from './server/routes/shopify';
import adminRouter from './server/routes/admin';

import http from 'http';

export async function createServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

  // Standard middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'ALLOWALL'); // Needed for Shopify Embedded Admin App Bridge
    next();
  });

  // Health check endpoint (Section 24 requirement)
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'ProfitShield API',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Public / Auth routes
  app.use('/api/auth', authRouter);
  app.use('/api/shopify', shopifyRouter);

  // Protected application routes
  app.use('/api/dashboard', authMiddleware, dashboardRouter);
  app.use('/api/findings', authMiddleware, findingsRouter);
  app.use('/api/products', authMiddleware, productsRouter);
  app.use('/api/orders', authMiddleware, ordersRouter);
  app.use('/api/alerts', authMiddleware, alertsRouter);
  app.use('/api/admin', authMiddleware, adminRouter);

  // Catch-all 404 for unhandled API routes (preventing SPA fallback on API endpoints)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
  });

  // Frontend integration: Vite middleware in development or static in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server },
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');

    // If dist/index.html does not exist on startup, trigger build as safety net
    if (!fs.existsSync(indexPath)) {
      console.warn(`[ProfitShield] Production build not found at ${indexPath}. Triggering build now...`);
      try {
        execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
        console.log('[ProfitShield] Production build completed successfully.');
      } catch (err: any) {
        console.error('[ProfitShield Error] Automated build failed:', err.message);
      }
    }

    app.use(express.static(distPath));

    app.get('*', (req: Request, res: Response) => {
      // Ensure API endpoints return 404 rather than serving index.html
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found', path: req.path });
      }

      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            res.status(500).send('Error serving application frontend.');
          }
        });
      } else {
        res.status(503).send(
          'Frontend build not found. Please ensure "npm run build" ran before starting the server.'
        );
      }
    });
  }

  return { app, server, PORT };
}

// Start server if executed directly (not in test runner)
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  createServer().then(({ server, PORT }) => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[ProfitShield] Server running at http://0.0.0.0:${PORT}`);
    });
  }).catch((err) => {
    console.error('[ProfitShield] Failed to start server:', err);
  });
}
