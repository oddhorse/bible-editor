// libs
import Express from 'express'
import Database from 'better-sqlite3'

const db = new Database('./data/kjv.db')


const verseQuery = db.prepare(`
    SELECT chapter, verse, text
    FROM KJV_verses
    WHERE book_id = ? AND chapter = ?
    ORDER BY verse
`)
const getVerses = (bookID, chapterID) => {
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
const getPrevChapter = (bookID, chapterID) => {
	const firstVerse = firstVerseQuery.get(bookID, chapterID)
	if (firstVerse.id === 1) return null
	const prevChapter = chapterQuery.get(firstVerse.id - 1)
	return prevChapter
}
const getNextChapter = (bookID, chapterID) => {
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
const getBookName = (bookID) => {
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
const chapterExists = (bookID, chapterID) => {
	const row = chapterExistsQuery.get(bookID, chapterID)
	return row.chapter_exists === 1
}

const allBooksQuery = db.prepare(`
    SELECT id, name
    FROM KJV_books
    ORDER BY id
`)
const getAllBooks = () => {
	return allBooksQuery.all()
}

const chaptersInBookQuery = db.prepare(`
  SELECT MAX(chapter) AS chapter
  FROM KJV_verses
  WHERE book_id = ?
`)
const getNumChapters = (bookID) => {
	const row = chaptersInBookQuery.get(bookID)
	return row.chapter
}

// set up applications
const app = Express() // express app normal stuff

// middlewareeeee
app.use(Express.static('public'))
app.use(Express.json()) // needed for pushing json data in a post request https://www.geeksforgeeks.org/web-tech/express-js-express-json-function/
app.use(Express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')


// routes
app.get('/', (req, res) => {
	res.redirect('/1/1')
})

// route with params
// https://expressjs.com/en/guide/routing.html#route-parameters
app.get('/:book/:chapter', (req, res) => {
	let bookID = parseInt(req.params.book)
	let chapterID = parseInt(req.params.chapter)
	if (!chapterExists(bookID, chapterID)) return res.redirect('/1/1')
	const verses = getVerses(bookID, chapterID)
	const bookName = getBookName(bookID)
	const prev = getPrevChapter(bookID, chapterID)
	const next = getNextChapter(bookID, chapterID)
	const allBooks = getAllBooks()
	const numChapters = getNumChapters(bookID)
	console.log(allBooks)

	res.render('index', { verses, bookName, bookID, chapterID, prev, next, allBooks, numChapters })
})

// listen on port
app.listen(8008, () => {
	console.log('server listening on port 8008!')
})