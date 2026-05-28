const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.env.PORT || 3000)
const publicDir = path.join(__dirname, 'public')

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const requested = url.pathname === '/' ? '/index.html' : url.pathname
  const filePath = path.normalize(path.join(publicDir, requested))

  if (!filePath.startsWith(publicDir)) {
    send(res, 403, 'Forbidden')
    return
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(publicDir, 'index.html'), (fallbackError, fallback) => {
        if (fallbackError) send(res, 404, 'Not found')
        else send(res, 200, fallback, types['.html'])
      })
      return
    }

    send(res, 200, data, types[path.extname(filePath)] || 'application/octet-stream')
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Aprenda+ frontend rodando em http://localhost:${PORT}`)
})
