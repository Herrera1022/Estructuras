import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fiwvugxthaobzfjvfwln.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpd3Z1Z3h0aGFvYnpmanZmd2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxODA0MDksImV4cCI6MjA3NDc1NjQwOX0.WxoNf2K8cqWOh0CHd7McXaPDgFkqfBTdJE1_QheIF1Y";

export const supabase = createClient(supabaseUrl, supabaseKey);
