# Leave Block Exchange (demo)

A demo of a leave swap app for paramedics: 10 stations, 316 made-up staff, a shared leave pool, ranked requests, multi-way matching rounds and the 4-month swap cutoff. Everyone who opens the link shares the same data.

The app is a single web page hosted free on **GitHub Pages**. The shared data lives in a free **Supabase** database.

All staff are made up. Anyone with the link can act as anyone, so **do not enter real names or leave**.

## What is in this folder

| File | What it is |
|---|---|
| `index.html` | The app |
| `config.js` | Your two Supabase settings go here |
| `supabase-setup.sql` | Creates the database table (run once in Supabase) |
| `README.md` | These instructions |

## Setup (about 20 minutes)

### 1. Create the database in Supabase

1. Go to supabase.com and sign up (free).
2. Create a **New project**. Pick any name, set a database password (save it somewhere) and choose the **Sydney** region.
3. Wait a minute or two for the project to finish setting up.
4. In the left menu open **SQL Editor**, then **New query**.
5. Open `supabase-setup.sql` from this folder, copy everything, paste it in, and press **Run**. You should see "Success".

### 2. Copy your two Supabase settings

1. In Supabase open **Project Settings**, then **API** (on newer accounts it may be called **API Keys**, with the older keys under a "Legacy" tab).
2. Copy the **Project URL**. It looks like `https://abcdefgh.supabase.co`.
3. Copy the **anon public** key. It is a long string of letters and numbers.
4. Open `config.js` in a text editor (Notepad, TextEdit) and replace the two placeholder values. Keep the quote marks. Save the file.

The anon key is designed to be public, so it is fine for it to sit in a public GitHub repository. Never use the `service_role` or "secret" key here.

### 3. Put the app on GitHub Pages

1. Go to github.com and sign up or sign in.
2. Click **+** (top right), then **New repository**. Name it `leave-exchange`, set it to **Public**, and click **Create repository**.
3. On the new repository page click **uploading an existing file**. Drag in `index.html`, `config.js`, `supabase-setup.sql` and `README.md`, then click **Commit changes**.
4. Open **Settings**, then **Pages** (left menu).
5. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**, then click **Save**.
6. After a minute or two the page shows your link, like `https://yourname.github.io/leave-exchange/`.

### 4. Try it

Open the link. On the first visit the app loads 41 example requests into the pool. Then:

1. Go to **Swaps** and press **Run matching round now**.
2. Use **Demo: simulate responses** to have people accept or decline.
3. Use **Acting as** at the top to see the app as any paramedic.

Open the link on two devices to watch changes appear on both.

## Changing or resetting the demo

- **Clear swaps and offers:** in the app, **How it works**, then **Clear all swaps and offers**.
- **Start completely fresh:** in Supabase SQL Editor run `delete from public.docs;`. The example requests reload on the next visit.
- **Update the app:** upload a new `index.html` to the repository (it replaces the old one). Keep your `config.js`.

## If something goes wrong

- **Yellow banner "Not connected to the shared database yet":** `config.js` still has placeholder values, has a typo, or did not upload. Check both values and that the quote marks are still there.
- **Banner says connected but nothing saves:** the setup script may not have run. Run `supabase-setup.sql` again.
- **Other screens do not update live:** they will still catch up within about 30 seconds. To fix live updates, run the setup script again; it turns them on.
- **The app stops working after a quiet spell:** free Supabase projects can pause when unused. Sign in to Supabase and restore the project from its dashboard.

## Notes on the rules

- 2027 has 17 blocks of 3 weeks starting Saturday 16 Jan 2027. Everyone holds two.
- Swaps close 4 months before a block starts.
- Swaps are whole blocks only, between any stations in the sector. Every swap is a loop, so sector numbers on leave never change.
- A swap is final only when everyone in it accepts. Each person then needs their manager's approval (award clause 32).
- If someone declines, everyone else goes straight back into the pool. The decliner must offer their block again themselves.
