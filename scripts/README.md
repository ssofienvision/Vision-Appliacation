# Technician User Creation Scripts

This directory contains scripts to create technician users in your Supabase database.

## Prerequisites

1. **Supabase Service Role Key**: You need your Supabase service role key (not the anon key) to create users with admin privileges.

2. **Environment Variables**: Add the following to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Getting Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (NOT the anon key)
4. Add it to your `.env.local` file

## Running the Scripts

### Option 1: TypeScript (Recommended)
```bash
npx tsx scripts/create-technicians.ts
```

### Option 2: JavaScript
```bash
node scripts/create-technicians.js
```

## What the Script Does

1. **Creates Auth Users**: Creates user accounts in Supabase Auth with:
   - Email addresses from the technician list
   - Temporary password: `TempPassword123!`
   - Email confirmation set to true

2. **Creates Technician Records**: Adds records to the `technicians` table with:
   - Technician code (derived from name)
   - Name and email
   - Role set to 'technician'
   - Active status set to true

## Technician List

The script will create users for the following technicians:
- Sofien Smaali (sofien.smaali@gmail.com)
- Salma Mokni (thesalmamokni@gmail.com)
- Kal Majdoub (khlil.mjb@gmail.com)
- Jed Sbai (lamjed76@gmail.com)
- Khaled Makki (Mekki.kmk@gmail.com)
- Shoaib B (shoaibnazira2222@gmail.com)
- Seif Bargaoui (bargaoui1984@gmail.com)
- Aymen Katrou (katrouaymen@gmail.com)
- Abdul Akrami (anajibakrami@gmail.com)
- Gideon Tesfai (ged798@gmail.com)
- Raafet Fehmi (fehmiraafet@gmail.com)
- Simon Tesfai (tesfaisimon12@gmail.com)

## Important Notes

- **Password Security**: All users are created with the same temporary password. They should change it on first login.
- **Email Confirmation**: Users are created with email confirmation set to true, so they can log in immediately.
- **Error Handling**: The script will continue processing other users if one fails.
- **Duplicate Prevention**: If a user already exists, the script will show an error but continue with the next user.

## After Running the Script

1. Notify technicians of their login credentials
2. Instruct them to change their password on first login
3. Consider setting up password reset functionality for future use 