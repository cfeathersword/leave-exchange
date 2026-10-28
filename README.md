# Leave Block Exchange

A web app for paramedics in the Sydney sector to swap whole 3-week blocks of 2027 annual leave, across 10 stations.

- **My leave**: offer one of your blocks and rank the blocks you would take instead.
- **Leave pool**: see who is offering and wanting each block, and take a direct 1-for-1 swap.
- **Matching rounds**: every Monday at 9am, plus a final round 8 days before each block's 10-week cutoff. The matcher finds loops of 2 to 6 people where everyone gets one of their choices.
- **Swaps**: everyone in a loop must accept within 5 days. A decline sends the others straight back to the pool with an instant re-match.
- **Station rosters**: the approved roster with agreed swaps applied.

The app is one static page (`index.html`). Shared data lives in Supabase and updates live in every open browser.

> **Prototype.** Staff, names and rosters are made up. There is no login: anyone with the link picks who they are "acting as" and can change shared data. Do not put real staff data in it until sign-in and tighter database rules are added (see "Before real use").

## Files

| Path | What it is |
|---|---|
| `index.html` | The app |
| `config.js` | Your Supabase URL and anon key, plus the demo-tools switch |
| `js/supabase-db.js` | Connects the app to Supabase tables and live updates |
| `supabase/migrations/20261028000000_init.sql` | Creates the tables, functions, access rules and live updates |
| `supabase/reset.sql` | Clears all offers, swaps and round history |
| `.github/workflows/deploy.yml` | Publishes the site to GitHub Pages on every push to `main` |

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (the free plan is enough). The Sydney region (`ap-southeast-2`) keeps it close to users.
2. Open **SQL Editor > New query**, paste the whole of `supabase/migrations/20261028000000_init.sql`, and click **Run**. It is safe to run again.
3. Open **Project Settings > API** and copy the **Project URL** and the **anon public** key.

Using the Supabase CLI instead: `supabase link --project-ref <ref>` then `supabase db push`.

### 2. GitHub

1. Create a new repository and upload these files (keep the folder structure, including `.github`).
2. Give the app your Supabase details, either way:
   - **Simple:** edit `config.js` and paste in the URL and anon key, or
   - **Keep them out of the code:** in **Settings > Secrets and variables > Actions > Variables**, add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (optional: `DEMO_TOOLS` = `false` to hide demo buttons). The deploy workflow writes `config.js` for you.
3. In **Settings > Pages**, set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow from the **Actions** tab). The site URL appears in the workflow run, usually `https://<user>.github.io/<repo>/`.

The anon key is designed to be public in browsers. Never use the `service_role` key in this app.

### 3. Check it works

Open the site. If you see "Not connected to Supabase", the URL or key in `config.js` is wrong or still a placeholder. Otherwise go to **How it works > Add 40 example requests**, then **Swaps > Run matching round**. Open the site in a second browser: changes appear in both.

## Running locally

Any static server works, for example:

```
python3 -m http.server 8000
```

then open `http://localhost:8000`. Opening `index.html` straight from disk also works.

## How the data is stored

Four tables (`listings`, `swaps`, `holdings`, `rounds`), each with `id`, `data` (JSON) and `updated_at`. Two database functions support the app:

- `merge_doc` applies a partial update to one row, such as adding one person's acceptance to a swap.
- `claim_doc` lets only one browser run each scheduled matching round, so rounds are not run twice when several people have the app open.

Scheduled rounds run when someone opens the app after the round's time. If nobody opens it, the round runs the next time someone does.

## Before real use

- **Sign-in:** add Supabase Auth (for example email magic links) and link each email to one staff member.
- **Access rules:** replace the open "demo" policies in the migration with rules that only let people change their own offers and answers, and move round running and swap finalising into a database function or Edge Function.
- **Staff data:** move the staff list and approved roster from the made-up generator in `index.html` into a table.
- **Scheduled rounds on time:** run rounds from a Supabase Edge Function on a schedule (pg_cron) rather than in the browser.
- **Hide demo tools:** set `demoTools: false`, and remove the "Clear all" and "Pretend today is" controls on the How it works tab.
- Confirm the rules with the group and against the award (clause 32 annual leave, clause 25 rosters). Not legal advice.
