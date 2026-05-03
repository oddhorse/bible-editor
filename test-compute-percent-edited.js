/**
 * test-compute-percent-edited.js
 *
 * runnable checks for computePercentEdited in db.js
 */
import assert from 'node:assert/strict'
import * as bibleDb from './db.js'

const cases = [
	{
		name: 'no change',
		oldVerse: 'In the beginning God created.',
		newVerse: 'In the beginning God created.',
		expected: 0,
	},
	{
		name: 'substitution only',
		oldVerse: 'In the beginning God created.',
		newVerse: 'In the beginning God made.',
		expected: 16.7,
	},
	{
		name: 'addition only',
		oldVerse: 'In the beginning God created.',
		newVerse: 'In the beginning God created the heavens and the earth.',
		expected: 45.5,
	},
	{
		name: 'removal only',
		oldVerse: 'In the beginning God created the heavens and the earth.',
		newVerse: 'In the beginning God created.',
		expected: 45.5,
	},
	{
		name: 'mixed add and remove',
		oldVerse: 'In the beginning God created the heavens and the earth.',
		newVerse: 'In the beginning God made the heavens.',
		expected: 36.4,
	},
	{
		name: 'punctuation only',
		oldVerse: 'Hello, world!',
		newVerse: 'Hello world',
		expected: 50,
	},
	{
		name: 'append words',
		oldVerse: 'Blessed are the meek.',
		newVerse: 'Blessed are the meek and lowly.',
		expected: 28.6,
	},
	{
		name: 'truncate words',
		oldVerse: 'Blessed are the meek.',
		newVerse: 'Blessed are.',
		expected: 40,
	},
	{
		name: 'empty to filled',
		oldVerse: '',
		newVerse: 'Let there be light.',
		expected: 100,
	},
	{
		name: 'filled to empty',
		oldVerse: 'Let there be light.',
		newVerse: '',
		expected: 100,
	},
]

for (const testCase of cases) {
	assert.equal(
		typeof bibleDb.computePercentEdited,
		'function',
		'computePercentEdited must be exported from db.js'
	)
	const actual = bibleDb.computePercentEdited(testCase.oldVerse, testCase.newVerse)
	assert.equal(
		actual,
		testCase.expected,
		`${testCase.name} failed: expected ${testCase.expected}, got ${actual}`
	)

	console.log(`ok - ${testCase.name}: ${actual}%`)
}

console.log(`passed ${cases.length} cases`)