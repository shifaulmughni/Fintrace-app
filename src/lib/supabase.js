import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqeepneovirtfupopfju.supabase.co';
const supabaseKey = 'sb_publishable_wnrnenwBl1gaYl_jI68gig_S7TwhZiF';

export const supabase = createClient(supabaseUrl, supabaseKey);