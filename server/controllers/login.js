const loginRouter = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('../utils/config')

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body || {}
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return response.status(401).json({ error: 'invalid username or password' })
  }
  const user = await User.findOne({ username: username.trim() }).select(
    '+passwordHash',
  )
  const correct = user && (await bcrypt.compare(password, user.passwordHash))
  if (!correct)
    return response.status(401).json({ error: 'invalid username or password' })
  const token = jwt.sign(
    { username: user.username, id: user.id },
    config.SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  )
  response.json({ token, username: user.username, name: user.name })
})

module.exports = loginRouter
