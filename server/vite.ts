import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ["all", "localhost", "127.0.0.1", "sekondly.app", "www.sekondly.app"],
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...serverOptions,
      host: "0.0.0.0",
      allowedHosts: ["all", "localhost", "127.0.0.1", "sekondly.app", "www.sekondly.app"],
    },
    appType: "custom",
  });

  app.use((req, res, next) => {
    // Skip Vite middleware for API routes
    if (req.originalUrl.startsWith('/api/')) {
      return next();
    }
    vite.middlewares(req, res, next);
  });
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip HTML serving for API routes
    if (url.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  const staticLandingPath = path.resolve(__dirname, "static-landing.html");

  // Serve static assets (like images, CSS, JS) from the dist directory if it exists
  if (fs.existsSync(distPath)) {
    app.use('/assets', express.static(path.join(distPath, 'assets')));
  }

  // Serve uploads directory for images
  app.use('/uploads', express.static(path.resolve(__dirname, "..", "uploads")));

  // Serve favicon from client/public directory
  const faviconPath = path.resolve(__dirname, "..", "client", "public", "favicon.png");
  app.get('/favicon.png', (_req, res) => {
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      res.status(404).send('Favicon not found');
    }
  });

  // Also serve favicon at /assets/favicon.png for the landing page
  app.get('/assets/favicon.png', (_req, res) => {
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      res.status(404).send('Favicon not found');
    }
  });

  // Define web app routes that should serve the React app
  const webAppRoutes = [
    '/admin',
    '/admin-login', 
    '/admin-panel',
    '/profile',
    '/user',
    '/edit-profile',
    '/notification-settings'
  ];

  // Serve React app for web app routes
  webAppRoutes.forEach(route => {
    app.get(`${route}*`, (_req, res) => {
      if (fs.existsSync(distPath)) {
        res.sendFile(path.resolve(distPath, "index.html"));
      } else {
        res.status(404).send('Web app not built. Run `npm run build` first.');
      }
    });
  });

  // Route for web app (if needed for specific paths like /app)
  app.get('/app*', (_req, res) => {
    if (fs.existsSync(distPath)) {
      res.sendFile(path.resolve(distPath, "index.html"));
    } else {
      res.status(404).send('Web app not built. Run `npm run build` first.');
    }
  });

  // Serve the static landing page for the root route and other unmatched routes
  app.use("*", (req, res) => {
    // If it's an API route, skip to next middleware
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    if (fs.existsSync(staticLandingPath)) {
      res.sendFile(staticLandingPath);
    } else {
      res.status(404).send('Landing page not found at: ' + staticLandingPath);
    }
  });
}
