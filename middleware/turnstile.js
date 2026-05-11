// Lightweight Turnstile middleware placeholder
// Keeps Turnstile configuration in one place and exposes `req.turnstile`.
// The actual validation implementation is intentionally left as a placeholder
// so you can re-implement or re-enable it later.

export default function turnstileMiddleware(req, res, next) {
	const siteKey = process.env.TURNSTILE_SITE_KEY || ''
	const secretKey = process.env.TURNSTILE_SECRET_KEY || ''
	const enabled = Boolean(siteKey && secretKey)

	// Expose minimal info to views and handlers.
	res.locals.turnstile = { enabled, siteKeyExists: Boolean(siteKey) }

	// Attach a small API on req to make future validation easy to hook in.
	req.turnstile = {
		enabled,
		siteKey,
		secretKey,
		// Placeholder validator — throw if called so it's obvious in tests.
		validateToken: async (token, remoteIp) => {
			throw new Error('Turnstile validation not implemented. Re-enable when ready.')
		},
	}

	next()
}
