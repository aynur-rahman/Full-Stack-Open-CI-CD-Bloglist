const mongoose = require('mongoose')
const Blog = require('../models/blog')
const User = require('../models/user')

mongoose.set('bufferCommands', false)

const connect = async (uri) => {
  if (!uri) throw new Error('MONGODB_URI is required')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  await Promise.all([Blog.init(), User.init()])
}
const disconnect = () => mongoose.disconnect()

module.exports = { connect, disconnect }
