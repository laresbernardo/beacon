# Deploying Beacon to Heroku

## Prerequisites
1. A Heroku account (sign up at https://heroku.com)
2. Heroku CLI installed (download from https://devcenter.heroku.com/articles/heroku-cli)

## Step-by-Step Deployment

### 1. Install Heroku CLI (if not already installed)

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Or download from:** https://devcenter.heroku.com/articles/heroku-cli

### 2. Login to Heroku

```bash
heroku login
```

This will open a browser window to authenticate.

### 3. Create a Heroku App

From your project directory:

```bash
cd /Users/bernardo/Dropbox/Documentos/Beacon
heroku create beacon-lost-found
```

Or use any other unique name. If the name is taken, Heroku will suggest alternatives.

### 4. Set Environment Variables

Set your environment variables on Heroku:

```bash
# For production use (with real Supabase)
heroku config:set NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# For demo/mock mode (using localStorage)
heroku config:set NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=example-key
```

### 5. Configure Node.js Version

Heroku needs to know which Node version to use. This is already set in package.json:

```json
"engines": {
  "node": ">=20.0.0"
}
```

### 6. Deploy to Heroku

```bash
git add .
git commit -m "Configure for Heroku deployment"
git push heroku main
```

If your branch is named something other than `main`, use:
```bash
git push heroku your-branch-name:main
```

### 7. Open Your App

```bash
heroku open
```

Or visit: `https://beacon-lost-found.herokuapp.com` (or your custom name)

## Monitoring and Logs

### View Logs
```bash
heroku logs --tail
```

### Check App Status
```bash
heroku ps
```

### Restart App
```bash
heroku restart
```

## Important Notes

⚠️ **Heroku Limitations:**
- Free tier sleeps after 30 minutes of inactivity
- First request after sleep will be slow (cold start)
- Consider Vercel instead for better Next.js support and performance

✅ **Recommended: Use Vercel**
Next.js is optimized for Vercel. For better performance:
1. Visit https://vercel.com
2. Import from GitHub: laresbernardo/beacon
3. Configure environment variables
4. Deploy (automatic)

## Troubleshooting

### Build Failures
```bash
heroku logs --tail
```
Check for errors in the build process.

### App Crashes
```bash
heroku ps
heroku logs --tail
```

### Update Configuration
```bash
heroku config
heroku config:set KEY=value
```

### Database Issues
- Ensure Supabase URL and keys are correctly set
- Verify Supabase project is accessible from Heroku

## Automatic Deployments

To enable automatic deployments from GitHub:
1. Go to Heroku Dashboard
2. Select your app
3. Go to "Deploy" tab
4. Connect to GitHub repository: laresbernardo/beacon
5. Enable "Automatic Deploys" from main branch

Now every push to main will automatically deploy!

## Custom Domain

To use a custom domain:
```bash
heroku domains:add www.yourbeacon.com
```

Then update your DNS settings as instructed by Heroku.

## Scaling (Paid Plans)

```bash
# Scale to 2 dynos
heroku ps:scale web=2

# Upgrade to hobby plan
heroku dyno:type hobby
```
