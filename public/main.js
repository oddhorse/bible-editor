/**
 * main.js
 * by john trinh
 * main client side scripting
 */

const books = {
	'1': { name: 'Genesis', chapters: 50 },
	'2': { name: 'Exodus', chapters: 40 },
	'3': { name: 'Leviticus', chapters: 27 },
	'4': { name: 'Numbers', chapters: 36 },
	'5': { name: 'Deuteronomy', chapters: 34 },
	'6': { name: 'Joshua', chapters: 24 },
	'7': { name: 'Judges', chapters: 21 },
	'8': { name: 'Ruth', chapters: 4 },
	'9': { name: 'I Samuel', chapters: 31 },
	'10': { name: 'II Samuel', chapters: 24 },
	'11': { name: 'I Kings', chapters: 22 },
	'12': { name: 'II Kings', chapters: 25 },
	'13': { name: 'I Chronicles', chapters: 29 },
	'14': { name: 'II Chronicles', chapters: 36 },
	'15': { name: 'Ezra', chapters: 10 },
	'16': { name: 'Nehemiah', chapters: 13 },
	'17': { name: 'Esther', chapters: 10 },
	'18': { name: 'Job', chapters: 42 },
	'19': { name: 'Psalms', chapters: 150 },
	'20': { name: 'Proverbs', chapters: 31 },
	'21': { name: 'Ecclesiastes', chapters: 12 },
	'22': { name: 'Song of Solomon', chapters: 8 },
	'23': { name: 'Isaiah', chapters: 66 },
	'24': { name: 'Jeremiah', chapters: 52 },
	'25': { name: 'Lamentations', chapters: 5 },
	'26': { name: 'Ezekiel', chapters: 48 },
	'27': { name: 'Daniel', chapters: 12 },
	'28': { name: 'Hosea', chapters: 14 },
	'29': { name: 'Joel', chapters: 3 },
	'30': { name: 'Amos', chapters: 9 },
	'31': { name: 'Obadiah', chapters: 1 },
	'32': { name: 'Jonah', chapters: 4 },
	'33': { name: 'Micah', chapters: 7 },
	'34': { name: 'Nahum', chapters: 3 },
	'35': { name: 'Habakkuk', chapters: 3 },
	'36': { name: 'Zephaniah', chapters: 3 },
	'37': { name: 'Haggai', chapters: 2 },
	'38': { name: 'Zechariah', chapters: 14 },
	'39': { name: 'Malachi', chapters: 4 },
	'40': { name: 'Matthew', chapters: 28 },
	'41': { name: 'Mark', chapters: 16 },
	'42': { name: 'Luke', chapters: 24 },
	'43': { name: 'John', chapters: 21 },
	'44': { name: 'Acts', chapters: 28 },
	'45': { name: 'Romans', chapters: 16 },
	'46': { name: 'I Corinthians', chapters: 16 },
	'47': { name: 'II Corinthians', chapters: 13 },
	'48': { name: 'Galatians', chapters: 6 },
	'49': { name: 'Ephesians', chapters: 6 },
	'50': { name: 'Philippians', chapters: 4 },
	'51': { name: 'Colossians', chapters: 4 },
	'52': { name: 'I Thessalonians', chapters: 5 },
	'53': { name: 'II Thessalonians', chapters: 3 },
	'54': { name: 'I Timothy', chapters: 6 },
	'55': { name: 'II Timothy', chapters: 4 },
	'56': { name: 'Titus', chapters: 3 },
	'57': { name: 'Philemon', chapters: 1 },
	'58': { name: 'Hebrews', chapters: 13 },
	'59': { name: 'James', chapters: 5 },
	'60': { name: 'I Peter', chapters: 5 },
	'61': { name: 'II Peter', chapters: 3 },
	'62': { name: 'I John', chapters: 5 },
	'63': { name: 'II John', chapters: 1 },
	'64': { name: 'III John', chapters: 1 },
	'65': { name: 'Jude', chapters: 1 },
	'66': { name: 'Revelation of John', chapters: 22 }
}

const submitEdit = async (verseID, newVerse) => {
	const params = new URLSearchParams({
		verseID: verseID,
		newVerse: newVerse,
	})
	const url = '/edit?' + params
	return await fetch(url)
}

const enableVerseEdit = (verseEl) => {
	verseEl.contentEditable = true
	// saves original text as html attr so we can validate it when done editing
	verseEl.dataset.origText = verseEl.innerText
	verseEl.focus()
}

/**
 * disables editable verse, validates result, and submits edit to server
 * @param {HTMLSpanElement} verseEl - bible verse
 * @returns 
 */
const disableVerseEdit = async (verseEl) => {
	const origText = verseEl.dataset.origText
	console.log(`began: "${origText}"
		submitted: "${verseEl.innerText}"`)

	verseEl.contentEditable = false
	if (verseEl.innerText === origText) {
		console.log("no change made in text... not submitting to server!")
		return
	}
	if (verseEl.innerText === "") {
		verseEl.innerText = origText
		return
	}
	const response = await submitEdit(verseEl.dataset.verseId, verseEl.innerText)
	const okay = response.ok
	const text = await response.text()
	if (response.ok) verseEl.dataset.isEdited = "1"
	console.log(text)
}



window.addEventListener('load', () => {

	const bookSel = document.getElementById("book-select")
	// https://stackoverflow.com/questions/5024056/how-to-pass-parameters-on-onchange-of-html-select
	bookSel.addEventListener('change', (ev) => {
		window.location.href = `/${ev.target.value}/1`
	})

	const currentBookID = document.body.dataset.bookId
	const chaptSel = document.getElementById("chapter-select")
	chaptSel.addEventListener('change', (ev) => {
		window.location.href = `/${currentBookID}/${ev.target.value}`
	})



	const isCurrentlyEditing = () => {
		const focusedEl = document.activeElement
		return (focusedEl.contentEditable && focusedEl.classList.contains("verse-text"))
	}

	// any time an element is clicked, this runs
	document.addEventListener("mousedown", (ev) => {
		const textEl = ev.target.closest(".verse-text")
		const numEl = ev.target.closest(".verse-num")
		const wingNavEl = ev.target.closest("#wing-nav>a")
		if (textEl && textEl.contentEditable !== true) {
			enableVerseEdit(textEl)
		} else if (numEl) {
			// https://stackoverflow.com/questions/12154954/how-to-make-element-not-lose-focus-when-button-is-pressed
			ev.preventDefault() // supresses defocusing of currently focused element
			enableVerseEdit(numEl.nextElementSibling)
		}
	})

	// every time any element is unfocused, this runs
	document.addEventListener("focusout", (ev) => {
		if (ev.target.classList.contains("verse-text")) {
			disableVerseEdit(ev.target)
		}
	})
})

