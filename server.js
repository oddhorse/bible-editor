/**
 * server.js
 * by john trinh
 *
 * main server file
 */

// -----[IMPORT LIBRARIES / MODULES]-----
import Express from 'express'
import * as bible from './db.js'
import { getDatePretty } from './util.js'
import cookieParser from 'cookie-parser'

// set up applications
const app = Express() // express app normal stuff

// middlewareeeee
app.use(Express.static('public'))
app.use(Express.json()) // needed for pushing json data in a post request https://www.geeksforgeeks.org/web-tech/express-js-express-json-function/
app.use(Express.urlencoded({ extended: true }))
app.use(cookieParser())
app.set('view engine', 'ejs')

// -----[ROUTES]-----

// default route redirects to genesis 1:1
app.get('/', (req, res) => {
	const currentPath = req.path
	const votd = bible.getRandomEditedVerse()
	console.log(votd.book_id)
	const votdBookName = bible.getBookName(votd.book_id)
	const prettyDate = getDatePretty()
	const randUneditedChapter = bible.getRandomUneditedChapter()
	res.render('index', { votd, votdBookName, prettyDate, randUneditedChapter, currentPath })
})

// main route for getting chapters
// https://expressjs.com/en/guide/routing.html#route-parameters
app.get('/:book/:chapter', (req, res) => {
	const currentPath = req.path
	const appearanceFont = req.cookies.appearanceFont || 'serif'
	const appearanceSize = req.cookies.appearanceSize || 'md'
	let bookID = parseInt(req.params.book)
	let chapterID = parseInt(req.params.chapter)
	if (!bible.chapterExists(bookID, chapterID)) return res.redirect('/1/1')
	const verses = bible.getVerses(bookID, chapterID)
	const bookName = bible.getBookName(bookID)
	const prev = bible.getPrevChapter(bookID, chapterID)
	const next = bible.getNextChapter(bookID, chapterID)
	const allBooks = bible.getAllBooks()
	const numChapters = bible.getNumChapters(bookID)
	const chapterEditStats = bible.getChapterEditCoverage(bookID, chapterID)
	const totalEditStats = bible.getTotalEditCoverage()
	const randUneditedChapter = bible.getRandomUneditedChapter()
	res.render('bible', { verses, bookName, bookID, chapterID, prev, next, allBooks, numChapters, chapterEditStats, currentPath, appearanceFont, appearanceSize, randUneditedChapter })
})

app.get('/stats', (req, res) => {
	const currentPath = req.path
	const allBookEditStats = bible.getAllBookEditCoverage()
	const recentEdits = bible.getRecentEdits(5)
	res.render('stats', { currentPath, allBookEditStats, recentEdits })
})

app.post('/edit', (req, res) => {
	bible.saveEdit(req.query.verseID, req.query.newVerse, req.ip)
	res.send("success!")
})

// listen on port
app.listen(8008, () => {
	console.log('server listening on port 8008!')
	console.log(bible.getRecentEdits(5))
	console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
	setInterval(() => {
	}, 1000 * 60 * 60 * 24) // 24 hrs
})
