// ============================================
// supabase.js
// Connexion à Supabase, partagée par toutes les pages.
// ============================================

const SUPABASE_URL = "sqdaobashlbxmtmurlux";
const SUPABASE_CLE = "sb_publishable_qvmbWm3NO-QpCCSAggcj1A_eiZ_dyjq";

// "supabase" est déjà pris par la librairie, on nomme notre objet "client"
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLE);