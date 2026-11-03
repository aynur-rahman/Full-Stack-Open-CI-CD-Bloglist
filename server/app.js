const express = require('express')
const cors = require('cors')
const path = require('node:path')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')

const mongoose = require('mongoose')
const app = express()
app.get('/health', async (request, response) => {
  response.set('Cache-Control', 'no-store')
  try {
    if (mongoose.connection.readyState !== 1) return response.status(503).type('text').send('unavailable')
    await mongoose.connection.db.admin().ping({ timeoutMS: 3000 })
    response.type('text').send('ok')
  } catch {
    response.status(503).type('text').send('unavailable')
  }
})
app.get('/version', (request, response) => {
  response.set('Cache-Control', 'no-store').type('text').send(process.env.RENDER_GIT_COMMIT || process.env.APP_REVISION || 'local')
})
app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)
app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
const dist = path.join(__dirname, 'dist')
app.use(express.static(dist))
app.get('/{*splat}', (request, response, next) => {
  if (
    request.path === '/api' ||
    request.path.startsWith('/api/') ||
    path.extname(request.path) ||
    !request.accepts('html')
  )
    return next()
  response.sendFile(path.join(dist, 'index.html'), (error) => {
    if (error) next(error)
  })
})
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
