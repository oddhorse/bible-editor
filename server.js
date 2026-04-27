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

// set up applications
const app = Express() // express app normal stuff

// middlewareeeee
app.use(Express.static('public'))
app.use(Express.json()) // needed for pushing json data in a post request https://www.geeksforgeeks.org/web-tech/express-js-express-json-function/
app.use(Express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

// -----[ROUTES]-----

// default route redirects to genesis 1:1
app.get('/', (req, res) => {
	const votd = bible.getRandomEditedVerse()
	console.log(votd.book_id)
	const votdBookName = bible.getBookName(votd.book_id)
	const prettyDate = getDatePretty()
	res.render('index', { votd, votdBookName, prettyDate })
})

// main route for getting chapters
// https://expressjs.com/en/guide/routing.html#route-parameters
app.get('/:book/:chapter', (req, res) => {
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
	res.render('bible', { verses, bookName, bookID, chapterID, prev, next, allBooks, numChapters, chapterEditStats })
})

app.post('/edit', (req, res) => {
	bible.saveEdit(req.query.verseID, req.query.newVerse, req.ip)
	res.send("success!")
})

// listen on port
app.listen(8008, () => {
	console.log('server listening on port 8008!')

	setInterval(() => {

	}, 1000 * 60 * 60 * 24) // 24 hrs
})
