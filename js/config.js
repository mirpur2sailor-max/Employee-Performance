/* Deployment settings. Edit this file, commit it, done. */
window.APP_CONFIG = {
  /* Shared database (Supabase). Leave both empty to run on one device only (data stays in this browser). */
  supabaseUrl: 'https://udvxzpyjaouyuuzzfcbe.supabase.co',          // e.g. https://abcdxyz.supabase.co
  supabaseKey: 'sb_publishable_0P_XhxapPEKG8VUyXz0O8Q_YH_RkJxo',          // the project's "anon public" key
  /* Where the sales report lives. The sales software publishes it here; the app re-reads it automatically.
     Relative path (same repository / GitHub Pages) or a full raw.githubusercontent.com URL. */
  salesUrl: 'data/sales.csv',
  salesRefreshMin: 10       // how often an open page checks for a newer file
};
