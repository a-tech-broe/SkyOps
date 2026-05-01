import { Router } from 'express';
import { aviationWeather } from '../services/aviationWeather';

const router = Router();

router.get('/:icao', async (req, res, next) => {
  try {
    const data = await aviationWeather.airport(req.params.icao);
    res.json(data[0] ?? null);
  } catch (err) {
    next(err);
  }
});

export default router;
