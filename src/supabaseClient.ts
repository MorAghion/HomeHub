import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwqvjiekakjetspucfxp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cXZqaWVrYWtqZXRzcHVjZnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjUwMzgsImV4cCI6MjA4NjgwMTAzOH0.Y5MWO_LSz4dfWOhG6RRI6WyWKjnx9wSHoC87d-EoBvI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
