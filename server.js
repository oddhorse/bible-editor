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
import 'dotenv/config'

const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || ''
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY || ''
const turnstileEnabled = Boolean(turnstileSiteKey && turnstileSecretKey)
const turnstileMisconfigured = Boolean(turnstileSiteKey || turnstileSecretKey) && !turnstileEnabled

const getQueryValue = (value) => Array.isArray(value) ? value[0] : value

const validateTurnstile = async (token, remoteIp) => {
	if (!turnstileEnabled) {
		return { success: true, skipped: true }
	}

	const formData = new FormData()
	formData.append('secret', turnstileSecretKey)
	formData.append('response', token)
	if (remoteIp) formData.append('remoteip', remoteIp)

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 10_000)

	try {
		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			body: formData,
			signal: controller.signal,
		})
		return await response.json()
	} catch (error) {
		console.error('turnstile validation failed', error)
		return { success: false, 'error-codes': ['internal-error'] }
	} finally {
		clearTimeout(timeoutId)
	}
}

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
	res.render('bible', { verses, bookName, bookID, chapterID, prev, next, allBooks, numChapters, chapterEditStats, currentPath, appearanceFont, appearanceSize, randUneditedChapter, turnstileSiteKey })
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

app.post('/edit', async (req, res) => {
	if (turnstileMisconfigured) {
		res.status(500).send('error: turnstile is only partially configured')
		return
	}

	// validate the submitted verse text is not blank or whitespace-only
	const newVerse = getQueryValue(req.query.newVerse)?.trim()
	const verseID = getQueryValue(req.query.verseID)
	const turnstileToken = getQueryValue(req.query['cf-turnstile-response'])

	if (!verseID) {
		res.status(400).send("error: missing verseID")
		return
	}

	if (!newVerse || newVerse.length === 0) {
		res.status(400).send("error: verse text cannot be blank")
		return
	}

	if (turnstileEnabled && !turnstileToken) {
		res.status(400).send('error: missing Turnstile token')
		return
	}

	const remoteIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || undefined

	if (turnstileEnabled) {
		const validation = await validateTurnstile(turnstileToken, remoteIp)

		if (!validation.success) {
			console.log('turnstile rejected edit', validation['error-codes'])
			res.status(403).send('error: Turnstile verification failed')
			return
		}
	}

	bible.saveEdit(verseID, newVerse, remoteIp)
	res.send("success!")
})

// listen on port
app.listen(8008, () => {
	console.log('server listening on port 8008!')
	console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`)
	setInterval(() => {
	}, 1000 * 60 * 60 * 24) // 24 hrs
})
