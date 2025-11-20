# Deployment Guide for Beacon

This guide outlines the steps to deploy the Beacon application to production.

## Prerequisites

1.  **Supabase Project**: You need a Supabase project for the database and authentication.
2.  **Mapbox Account**: You need a Mapbox account for the map interface.
3.  **Vercel Account**: Recommended for deploying Next.js applications.

## Environment Variables

Configure the following environment variables in your deployment platform (e.g., Vercel):

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Public Anon Key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox Public Access Token |

## Database Setup

Run the SQL commands found in `schema.sql` in your Supabase SQL Editor to set up the required tables and policies.

## Deployment Steps (Vercel)

1.  **Push to GitHub**: Ensure your code is pushed to a GitHub repository.
2.  **Import Project**: In Vercel, import the repository.
3.  **Configure Build**:
    *   Framework Preset: Next.js
    *   Build Command: `npm run build`
    *   Output Directory: `.next`
4.  **Add Environment Variables**: Add the variables listed above.
5.  **Deploy**: Click "Deploy".

## Verification

After deployment:
1.  Visit the deployed URL.
2.  Test the **Login/Signup** flow to verify Supabase connection.
3.  Check the **Map** to ensure the Mapbox token is valid.
4.  Try **Reporting an Item** to verify database write access.
