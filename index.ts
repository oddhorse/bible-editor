import ejs from 'ejs'

Bun.serve({
	port: 8008,

	// routes
	routes: {
		'/': async () => {
			const html = await ejs.renderFile('./views/index.ejs')
			return new Response(html, {
				headers: { 'Content-Type': 'text/html' },
			})
		},
	},

	// static file fallback - serves anything under /public/
	async fetch(req) {
		const url = new URL(req.url)
		const file = Bun.file('./public' + url.pathname)
		if (await file.exists()) return new Response(file)
		return new Response('Not Found', { status: 404 })
	},

	development: { hmr: true, console: true },
})

console.log('server listening on port 8008!')