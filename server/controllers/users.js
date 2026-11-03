const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

usersRouter.get('/', async (_request, response) => {
  const users = await User.find({}).populate('blogs', {
    title: 1,
    author: 1,
    url: 1,
    user: 1,
  })
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body || {}
  if (typeof username !== 'string' || username.trim().length < 3) {
    return response
      .status(400)
      .json({ error: 'username must contain at least 3 characters' })
  }
  if (
    typeof password !== 'string' ||
    password.length < 3 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return response.status(400).json({
      error: 'password must contain at least 3 characters and at most 72 bytes',
    })
  }
  if (name !== undefined && typeof name !== 'string') {
    return response.status(400).json({ error: 'name must be a string' })
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await new User({ username, name, passwordHash }).save()
  response.status(201).json(user)
})

module.exports = usersRouter
