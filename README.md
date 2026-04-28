# bible-editor

To install dependencies:

```bash
npm install
```

To run:

```bash
npm start
```

## things to do

- [ ] add cloudflare turnstile
- [ ] word block list (density-based)
- [ ] add rate limit
- [ ] add stats pages
- [ ] add ui clues to promote editing the verses
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

third restore

 ```bash
 sqlite3 data/KJV.db << 'EOF'
 INSERT INTO verse_edits (verse_id, new_text, edited_at, client_ip)
 SELECT verse_id, new_text, edited_at, client_ip FROM json_each('edits-backup.json')
 AS jdata(verse_id, new_text, edited_at, client_ip)
 WHERE ...
 EOF
 ```

UPDATE THESE AS NEEDED WHEN SCHEMA CHANGES!!

## credits

king james version in sqlite is from [bible_databases](https://github.com/scrollmapper/bible_databases/tree/master)
