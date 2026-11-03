const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

const validFields = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false
  for (const field of ['title', 'author', 'url']) {
    if (body[field] !== undefined && typeof body[field] !== 'string')
      return false
  }
  return (
    body.likes === undefined ||
    (Number.isInteger(body.likes) && body.likes >= 0)
  )
}

blogsRouter.get('/', async (_request, response) => {
  response.json(await Blog.find({}).populate('user', { username: 1, name: 1 }))
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id).populate('user', {
    username: 1,
    name: 1,
  })
  if (!blog) return response.status(404).json({ error: 'blog not found' })
  response.json(blog)
})

blogsRouter.post('/', userExtractor, async (request, response) => {
  if (!validFields(request.body))
    return response.status(400).json({ error: 'invalid blog fields' })
  const { title, author, url, likes } = request.body
  const blog = await new Blog({
    title,
    author,
    url,
    likes,
    user: request.user._id,
  }).save()
  await blog.populate('user', { username: 1, name: 1 })
  response.status(201).json(blog)
})

blogsRouter.put('/:id', async (request, response) => {
  if (!validFields(request.body))
    return response.status(400).json({ error: 'invalid blog fields' })
  const updates = {}
  for (const field of ['title', 'author', 'url', 'likes']) {
    if (request.body[field] !== undefined) updates[field] = request.body[field]
  }
  if (!Object.keys(updates).length)
    return response.status(400).json({ error: 'no blog fields to update' })
  const blog = await Blog.findByIdAndUpdate(request.params.id, updates, {
    returnDocument: 'after',
    runValidators: true,
  }).populate('user', { username: 1, name: 1 })
  if (!blog) return response.status(404).json({ error: 'blog not found' })
  response.json(blog)
})

blogsRouter.post('/:id/comments', async (request, response) => {
  const comment = request.body?.comment
  if (
    typeof comment !== 'string' ||
    !comment.trim() ||
    comment.trim().length > 2000
  ) {
    return response
      .status(400)
      .json({ error: 'Comment must contain between 1 and 2000 characters' })
  }
  const blog = await Blog.findByIdAndUpdate(
    request.params.id,
    { $push: { comments: comment.trim() } },
    { returnDocument: 'after', runValidators: true },
  ).populate('user', { username: 1, name: 1 })
  if (!blog) return response.status(404).json({ error: 'blog not found' })
  response.status(201).json(blog)
})

blogsRouter.delete('/:id', userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!blog) return response.status(404).json({ error: 'blog not found' })
  if (blog.user.toString() !== request.user.id) {
    return response
      .status(403)
      .json({ error: 'only the creator can delete this blog' })
  }
  await Blog.findByIdAndDelete(blog._id)
  response.status(204).end()
})

module.exports = blogsRouter
