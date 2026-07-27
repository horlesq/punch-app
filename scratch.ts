import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// read .env
const envPath = path.resolve(__dirname, '.env');
const envStr = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envStr.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [k, v] = line.split('=');
    env[k.trim()] = v.trim();
  }
});

const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase.from('punches').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Error:', error);
  console.log('Punches:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
