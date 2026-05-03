import { Router } from 'express';
import { aviationWeather } from '../services/aviationWeather';
import { getAirportCharts } from '../services/charts';

const router = Router();

router.get('/:icao', async (req, res, next) => {
  try {
    const icao = req.params.icao.toUpperCase();
    const [airportRes, metarRes] = await Promise.allSettled([
      aviationWeather.airport(icao),
      aviationWeather.metar(icao),
    ]);

    const airport = airportRes.status === 'fulfilled' ? (airportRes.value[0] ?? null) : null;
    if (!airport) return res.json(null);

    if (metarRes.status === 'fulfilled' && metarRes.value[0]) {
      (airport as Record<string, unknown>).metar = (metarRes.value[0] as { rawOb: string }).rawOb;
    }

    res.json(airport);
  } catch (err) {
    next(err);
  }
});

router.get('/:icao/charts', async (req, res, next) => {
  try {
    const { icao } = req.params;
    const upper = icao.toUpperCase();

    // FAA d-TPP only covers US/territories — K, P, A prefixes
    if (!/^[KPA]/i.test(upper)) {
      return res.json({ cycle: null, charts: [], international: true });
    }

    const { charts, cycle } = await getAirportCharts(upper);
    res.json({ cycle, charts });
  } catch (err) {
    next(err);
  }
});

export default router;
