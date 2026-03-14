# 🚀 Deployment Guide

## Live Website Deployment

This guide will help you deploy the Health Insurance Fraud Detection app to create a live website.

## 📋 Prerequisites

- GitHub account
- Vercel account (for frontend)
- Render account (for backend)

## 🔧 Step 1: Prepare for Deployment

### 1.1 Update Environment Variables

Create `.env` files for production:

**Frontend (.env.production):**
```
PYTHON_BACKEND_URL=https://your-backend-url.onrender.com
GEMINI_API_KEY=your_gemini_api_key
```

**Backend (.env):**
```
GEMINI_API_KEY=your_gemini_api_key
```

### 1.2 Test Build Locally

```bash
# Frontend build test
npm run build
npm run preview

# Backend test
cd python-backend
python main.py
```

## 🌐 Step 2: Deploy Backend (Render)

### 2.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/health-fraud-detection.git
git push -u origin main
```

### 2.2 Deploy on Render

1. Go to [Render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Select the `python-backend` folder as the Root Directory
5. Set **Environment** to `Python 3`
6. Set **Build Command** to:
   ```bash
   pip install -r requirements.txt
   ```
7. Set **Start Command** to:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
8. Add environment variables:
   - `GEMINI_API_KEY`: Your Gemini API key

**Your backend URL will be:** `https://<your-service-name>.onrender.com`

## 🎨 Step 3: Deploy Frontend (Vercel)

### 3.1 Deploy on Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project" → "Import Git Repository"
3. Connect your GitHub repo
4. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave empty)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables:
   - `PYTHON_BACKEND_URL`: `https://your-backend-url.onrender.com`
   - `GEMINI_API_KEY`: Your Gemini API key
6. Deploy!

## 🔗 Step 4: Update Backend CORS

After frontend deployment, update the backend CORS in `python-backend/main.py`:

```python
allow_origins=["https://your-frontend-url.vercel.app"],
```

Then redeploy the backend.

## ✅ Step 5: Test Your Live App

1. **Frontend URL:** `https://your-project-name.vercel.app`
2. **Backend URL:** `https://your-project-name.onrender.com`

Test all features:
- ✅ Claim submission with OCR
- ✅ Fraud detection with ML
- ✅ Risk heatmap
- ✅ Real-time alerts
- ✅ Fraud risk simulator

## 🛠 Troubleshooting

### Common Issues:

1. **CORS Errors:** Update `allow_origins` in backend
2. **API Calls Failing:** Check `PYTHON_BACKEND_URL` environment variable
3. **ML Model Not Loading:** Ensure model files are in `python-backend/`
4. **Build Failures:** Check Node.js/Python versions in deployment settings

### Environment Variables:

**Vercel (Frontend):**
- `PYTHON_BACKEND_URL`: Backend Render URL
- `GEMINI_API_KEY`: Your API key

**Render (Backend):**
- `GEMINI_API_KEY`: Your API key

## 📞 Support

If you encounter issues, check the deployment logs in Vercel/Render dashboards.

**Your live app will be available at:** `https://your-project-name.vercel.app` 🎉