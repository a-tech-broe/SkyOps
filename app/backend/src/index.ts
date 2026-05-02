import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import weatherRouter from './routes/weather';
import notamsRouter from './routes/notams';
import airportsRouter from './routes/airports';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware, register } from './middleware/metrics';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'SkyOps API' }));
app.get('/metrics', async (_, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/weather', weatherRouter);
app.use('/api/notams', notamsRouter);
app.use('/api/airports', airportsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SkyOps API running on port ${PORT}`);
});
