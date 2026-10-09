import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();
const clientUrl = process.env.CLIENT_URL?.replace(/\/+$/, '');

app.use(helmet());
app.use(cors({
  origin: clientUrl || 'http://localhost:5173'
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;