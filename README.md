<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/5b9be166-ca15-4aea-b1ca-3e55d2910411

## Run Locally

**Prerequisites:** Node.js, Python 3.11+

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🚀 Deploy to Production

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
```bash
# Run the deployment script
./deploy.sh
```

This will guide you through deploying to Vercel (frontend) and Render (backend).

### Single Live URL (Frontend + API)
When deployed to Vercel, your app is available from a single URL (e.g. `https://your-app.vercel.app`). All API calls are served under `/api/*` on the same domain, and the Vercel serverless functions proxy those requests to the Python backend (Railway).

✅ **What you need to set in Vercel:**
- `PYTHON_BACKEND_URL`: Your Railway backend URL (e.g. `https://your-railway-app.railway.app`)
- `GEMINI_API_KEY`: Your Gemini API key
