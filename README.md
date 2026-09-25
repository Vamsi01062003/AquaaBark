# AquaaBark Luxury Final

Premium React/Vite public website for AquaaBark.

## Brand details included
- Hyderabad, Telangana
- WhatsApp: +91 81216 37269
- Instagram: @aquaa_bark_telugu
- YouTube channel ID: UCPOhWpzVXwthBzK_IeZ0Mpw
- 14 requested aquatic categories
- 75K+ community positioning

## Run
npm install
npm run dev

## Build
npm run build

## Firebase
Create `.firebaserc` with your Firebase project ID, then:
npm run build
firebase deploy

## Supabase
Run `supabase/schema.sql` in Supabase SQL Editor and add the public URL/key to `.env`.

Never put a Supabase service-role key in frontend code.

## Next production step
Connect the fish inventory/admin dashboard to Supabase Auth + RLS + Storage. The public catalogue pages are intentionally ready for that live inventory.
