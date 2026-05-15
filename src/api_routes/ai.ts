import { Router } from 'express';
import { claudeClient } from '@/lib';

const router = Router();

router.post('/summarize', async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Emails array required' });
    }
    const summary = await claudeClient.summarizeEmails(emails);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize emails' });
  }
});

router.post('/draft', async (req, res) => {
  try {
    const { emailContent, context } = req.body;
    if (!emailContent) {
      return res.status(400).json({ error: 'Email content required' });
    }
    const draft = await claudeClient.draftReply(emailContent, context);
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ error: 'Failed to draft reply' });
  }
});

router.post('/prioritize', async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Emails array required' });
    }
    const priorities = await claudeClient.prioritizeEmails(emails);
    res.json({ priorities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to prioritize emails' });
  }
});

export default router;