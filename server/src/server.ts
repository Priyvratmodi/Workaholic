import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    console.error('❌ FATAL: DATABASE_URL environment variable is missing in production!');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is missing in production!');
    process.exit(1);
  }
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Workaholic Server running on http://localhost:${PORT}`);
});
