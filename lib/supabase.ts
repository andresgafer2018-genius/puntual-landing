import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ictemkwmsqgktpxvvxjg.supabase.co'
const supabaseAnonKey = 'sb_publishable_dD9nCSBl1xsl9rckxvfbMA_HmukQoBc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
