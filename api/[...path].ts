// Vercel Serverless API handler - proxies all /api/* requests to the Python backend
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Build the target URL by forwarding the full path
  const path = req.url || '/';
  const targetUrl = `${PYTHON_BACKEND_URL}${path}`;

  try {
    // Forward the request to the Python backend
    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers['x-api-key'] ? { 'x-api-key': req.headers['x-api-key'] as string } : {}),
      },
    };

    // Forward body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('API Proxy Error:', error);
    return res.status(502).json({
      error: 'Backend unavailable',
      message: error.message,
      backend_url: PYTHON_BACKEND_URL,
    });
  }
}
