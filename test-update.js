const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qmvqfusxnafojqophrwo.supabase.co', 'sb_publishable_ZLAa1v4ArB1LZDUxp0BlNA_24Egfn4h');

async function testUpdate() {
  const payload = {
    name: "Coba Update Script",
    degree: "Doktor Update",
    bio: "Halo dunia",
    avatar: "",
    email: "",
    wa: "",
    fb: ""
  };
  try {
    const { data, error } = await supabase.from('admin_profile').select('id').limit(1).maybeSingle();
    console.log("Select result:", data, error);
    if (data && data.id) {
      const updateResult = await supabase.from('admin_profile').update(payload).eq('id', data.id);
      console.log("Update result:", updateResult);
    } else {
      const insertResult = await supabase.from('admin_profile').insert(payload);
      console.log("Insert result:", insertResult);
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}
testUpdate();
