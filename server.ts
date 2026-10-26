import express, { Request, Response } from 'express';
import path from 'path';
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
  const isProd = process.env.NODE_ENV === 'production';

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
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
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
