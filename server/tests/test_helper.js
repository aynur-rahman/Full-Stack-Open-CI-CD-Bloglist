const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'Readable programs',
    author: 'Ada',
    url: 'https://example.com/readable',
    likes: 5,
  },
  {
    title: 'Small interfaces',
    author: 'Grace',
    url: 'https://example.com/interfaces',
    likes: 17,
  },
  {
    title: 'Useful tests',
    author: 'Ada',
    url: 'https://example.com/tests',
    likes: 7,
  },
  {
    title: 'Compiler design',
    author: 'Grace',
    url: 'https://example.com/compiler',
    likes: 5,
  },
  {
    title: 'Debugging',
    author: 'Ada',
    url: 'https://example.com/debugging',
    likes: 2,
  },
  {
    title: 'Systems',
    author: 'Linus',
    url: 'https://example.com/systems',
    likes: 0,
  },
]

const seed = async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('test-password', 4)
  const owner = await new User({
    username: 'owner',
    name: 'Blog Owner',
    passwordHash,
  }).save()
  const other = await new User({
    username: 'other',
    name: 'Other Reader',
    passwordHash,
  }).save()
  const blogs = await Blog.insertMany(
    initialBlogs.slice(0, 2).map((blog) => ({ ...blog, user: owner._id })),
  )
  return { owner, other, blogs }
}

module.exports = { initialBlogs, seed }
