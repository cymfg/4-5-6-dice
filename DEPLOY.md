# Vercel Deployment Guide

## Quick Deploy (Recommended)

### Option 1: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect the Vite configuration
6. Click "Deploy"

### Option 2: Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# For production deployment
vercel --prod
```

### Option 3: Drag & Drop
1. Build the project: `npm run build`
2. Go to [vercel.com](https://vercel.com)
3. Drag the `dist` folder to Vercel dashboard

## Environment Variables

This project doesn't require any environment variables for basic functionality.

## Custom Domain

After deployment, you can add a custom domain in the Vercel dashboard:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Build Configuration

The project uses these configurations for Vercel:

**vercel.json:**
- Framework: Vite (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing support
- Asset caching (1 year for static assets)
- WASM content type support

## Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed: `npm install`

### 3D Dice Not Loading
- Ensure assets are properly deployed
- Check browser console for asset loading errors
- Verify WebGL2 support in target browser

### Performance Issues
- Vercel automatically enables compression
- Static assets are cached with long TTL
- Consider upgrading to Vercel Pro for better performance

## Analytics

Enable Vercel Analytics in your dashboard to track:
- Page views
- Performance metrics
- User engagement
- Core Web Vitals

## Monitoring

Vercel provides built-in monitoring for:
- Function execution
- Build times
- Error tracking
- Performance metrics