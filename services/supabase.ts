
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://kkswlrpvpyczngemphse.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrc3dscnB2cHljem5nZW1waHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODU3MTEsImV4cCI6MjA4NzY2MTcxMX0.xvhccZ82J4k7UxkPT8RMnWPT-6pAACIEfPWzui472yI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export const isCloudConnected = true;

export const networkDelay = () => new Promise(resolve => setTimeout(resolve, 100));
