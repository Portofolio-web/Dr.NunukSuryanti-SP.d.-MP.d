const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qmvqfusxnafojqophrwo.supabase.co', 'sb_publishable_ZLAa1v4ArB1LZDUxp0BlNA_24Egfn4h');
supabase.from('admin_profile').select('*').then(({data, error}) => console.log(data, error));
