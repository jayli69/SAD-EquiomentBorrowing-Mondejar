// ============================================================
// Supabase Client Initialization
// Replace with your own project's URL and anon public key
// (Supabase Dashboard -> Project Settings -> API)
// ============================================================

const SUPABASE_URL = "https://vtjhppkqfsitgctetztr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Qa4t4Xa825HpokSqq5eH6A_QWUr9HXP";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
