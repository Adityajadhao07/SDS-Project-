import { Router } from 'express';
import { checkDbConnection } from '../db/pool.js';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbDetails = null;

  try {
    const dbInfo = await checkDbConnection();
    dbStatus = 'connected';
    dbDetails = dbInfo.db_name;
  } catch (error) {
    dbStatus = `error: ${error.message}`;
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      name: dbDetails,
    },
  });
});

export default router;
