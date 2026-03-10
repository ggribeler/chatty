import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhook';
import authRoutes from './routes/auth';
import accountRoutes from './routes/account';
import conversationsRoutes from './routes/conversations';

dotenv.config();

console.log('=== Chatty Server Starting ===');
console.log('Environment variables:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL);
console.log('  META_APP_ID:', process.env.META_APP_ID);
console.log('  META_APP_SECRET:', process.env.META_APP_SECRET);
console.log('  WEBHOOK_VERIFY_TOKEN:', process.env.WEBHOOK_VERIFY_TOKEN);
console.log('  PORT:', process.env.PORT);
console.log('==============================');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', webhookRoutes);
app.use('/', authRoutes);
app.use('/', accountRoutes);
app.use('/', conversationsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
