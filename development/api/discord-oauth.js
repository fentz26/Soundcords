// Vercel API route for Discord OAuth
// This keeps the client secret secure on the server

export default async function handler(req, res) {
  // Enable CORS for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return a simple response for GET requests (for testing/health check)
    return res.status(200).json({ 
      message: 'Discord OAuth endpoint is working',
      status: 'ready'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Missing code or redirectUri' });
    }

    // Discord OAuth configuration
    const clientId = '1400634915942301806';
    const clientSecret = process.env.DISCORD_CLIENT_SECRET; // Set in Vercel environment variables

    if (!clientSecret) {
      console.error('DISCORD_CLIENT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorData);
      return res.status(400).json({ 
        error: 'Token exchange failed',
        details: errorData
      });
    }

    const tokenData = await tokenResponse.json();

    // Get user info with the access token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info:', userResponse.status);
      return res.status(400).json({ error: 'Failed to get user info' });
    }

    const userInfo = await userResponse.json();

    // Return user info and token (extension will handle storage)
    res.status(200).json({
      success: true,
      userInfo: userInfo,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    });

  } catch (error) {
    console.error('OAuth handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 