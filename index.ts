// libs
import Express from 'express'
import Database from 'better-sqlite3'

const db = new Database('./data/kjv.db')

const verses = db.prepare(`
  SELECT chapter, verse, text 
  FROM KJV_verses 
  WHERE book_id = 1 
  ORDER BY chapter, verse
`).all()

// set up applications
const app = Express() // express app normal stuff

// middlewareeeee
app.use(Express.static('public'))
app.use(Express.json()) // needed for pushing json data in a post request https://www.geeksforgeeks.org/web-tech/express-js-express-json-function/
app.use(Express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')


// routes
app.get('/', (req, res) => {
	const verses = db.prepare(`
    SELECT chapter, verse, text FROM KJV_verses WHERE book_id = 1 ORDER BY chapter, verse
  `).all()
	res.render('index', { verses })
})

// listen on port
app.listen(8008, () => {
	console.log('server listening on port 8008!')
})