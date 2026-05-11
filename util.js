/**
 * util.js
 * by john trinh
 * all that
 */

import { regexp as profanity } from 'badwords-list'

/**
 * INCLUSIVE MIN EXCLUSIVE MAX
 * @param {number} min - inclusive :3
 * @param {number} max - exclusive :3
 * @returns the integer
 */
export const getRandomIntBetween = (min, max) => Math.floor(Math.random() * (max - min)) + min

export const getDatePretty = (date = new Date()) => date.toLocaleDateString('en-US', {
	month: 'long',
	day: 'numeric',
	year: 'numeric',
})

export const roundToDec = (num, decs = 1) => {
	const exp = Math.pow(10, decs)
	return Math.round(num * exp) / exp
}

export const computePercentProfanity = (str) => {
	const total = str.split(' ').length
	console.log(str.match(profanity))
	const matchList = str.match(profanity)
	let matchCount = 0
	if (matchList) matchCount = matchList.length
	return roundToDec(matchCount / total * 100)
}