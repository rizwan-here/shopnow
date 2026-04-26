# Shopnow Next.js + MongoDB

Shopnow is a social-first storefront app built with Next.js, MongoDB Atlas, Auth.js, and Cloudinary uploads. Sellers can sign up with Google/Facebook, choose a username, build a blank storefront, upload products/images, manage COD orders, and share a clean public shop link.

## Main routes

- `/` - marketing landing page
- `/dashboard` - seller dashboard
- `/username` - public storefront using the seller username
- `/store/[slug]` - internal storefront route, still supported
- `/privacy-policy` - privacy policy
- `/terms-and-conditions` - terms and conditions

## Tech stack

- Next.js App Router
- React
- MongoDB Atlas + Mongoose
- Auth.js / NextAuth v5 beta
- Cloudinary for uploaded images
- Plain CSS

## Payment behavior

Only **Cash on delivery** is enabled. There is no online payment gateway in this build.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your values.

3. Start development:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Required environment variables

```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=replace_with_a_long_random_secret
AUTH_GOOGLE_ID=replace_with_google_client_id
AUTH_GOOGLE_SECRET=replace_with_google_client_secret
AUTH_FACEBOOK_ID=replace_with_facebook_app_id
AUTH_FACEBOOK_SECRET=replace_with_facebook_app_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=replace_with_cloudinary_cloud_name
CLOUDINARY_API_KEY=replace_with_cloudinary_api_key
CLOUDINARY_API_SECRET=replace_with_cloudinary_api_secret
```

For production on Render, set `NEXT_PUBLIC_APP_URL` to your Render URL, for example:

```env
NEXT_PUBLIC_APP_URL=https://shopnow.onrender.com
```

## Cloudinary setup

This build stores uploaded product/store images in Cloudinary, not on Render's local filesystem. That means you do **not** need a Render persistent disk for image uploads.

In Cloudinary, copy these from your dashboard:

- Cloud name -> `CLOUDINARY_CLOUD_NAME`
- API key -> `CLOUDINARY_API_KEY`
- API secret -> `CLOUDINARY_API_SECRET`

Uploads are organized by store username under folders like:

```text
shopnow/<username>/products
shopnow/<username>/branding
```

## Render deployment

1. Push this project to GitHub.
2. In Render, create a new **Web Service** from the repo.
3. Use:

```text
Build Command: npm install && npm run build
Start Command: npm run start
```

4. Add all required environment variables listed above.
5. Set:

```env
NEXT_PUBLIC_APP_URL=https://your-render-service.onrender.com
```

6. Deploy.

No persistent disk is required because uploaded images go to Cloudinary.

## OAuth callback URLs

For local development:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/facebook
```

For Render production, replace the domain:

```text
https://your-render-service.onrender.com/api/auth/callback/google
https://your-render-service.onrender.com/api/auth/callback/facebook
```

Also set the allowed origin/site URL to:

```text
https://your-render-service.onrender.com
```

## Clean storefront URLs

This build includes middleware so public storefronts can be opened at:

```text
/username
```

Example:

```text
https://shopnow.onrender.com/myshop
```

The internal `/store/username` route still exists for compatibility.

## Useful files

- `components/AppClient.js` - main dashboard/storefront UI
- `app/api/upload/route.js` - Cloudinary upload endpoint
- `middleware.js` - clean username URL rewrite
- `models/` - Mongoose schemas
- `lib/store-service.js` - server-side store data loading
- `auth.js` - Auth.js providers and session mapping


## Facebook Page posting

This build supports connecting a Facebook Page from the seller dashboard and posting a product with one click.

What sellers can do:
- connect a Facebook Page
- choose which managed Page to post as
- save a product and publish it immediately

Meta setup notes:
- add this callback URL in your Meta app: `https://your-domain.com/api/facebook/callback`
- request the permissions needed for Page posting in production
- Page posting works for Facebook Pages, not personal timelines
