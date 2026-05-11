# bible-editor

To install dependencies:

```bash
npm install
```

To run:

```bash
npm start
```

## turnstile setup

Set these environment variables to enable Cloudflare Turnstile on edit submissions:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

If both are unset, the app keeps working without the widget.

## things to do

- [x] add cloudflare turnstile
- [ ] word block list (density-based)
- [ ] add user message pop up
- [ ] experiment with percentage-based editing: if more than 50%??? of a verse is changed, it isn't let through
- [ ] add john 1:1 message
- [ ] add ui signal for how to edit the page
- [ ] finish mobile styling
- [ ] fix bottom previous-next buttons
- [ ] add rate limit
- [ ] add stats pages
- [ ] add ui clues to promote editing the verses
- [ ] add a css scale helper that grows items by a fixed number of pixels
- [ ] add home page with verse of the day
- [ ] add random unedited chapter button
- [ ] add per-verse stats
- [ ] add most recent edits
- [ ] add global progress bar for verses edited
- [ ] make prep-db handle schema migrations gracefully: extract edits from live db, rebuild from original, restore edits on startup (allow git-pull deployments without losing user changes)
- [ ] make live chat for people currently on the page

## how to back up edits after updating db schema

first save edits as json:

 ```bash
 sqlite3 data/KJV.db ".mode json" ".output edits-backup.json" "SELECT verse_id, new_text, edited_at, client_ip FROM verse_edits;"
 ```

second git pull or whatever

third copy KJV-original.db as KJV.db

fourth run prep-db.js

fifth restore

 ```bash
 sqlite3 data/KJV.db << 'EOF'
 WITH src AS (
 SELECT
 json_extract(value, '$.verse_id') AS verse_id,
 json_extract(value, '$.new_text') AS new_text,
 json_extract(value, '$.edited_at') AS edited_at,
 json_extract(value, '$.client_ip') AS client_ip
 FROM json_each(CAST(readfile('edits-backup.json') AS TEXT))
 )
 INSERT INTO verse_edits (verse_id, new_text, edited_at, client_ip)
 SELECT verse_id, new_text, edited_at, client_ip
 FROM src;
 EOF
 ```

UPDATE THESE AS NEEDED WHEN SCHEMA CHANGES!!

## credits

king james version in sqlite is from [bible_databases](https://github.com/scrollmapper/bible_databases/tree/master)
