# Income Verification Template

This is a template repository for building income verification applications. Use this as a starting point for similar projects.

## What's Included

- ✅ Next.js 14 with App Router
- ✅ Supabase integration (Auth + Database)
- ✅ Teller bank connection integration
- ✅ Stripe payment integration
- ✅ Income calculation and reporting
- ✅ Modern UI with Tailwind CSS
- ✅ Complete database migrations
- ✅ GDPR compliance features

## Quick Start

1. **Create a new repository from this template**
   - Click "Use this template" on GitHub
   - Or clone and push to your new repository

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase and Teller credentials
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up Supabase**
   ```bash
   npx supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Customization

- Update `package.json` with your project name
- Modify the README.md with your specific use case
- Update branding in components (Logo, etc.)
- Adjust database schema in migrations as needed
- Configure Stripe products/pricing for your use case

## Original Project

This template was created from the AppChecker project. See the main README.md for detailed documentation.

