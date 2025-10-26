import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybqelfyfhuxdmjobupxz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlicWVsZnlmaHV4ZG1qb2J1cHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTYxOTYsImV4cCI6MjA3Njk3MjE5Nn0.KMmkd8j1aKQrXH0IzEHtPsyHice1jCGTBXFvO7eBFyQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
