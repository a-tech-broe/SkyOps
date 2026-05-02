import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram, collectDefaultMetrics, register } from 'prom-client';

collectDefaultMetrics({ prefix: 'skyops_' });

const httpRequests = new Counter({
  name: 'skyops_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpDuration = new Histogram({
  name: 'skyops_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

function normalizePath(path: string): string {
  return path
    .replace(/\/api\/(weather\/(metar|taf|pireps)|notams|airports)\/[^/]+/, '/api/$1/:icao')
    .replace(/\?.*$/, '');
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = normalizePath(req.path);

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequests.inc({ method: req.method, path, status: String(res.statusCode) });
    httpDuration.observe({ method: req.method, path }, duration);
  });

  next();
}

export { register };
