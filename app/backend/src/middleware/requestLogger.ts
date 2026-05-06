import { Request, Response, NextFunction } from 'express';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const ip = (req.headers['x-real-ip'] as string) || req.ip || '';
    const cleanIp = ip.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIp);
    const ua = new UAParser(req.headers['user-agent']).getResult();

    const log = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      ip: cleanIp,
      country: geo?.country ?? null,
      region: geo?.region ?? null,
      city: geo?.city ?? null,
      browser: ua.browser.name ?? null,
      browser_version: ua.browser.version ?? null,
      os: ua.os.name ?? null,
      device: ua.device.type ?? 'desktop',
    };

    process.stdout.write(JSON.stringify(log) + '\n');
  });

  next();
}
