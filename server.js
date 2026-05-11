/**
 * server.js
 * by john trinh
 *
 * main server file
 */

// -----[IMPORT LIBRARIES / MODULES]-----
import Express from 'express'
import * as bible from './db.js'
import { getDatePretty, computePercentProfanity } from './util.js'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { ipKeyGenerator } from 'express-rate-limit'
import { randomUUID } from 'node:crypto'
import 'dotenv/config'
import turnstileMiddleware from './middleware/turnstile.js'

// set up applications
const app = Express() // express app normal stuff

// middlewareeeee
app.use(Express.static('public'))
app.use(Express.json()) // needed for pushing json data in a post request https://www.geeksforgeeks.org/web-tech/express-js-express-json-function/
app.use(Express.urlencoded({ extended: true }))
app.use(cookieParser())
app.set('view engine', 'ejs')

const ensureAnonIdCookie = (req, res, next) => {
	if (!req.cookies.anon_id) {
		const anonID = randomUUID()
		res.cookie('anon_id', anonID, {
			path: '/',
			maxAge: 1000 * 60 * 60 * 24 * 365,
			httpOnly: true,
			sameSite: 'lax',
		})
		req.cookies.anon_id = anonID
	}
	next()
}

const editLimiter = rateLimit({
	windowMs: 1000 * 60,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => {
		const ip = ipKeyGenerator(req.ip || 'unknown-ip')
		const anonID = req.cookies?.anon_id || 'unknown-anon'
		return `${ip}:${anonID}`
	},
	handler: (req, res) => {
		const resetTime = req.rateLimit?.resetTime
		const retryAfterSec = resetTime
			? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
			: 60
		res.set('Retry-After', String(retryAfterSec))
		console.warn(`[rate-limit] blocked key=${req.rateLimit?.key || 'unknown'} used=${req.rateLimit?.used || 'n/a'} remaining=${req.rateLimit?.remaining || 0} retry_after=${retryAfterSec}s`)
		res.status(429).json({
			error: 'rate_limited',
			retry_after: retryAfterSec,
			message: 'Too many edit submissions. Please try again shortly.',
		})
	},
})

// -----[ROUTES]-----

// default route redirects to genesis 1:1
app.get('/', (req, res) => {
	const currentPath = req.path
	const votd = bible.getRandomEditedVerse()
	console.log(votd.book_id)
	const votdBookName = bible.getBookName(votd.book_id)
	const prettyDate = getDatePretty()
	const randUneditedChapter = bible.getRandomUneditedChapter()
	const overallStats = bible.getOverallStats()
	res.render('index', { votd, votdBookName, prettyDate, randUneditedChapter, currentPath, overallStats })
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

app.get('/patterns', (req, res) => {
	const currentPath = req.path
	res.render('patterns', { currentPath })
})

app.post('/edit', ensureAnonIdCookie, editLimiter, (req, res) => {
	// validate the submitted verse text is not blank or whitespace-only
	const newVerse = req.query.newVerse?.trim()
	const verseID = req.query.verseID

	if (!verseID) {
		res.status(400).send("error: missing verseID")
		return
	}

	if (!newVerse || newVerse.length === 0) {
		res.status(400).send("error: verse text cannot be blank")
		return
	}

	const verseLength = newVerse.split(' ').length
	if (verseLength > 3 && computePercentProfanity(newVerse) > 50) {
		res.status(400).send("error: too much profanity :/")
		return
	}

	// Note: Turnstile validation has been removed from this route.
	bible.saveEdit(verseID, newVerse, req.ip)
	res.send("success!")
})

// listen on port
app.listen(8008, () => {
	console.log('server listening on port 8008!')
	console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
	setInterval(() => {
	}, 1000 * 60 * 60 * 24) // 24 hrs
})
