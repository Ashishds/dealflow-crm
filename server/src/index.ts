import express from 'express';
import cors from 'cors';
import { getDb } from './db';
import accountsRouter from './routes/accounts';
import peopleRouter from './routes/people';
import opportunitiesRouter from './routes/opportunities';
import interactionsRouter from './routes/interactions';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB on startup
getDb();

// Routes
app.use('/api/accounts', accountsRouter);
app.use('/api/people', peopleRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/interactions', interactionsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ MyContacts CRM API running on http://localhost:${PORT}`);
});

export default app;
