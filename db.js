/**
 * db.js
 * by john trinh
 *
 * all db queries
 */
import Database from "better-sqlite3"
import { getRandomIntBetween } from "./util.js"
import { diffWords } from 'diff'

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
const numEditedEachChapterQuery = db.prepare(`
	SELECT
		v.book_id,
		b.name AS book_name,
		v.chapter,
		SUM(CASE WHEN v.is_edited = 1 THEN 1 ELSE 0 END) AS edited_count,
		COUNT(*) AS total_count,
		ROUND(100.0 * SUM(CASE WHEN v.is_edited = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) AS percent_edited
	FROM KJV_verses_live v
	JOIN KJV_books b ON b.id = v.book_id
	GROUP BY v.book_id, b.name, v.chapter
	ORDER BY v.book_id, v.chapter;
`)
export const getChapterEditCoverage = (bookID, chapterID) => {
	let stats = numEditedChapterQuery.get(bookID, chapterID)
	stats.percent_edited = Math.round((stats.edited_count / stats.total_count) * 1000) / 10
	return stats
}

export const getTotalEditCoverage = () => {
	let stats = numEditedTotalQuery.get()
	stats.percent_edited = Math.round((stats.edited_count / stats.total_count) * 1000) / 10
	return stats
}

export const getAllChapterEditCoverage = () => {
	let stats = numEditedEachChapterQuery.all()
	return stats
}

const numEditedEachBookQuery = db.prepare(`
	SELECT
	v.book_id,
	b.name AS book_name,
	SUM(CASE WHEN v.is_edited = 1 THEN 1 ELSE 0 END) AS edited_count,
	COUNT(*) AS total_count,
	COUNT(*) - SUM(CASE WHEN v.is_edited = 1 THEN 1 ELSE 0 END) AS unedited_count,
	ROUND(
		100.0 * SUM(CASE WHEN v.is_edited = 1 THEN 1 ELSE 0 END) / COUNT(*),
		1
	) AS percent_edited
	FROM KJV_verses_live v
	JOIN KJV_books b ON b.id = v.book_id
	GROUP BY v.book_id, b.name
	ORDER BY v.book_id;
`)
export const getAllBookEditCoverage = () => {
	let stats = numEditedEachBookQuery.all()
	return stats
}

const allCurrentEditedVersesQuery = db.prepare(`
	SELECT id, book_id, chapter, verse, text
	FROM KJV_verses_live
	WHERE is_edited = 1;
`)
// TODO ensure only new verse edits are picked each day
export const getRandomEditedVerse = () => {
	let allEdited = allCurrentEditedVersesQuery.all()
	const total = allEdited.length
	const randInt = getRandomIntBetween(0, total)
	const selected = allEdited[randInt]
	console.log(selected)
	return selected
}

const randomUneditedChaptersQuery = db.prepare(`
	SELECT
		book_id,
		chapter,
		SUM(CASE WHEN is_edited = 1 THEN 1 ELSE 0 END) AS edited_count,
		SUM(CASE WHEN is_edited = 0 THEN 1 ELSE 0 END) AS unedited_count,
		COUNT(*) AS total_count
	FROM KJV_verses_live
	GROUP BY book_id, chapter
	ORDER BY edited_count ASC, RANDOM()
	LIMIT 1;
`)
export const getRandomUneditedChapter = () => {
	return randomUneditedChaptersQuery.get()
}

const recentEditsQuery = db.prepare(`
	SELECT
		e.verse_id,
		v.book_id,
		b.name AS book_name,
		v.chapter,
		v.verse,
		e.new_text,
		COALESCE(prev.new_text, v.text) AS old_text,
		e.edited_at
	FROM verse_edits e
	JOIN KJV_verses v ON v.id = e.verse_id
	JOIN KJV_books b ON b.id = v.book_id
	LEFT JOIN verse_edits prev ON prev.id = (
		SELECT id
		FROM verse_edits
		WHERE verse_id = e.verse_id
		  AND id < e.id
		ORDER BY id DESC
		LIMIT 1
	)
	ORDER BY e.edited_at DESC, e.id DESC
	LIMIT @limit
`)
export const getRecentEdits = (limit = 50) => {
	const edits = recentEditsQuery.all({ limit })
	for (const edit of edits) {
		const diff = diffWords(edit.old_text, edit.new_text)
		edit.diff = diff
	}
	return edits
}

const allEditsOfVerseQuery = db.prepare(`
	SELECT verse_id, new_text, edited_at
	FROM (
		SELECT
			0 AS sort_order,
			e.verse_id,
			e.new_text,
			e.edited_at
		FROM verse_edits e
		WHERE e.verse_id = @verseID
		UNION ALL
		SELECT
			1 AS sort_order,
			v.id AS verse_id,
			v.text AS new_text,
			NULL AS edited_at
		FROM KJV_verses v
		WHERE v.id = @verseID
	)
	ORDER BY sort_order, edited_at DESC, verse_id DESC
`)
export const getAllEditsOfVerse = (verseID) => {
	return allEditsOfVerseQuery.all({ verseID })
}