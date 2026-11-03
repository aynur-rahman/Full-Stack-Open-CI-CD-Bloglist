const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/user')
const config = require('./config')
const logger = require('./logger')

const requestLogger = (request, _response, next) => {
  logger.info(request.method, request.path)
  next()
}

const tokenExtractor = (request, _response, next) => {
  const match = request.get('authorization')?.match(/^Bearer\s+(\S+)$/i)
  request.token = match ? match[1] : null
  next()
}

const userExtractor = async (request, response, next) => {
  if (!request.token)
    return response.status(401).json({ error: 'token missing or invalid' })
  const decoded = jwt.verify(request.token, config.SECRET, {
    algorithms: ['HS256'],
  })
  if (
    typeof decoded !== 'object' ||
    !mongoose.isObjectIdOrHexString(decoded.id)
  ) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decoded.id)
  if (!user)
    return response.status(401).json({ error: 'token user no longer exists' })
  request.user = user
  next()
}

const unknownEndpoint = (_request, response) =>
  response.status(404).json({ error: 'unknown endpoint' })

const errorHandler = (error, _request, response, next) => {
  if (response.headersSent) return next(error)
  if (error.name === 'CastError')
    return response.status(400).json({ error: 'malformatted id or value' })
  if (error.name === 'ValidationError')
    return response.status(400).json({ error: error.message })
  if (error.code === 11000)
    return response.status(400).json({ error: 'username must be unique' })
  if (error.name === 'TokenExpiredError')
    return response.status(401).json({ error: 'token expired' })
  if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  if (error.type === 'entity.parse.failed')
    return response.status(400).json({ error: 'invalid JSON' })
  if (error.type === 'entity.too.large')
    return response.status(413).json({ error: 'request body too large' })
  logger.error('Request failed:', error.name)
  response.status(500).json({ error: 'internal server error' })
}

module.exports = {
  requestLogger,
  tokenExtractor,
  userExtractor,
  unknownEndpoint,
  errorHandler,
}
