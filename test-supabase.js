const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://qmvqfusxnafojqophrwo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZLAa1v4ArB1LZDUxp0BlNA_24Egfn4h';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: config, error: errConfig } = await supabase.from('kriteria_config').select('*');
  console.log("Config Error:", errConfig);
  console.log("Config count:", config ? config.length : 0);
  console.log("Config data:", config);

  const { data: contents, error: errContents } = await supabase.from('kriteria_contents').select('*, content_media(*)');
  console.log("Contents Error:", errContents);
  console.log("Contents count:", contents ? contents.length : 0);
  console.log("Contents data:", contents);
}
run();
