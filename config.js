/*
  Supabase connection for Leave Block Exchange.
  Find both values in Supabase: Project Settings > API.
  The anon (public) key is meant to be used in browsers, so it is safe to commit.
  Never put the service_role key here.

  If you set the GitHub repository variables SUPABASE_URL and SUPABASE_ANON_KEY,
  the deploy workflow writes this file for you and these values are ignored.
*/
window.LBX_CONFIG = {
  supabaseUrl: 'https://gobvuuggwwepiltkomgi.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvYnZ1dWdnd3dlcGlsdGtvbWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwOTgwNTYsImV4cCI6MjEwODY3NDA1Nn0.yFOb-OGdA6tP2UG5eQMyydeG6NZ6QwuEfDw9IOOO7Mc',
  // Show the demo buttons (simulate everyone's answers, run scheduled rounds early)
  demoTools: true
};
