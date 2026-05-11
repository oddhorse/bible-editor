/**
 * bible.js
 * by john trinh
 * bible reader client side scripting
 */

// client script (Turnstile removed; kept core editing flow)

const submitEdit = async (verseID, newVerse) => {
	const params = new URLSearchParams({
		verseID: verseID,
		newVerse: newVerse,
	})
	const url = '/edit?' + params
	return await fetch(url, { method: 'POST' })
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
	if (verseEl.dataset.submitState === 'submitting') {
		return
	}

	const origText = verseEl.dataset.origText
	const submittedText = verseEl.innerText.trim()
	const origTextTrimmed = origText.trim()
	verseEl.dataset.submitState = 'submitting'

	console.log(`began: "${origText}"
		submitted: "${verseEl.innerText}"`)

	verseEl.contentEditable = false

	// no change made to text
	if (submittedText === origTextTrimmed) {
		console.log("no change made in text... not submitting to server!")
		verseEl.dataset.submitState = ''
		return
	}

	// text is blank or only whitespace
	if (submittedText === "") {
		console.log("text is blank... reverting to original!")
		verseEl.innerText = origText
		verseEl.dataset.submitState = ''
		return
	}

	// submit to server
	try {
		const response = await submitEdit(verseEl.dataset.verseId, submittedText)
		const text = await response.text()

		if (response.ok) {
			// server accepted the edit
			verseEl.dataset.isEdited = "true"
			console.log("edit submitted successfully")
		} else {
			// server rejected the edit
			console.error(`edit rejected: ${text}`)
			verseEl.innerText = origText
			alert(`Edit failed: ${text}`)
		}
	} finally {
		verseEl.dataset.submitState = ''
	}
}

const isCurrentlyEditing = () => {
	const focusedEl = document.activeElement
	return (focusedEl.contentEditable && focusedEl.classList.contains("verse-text"))
}

const setAppearanceSizeOption = (val) => {
	document.body.dataset.appearanceSize = val
	const maxAge = 365 * 24 * 60 * 60
	document.cookie = `appearanceSize=${val}; Path=/; Max-Age=${maxAge}`
	validateAppearanceSizeOptions(val)
}

const validateAppearanceSizeOptions = (val) => {
	if (val === "sm") {
		document.getElementById("appr-sz-sm").ariaSelected = true
		document.getElementById("appr-sz-md").ariaSelected = false
		document.getElementById("appr-sz-lg").ariaSelected = false
	} else if (val === "md") {
		document.getElementById("appr-sz-sm").ariaSelected = false
		document.getElementById("appr-sz-md").ariaSelected = true
		document.getElementById("appr-sz-lg").ariaSelected = false
	} else if (val === "lg") {
		document.getElementById("appr-sz-sm").ariaSelected = false
		document.getElementById("appr-sz-md").ariaSelected = false
		document.getElementById("appr-sz-lg").ariaSelected = true
	}
}

const setAppearanceFontOption = (val) => {
	document.body.dataset.appearanceFont = val
	const maxAge = 365 * 24 * 60 * 60
	document.cookie = `appearanceFont=${val}; Path=/; Max-Age=${maxAge}`
	validateAppearanceFontOptions(val)
}

const validateAppearanceFontOptions = (val) => {
	if (val === "sans") {
		document.getElementById("appr-font-sans").ariaSelected = true
		document.getElementById("appr-font-serif").ariaSelected = false
	} else if (val === "serif") {
		document.getElementById("appr-font-sans").ariaSelected = false
		document.getElementById("appr-font-serif").ariaSelected = true
	}
}

const displayError = (msg) => {
	const toastEl = document.getElementById('toast')
	const toastMsgEl = document.getElementById('toast-msg')
	toastEl.hidden = false
	toastEl.style.opacity = 1
	toastMsgEl.innerText = msg
	setTimeout(() => {
		toastEl.style.opacity = 0
		setTimeout(() => {
			toastEl.hidden = true
			toastMsgEl.innerText = ""
		}, 500)
	}, 3000)
}



window.addEventListener('load', () => {
	// Turnstile client has been removed; keep normal load initialization

	// set user-selected choices in appearance panel
	validateAppearanceFontOptions(document.body.dataset.appearanceFont)
	validateAppearanceSizeOptions(document.body.dataset.appearanceSize)

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

	// ends edit on enter
	document.addEventListener("keydown", (ev) => {
		if (ev.key === "Enter" && isCurrentlyEditing()) {
			const verseEl = document.activeElement
			verseEl.blur()
			disableVerseEdit(verseEl)
		}
		// console.log(`key pressed! ${ev.key}`)
	})

	// every time any element is unfocused, this runs
	document.addEventListener("focusout", (ev) => {
		if (ev.target.classList.contains("verse-text")) {
			disableVerseEdit(ev.target)
		}
	})

	const apprBtn = document.getElementById("appearance-btn")
	const apprPanel = document.getElementById("appearance-panel")
	const mainEl = document.getElementsByTagName("main")[0]
	document.addEventListener("click", (ev) => {
		const apprBtn = ev.target.closest("#appearance-btn")
		const apprPnlQ = ev.target.closest("#appearance-panel")
		if (apprBtn) apprPanel.toggleAttribute("hidden")
		else if (!apprPnlQ) apprPanel.hidden = true
		else if (apprPnlQ) {
			const apprFontSerif = ev.target.closest("#appr-font-serif")
			const apprFontSans = ev.target.closest("#appr-font-sans")
			const apprSzSm = ev.target.closest("#appr-sz-sm")
			const apprSzMd = ev.target.closest("#appr-sz-md")
			const apprSzLg = ev.target.closest("#appr-sz-lg")
			if (apprFontSerif) setAppearanceFontOption("serif")
			else if (apprFontSans) setAppearanceFontOption("sans")
			else if (apprSzSm) setAppearanceSizeOption("sm")
			else if (apprSzMd) setAppearanceSizeOption("md")
			else if (apprSzLg) setAppearanceSizeOption("lg")
		}
	})

	const statDetail = document.getElementById("verse-stats-detail")
	document.addEventListener("click", (ev) => {
		const statBtn = ev.target.closest("#verse-stats-clickme")
		if (statBtn) statDetail.toggleAttribute("hidden")
	})
})

