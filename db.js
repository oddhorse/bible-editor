/**
 * db.js
 * by john trinh
 * 
 * all db queries
 */
import Database from "better-sqlite3"

const db = new Database('./data/KJV.db')

const verseQuery = db.prepare(`
    SELECT id, verse, text, is_edited, paragraph
    FROM KJV_verses_live
    WHERE book_id = ? AND chapter = ?
    ORDER BY verse
`)
export const getVerses = (bookID, chapterID) => {
	return verseQuery.all(bookID, chapterID)
}
const firstVerseQuery = db.prepare(`
  SELECT MIN(id) AS id
  FROM KJV_verses
  WHERE book_id = ? AND chapter = ?
`)
const lastVerseQuery = db.prepare(`
  SELECT MAX(id) AS id
  FROM KJV_verses
  WHERE book_id = ? AND chapter = ?
`)
const chapterQuery = db.prepare(`
  SELECT book_id, chapter
  FROM KJV_verses
  WHERE id = ?
`)
export const getPrevChapter = (bookID, chapterID) => {
	const firstVerse = firstVerseQuery.get(bookID, chapterID)
	if (firstVerse.id === 1) return null
	const prevChapter = chapterQuery.get(firstVerse.id - 1)
	return prevChapter
}
export const getNextChapter = (bookID, chapterID) => {
	const lastVerse = lastVerseQuery.get(bookID, chapterID)
	if (lastVerse.id === 31102) return null
	const nextChapter = chapterQuery.get(lastVerse.id + 1)
	return nextChapter
}
const bookNameQuery = db.prepare(`
  SELECT name
  FROM KJV_books
  WHERE id = ?
`)
export const getBookName = (bookID) => {
	const row = bookNameQuery.get(bookID)
	return row.name
}
const chapterExistsQuery = db.prepare(`
  SELECT EXISTS(
    SELECT 1
    FROM KJV_verses
    WHERE book_id = ? AND chapter = ?
  ) AS chapter_exists
`)
export const chapterExists = (bookID, chapterID) => {
	const row = chapterExistsQuery.get(bookID, chapterID)
	return row.chapter_exists === 1
}
const allBooksQuery = db.prepare(`
    SELECT id, name
    FROM KJV_books
    ORDER BY id
`)
export const getAllBooks = () => {
	return allBooksQuery.all()
}
const chaptersInBookQuery = db.prepare(`
  SELECT MAX(chapter) AS chapter
  FROM KJV_verses
  WHERE book_id = ?
`)
export const getNumChapters = (bookID) => {
	const row = chaptersInBookQuery.get(bookID)
	return row.chapter
}

const insertEdit = db.prepare(`
  INSERT INTO verse_edits (
    verse_id,
    new_text,
    edited_at,
    client_ip
  ) VALUES (
    ?, ?, CURRENT_TIMESTAMP, ?
  )
`)
export const saveEdit = (verseId, newText, clientIp) => {
	insertEdit.run(verseId, newText, clientIp)
}

const numEditedTotalQuery = db.prepare(`
	SELECT
	SUM(CASE WHEN is_edited = 1 THEN 1 ELSE 0 END) AS edited_count,
	SUM(CASE WHEN is_edited = 0 THEN 1 ELSE 0 END) AS unedited_count,
	COUNT(*) AS total_count
	FROM KJV_verses_live;
`)
const numEditedChapterQuery = db.prepare(`
	SELECT
	SUM(CASE WHEN is_edited = 1 THEN 1 ELSE 0 END) AS edited_count,
	SUM(CASE WHEN is_edited = 0 THEN 1 ELSE 0 END) AS unedited_count,
	COUNT(*) AS total_count
	FROM KJV_verses_live
	WHERE book_id = ? AND chapter = ?;
`)
export const getEditCoverage = (bookID = null, chapterID = null) => {
	let stats
	if (bookID === null && chapterID === null) stats = numEditedTotalQuery.get()
	else stats = numEditedChapterQuery.get(bookID, chapterID)
	stats.percent_edited = Math.round((stats.edited_count / stats.total_count) * 1000) / 10
	return stats
}