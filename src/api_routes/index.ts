import { Router } from 'express';
import emailRoutes from './email';
import aiRoutes from './ai';
import authRoutes from './auth';

const router = Router();

router.use('/emails', emailRoutes);
router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;