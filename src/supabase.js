import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqcvjlvirdfikzdqfigw.supabase.co';
const supabaseKey = 'sb_publishable_fLujWrJf-z9D4bBNUCdl_w_1BbMxu8S';

export const supabase = createClient(supabaseUrl, supabaseKey);
