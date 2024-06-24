let containers
let containerCacheTime = 0

export default {
	async fetch(request, env) {
		const url = new URL(request.url)
		if (Date.now() - containerCacheTime > 20000) {
			containers = null
		}

		if (!containers) {
			containerCacheTime = Date.now()
			console.log("fetching containers")

			const containersRes = await (
				await env.docker.fetch("http://localhost/containers/json")
			).json()

			containers = { all: {} }

			containersRes.forEach((container) => {
				container.ports = []
				for (const port of container.Ports) {
					if (port.PublicPort && port.Type === "tcp") {
						container.ports.push({
							public: port.PublicPort,
							private: port.PrivatePort,
						})
					}
				}

				container.project = container.Labels["com.docker.compose.project"]
				container.service = container.Labels["com.docker.compose.service"]
				container.cors = container.Labels["com.opral.lix.cors"]
				if (containers.all[container.service]) {
					container.service = container.service + "_" + container.project
				}
				container.state = container.State
				if (!containers[container.project]) {
					containers[container.project] = []
				}
				containers[container.project].push(container)
				containers.all[container.service] = container
			})
		}

		if (url.hostname !== "localhost") {
			const serviceName = url.hostname.split(".")[0]
			url.hostname = serviceName
			url.port = containers.all[serviceName].ports[0]?.private

			const newReq = new Request(url.href, request)

			if (serviceName === "gitea" && newReq.method === "OPTIONS") {
				const headers = new Headers()
				headers.set("Access-Control-Allow-Origin", "http://exp.localhost")
				headers.set("Access-Control-Allow-Credentials", "true")
				headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
				headers.set(
					"Access-Control-Allow-Headers",
					"DNT,X-CustomHeader,Keep-Alive,User-Agent,X-newResuested-With,If-Modified-Since,Cache-Control,Content-Type,git-protocol,token"
				)
				headers.set("Access-Control-Max-Age", 1728000)
				headers.set("Content-Type", "text/plain charset=UTF-8")
				headers.set("Content-Length", 0)

				return new Response("", { headers, status: 204 })
			}

			return fetch(newReq)
				.catch((err) => {
					containers = null
					return new Response(JSON.stringify(err) + url.href, { status: 500 })
				})
				.then((res) => {
					if (serviceName === "gitea") {
						return addCorsHeaders(res)
					} else {
						return res
					}
				})
		}

		const html = `
<!DOCTYPE html>
<head>
	<link rel="stylesheet" href="https://matcha.mizu.sh/matcha.css">
</head>
<html>
	<body>
		<section>
			${Object.keys(containers)
				.map((project) =>
					project === "all" ? "" : `<h2>${project}</h2>${renderContainers(containers[project])}`
				)
				.join("")}
		</section>
	</body>
</html>
`
		return new Response(html, { headers: { "content-type": "text/html" } })
	},
}

function renderContainers(containers) {
	return `${containers
		.sort((a, b) => b.state - a.state || b.ports.length - a.ports.length)
		.map(
			(container) =>
				`<article><header><h3>${container.service} ${
					container.state === "running" ? "" : "(" + container.state + ")"
				}</h3></header><p>${renderPorts(container)}</p><p>${
					container.cors ? "cors: " + container.cors : ""
				}</p></article>`
		)
		.join("")}`
}

function renderPorts(container) {
	return container.ports.length
		? `<a href="http://${container.service}.localhost">${container.service}.localhost</a> > <a href="http://localhost:${container.ports[0]?.public}">localhost:${container.ports[0]?.public}</a> > internal:${container.ports[0]?.private}`
		: ""
}

function addCorsHeaders(res) {
	const headers = new Headers(res.headers)
	headers.set("Access-Control-Allow-Origin", "http://exp.localhost")
	headers.set("Access-Control-Allow-Credentials", "true")
	headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
	headers.set(
		"Access-Control-Allow-Headers",
		"DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,git-protocol,token"
	)
	return new Response(res.body, { headers, status: res.status, statusText: res.statusText })
}
