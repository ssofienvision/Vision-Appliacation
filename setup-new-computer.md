# Setup Guide for New Computer

## Quick Setup Steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ssofienvision/Vision-Appliacation.git
   cd Vision-Appliacation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create `.env.local` in the project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to `http://localhost:3000`

## Get Supabase Credentials:
- Go to your Supabase project dashboard
- Settings → API
- Copy Project URL and keys

## Troubleshooting:
- If you get build errors, delete `.next` folder: `Remove-Item -Recurse -Force .next`
- Make sure all environment variables are set correctly
- Check that you're using the same Node.js version (18+ recommended) 