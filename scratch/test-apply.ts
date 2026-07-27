import { supabase } from '../src/lib/supabase';
import { applyCorrection } from '../src/api/corrections';

async function test() {
  const { data: corrections } = await supabase
    .from('punch_corrections')
    .select('*')
    .is('punch_id', null)
    .eq('status', 'pending');

  if (!corrections || corrections.length === 0) {
    console.log('No pending missed shifts found.');
    return;
  }

  console.log(`Found ${corrections.length} pending missed shifts. Applying first...`);
  const correction = corrections[0];
  console.log('Correction ID:', correction.id);

  const result = await applyCorrection(correction.id);
  console.log('Result:', result);
}

test().catch(console.error);
