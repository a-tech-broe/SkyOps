import { Router } from 'express';
import { aviationWeather } from '../services/aviationWeather';
import { getAirportCharts, getCurrentCycle } from '../services/charts';

const router = Router();

router.get('/:icao', async (req, res, next) => {
  try {
    const data = await aviationWeather.airport(req.params.icao);
    res.json(data[0] ?? null);
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

    const cycle  = getCurrentCycle();
    const charts = await getAirportCharts(upper);
    res.json({ cycle, charts });
  } catch (err) {
    next(err);
  }
});

export default router;
