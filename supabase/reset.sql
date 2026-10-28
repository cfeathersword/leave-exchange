-- Clear all offers, swaps, swapped rosters and round history.
-- Rosters go back to the approved 2027 roster. Run in Supabase SQL Editor.
truncate table public.listings, public.swaps, public.holdings, public.rounds;
