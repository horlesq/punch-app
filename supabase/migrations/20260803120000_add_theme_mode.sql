-- Add theme_mode column to business_settings table ('light' or 'dark', default 'light')
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS theme_mode text NOT NULL DEFAULT 'light'
CHECK (theme_mode IN ('light', 'dark'));
