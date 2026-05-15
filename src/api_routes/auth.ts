import { Router } from 'express';

const router = Router();

router.get('/google/auth', (req, res) => {
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
    access_type: 'offline',
  });
  res.redirect(googleAuthUrl);
});

router.get('/microsoft/auth', (req, res) => {
  const microsoftAuthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID || '',
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/microsoft`,
    response_type: 'code',
    scope: 'openid email profile Mail.Read Mail.Send',
  });
  res.redirect(microsoftAuthUrl);
});

router.post('/imap/connect', (req, res) => {
  try {
    const { host, port, username, password } = req.body;
    console.log('IMAP connection:', { host, port, username });
    res.json({ success: true, message: 'IMAP connection configured' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to IMAP' });
  }
});

router.get('/session', (req, res) => {
  res.json({ user: null, authenticated: false });
});

export default router;