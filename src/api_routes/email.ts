import { Router } from 'express';

const router = Router();

router.get('/emails', async (req, res) => {
  try {
    const { accountId, since, limit } = req.query;
    console.log('GET /api/emails', { accountId, since, limit });
    res.json({ emails: [], message: 'Email fetch endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.post('/emails/send', async (req, res) => {
  try {
    const { to, subject, body, accountId } = req.body;
    console.log('POST /api/emails/send', { to, subject, body, accountId });
    res.json({ success: true, message: 'Email sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.patch('/emails/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PATCH /api/emails/:id/read', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.post('/emails/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('POST /api/emails/:id/archive', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive email' });
  }
});

router.delete('/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE /api/emails/:id', id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

export default router;