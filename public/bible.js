/**
 * bible.js
 * by john trinh
 * bible reader client side scripting
 */

const submitEdit = async (verseID, newVerse) => {
	const params = new URLSearchParams({
		verseID: verseID,
		newVerse: newVerse,
	})
	const url = '/edit?' + params
	return await fetch(url, { method: "POST" })
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
	if (response.ok) verseEl.dataset.isEdited = "true"
	console.log(text)
}

const isCurrentlyEditing = () => {
	const focusedEl = document.activeElement
	return (focusedEl.contentEditable && focusedEl.classList.contains("verse-text"))
}

const setAppearanceSizeOption = (val) => {
	const mainEl = document.getElementsByTagName("main")[0]
	mainEl.dataset.appearanceSize = val


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
		if (apprBtn) {

			apprPanel.hidden = false
		}
		else if (!apprPnlQ) apprPanel.hidden = true
		else if (apprPnlQ) {
			const apprFontSerif = ev.target.closest("#appr-font-serif")
			const apprFontSans = ev.target.closest("#appr-font-sans")
			const apprSzSm = ev.target.closest("#appr-sz-sm")
			const apprSzMd = ev.target.closest("#appr-sz-md")
			const apprSzLg = ev.target.closest("#appr-sz-lg")
			if (apprFontSerif) mainEl.dataset.appearanceFont = "serif"
			else if (apprFontSans) mainEl.dataset.appearanceFont = "sans"
			else if (apprSzSm) mainEl.dataset.appearanceSize = "sm"
			else if (apprSzMd) mainEl.dataset.appearanceSize = "md"
			else if (apprSzLg) mainEl.dataset.appearanceSize = "lg"
		}

	})
})

