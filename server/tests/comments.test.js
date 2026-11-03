process.env.NODE_ENV = 'test'
process.env.SECRET = 'isolated-comments-test-signing-secret'

const { before, after, beforeEach, describe, test } = require('node:test')
const assert = require('node:assert/strict')
const supertest = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const database = require('../utils/database')
const Blog = require('../models/blog')
const helper = require('./test_helper')

const api = supertest(app)
let mongo, blog

before(async () => {
  mongo = await MongoMemoryServer.create()
  await database.connect(mongo.getUri('bloglist_comments_test'))
})
after(async () => {
  await database.disconnect()
  if (mongo) await mongo.stop()
})
beforeEach(async () => {
  blog = (await helper.seed()).blogs[0]
})

describe('anonymous comments', () => {
  test('trims and persists a comment without a token or changing blog fields', async () => {
    const response = await api
      .post(`/api/blogs/${blog.id}/comments`)
      .send({
        comment: '  Useful explanation  ',
        likes: 999,
        user: new mongoose.Types.ObjectId(),
      })
      .expect(201)
      .expect('Content-Type', /application\/json/)
    assert.deepEqual(response.body.comments, ['Useful explanation'])
    assert.equal(response.body.title, blog.title)
    assert.equal(response.body.likes, blog.likes)
    assert.equal(response.body.user.id, blog.user.toString())
    const persisted = await api.get(`/api/blogs/${blog.id}`).expect(200)
    assert.deepEqual(persisted.body.comments, ['Useful explanation'])
    assert.equal(persisted.body.user.passwordHash, undefined)
  })

  test('does not require a valid authorization header', async () => {
    const response = await api
      .post(`/api/blogs/${blog.id}/comments`)
      .set('Authorization', 'Bearer invalid')
      .send({ comment: 'Public comment' })
      .expect(201)
    assert.deepEqual(response.body.comments, ['Public comment'])
  })

  test('concurrent comments are both retained', async () => {
    const comments = ['First independent comment', 'Second independent comment']
    const responses = await Promise.all(
      comments.map((comment) =>
        api.post(`/api/blogs/${blog.id}/comments`).send({ comment }),
      ),
    )
    assert.deepEqual(
      responses.map((response) => response.status),
      [201, 201],
    )
    const saved = await Blog.findById(blog.id)
    assert.deepEqual([...saved.comments].sort(), [...comments].sort())
    assert.equal(saved.likes, blog.likes)
  })

  test('updating likes cannot overwrite existing comments', async () => {
    await api
      .post(`/api/blogs/${blog.id}/comments`)
      .send({ comment: 'Keep this comment' })
      .expect(201)
    const response = await api
      .put(`/api/blogs/${blog.id}`)
      .send({ likes: 10, comments: [] })
      .expect(200)
    assert.equal(response.body.likes, 10)
    assert.deepEqual(response.body.comments, ['Keep this comment'])
  })

  const invalidComments = [
    undefined,
    '',
    '   ',
    null,
    42,
    [],
    { text: 'wrong shape' },
    'x'.repeat(2001),
  ]
  for (const [index, comment] of invalidComments.entries()) {
    test(`rejects invalid comment case ${index + 1} without modifying the blog`, async () => {
      const beforeBlog = JSON.stringify(await Blog.findById(blog.id))
      const response = await api
        .post(`/api/blogs/${blog.id}/comments`)
        .send({ comment })
        .expect(400)
      assert.equal(typeof response.body.error, 'string')
      assert.equal(JSON.stringify(await Blog.findById(blog.id)), beforeBlog)
    })
  }

  test('accepts the maximum permitted comment length', async () => {
    const comment = 'x'.repeat(2000)
    const response = await api
      .post(`/api/blogs/${blog.id}/comments`)
      .send({ comment })
      .expect(201)
    assert.deepEqual(response.body.comments, [comment])
  })

  test('reports missing and malformed blog ids without creating a blog', async () => {
    const count = await Blog.countDocuments()
    await api
      .post(`/api/blogs/${new mongoose.Types.ObjectId()}/comments`)
      .send({ comment: 'Missing blog' })
      .expect(404)
    await api
      .post('/api/blogs/not-an-id/comments')
      .send({ comment: 'Malformed id' })
      .expect(400)
    assert.equal(await Blog.countDocuments(), count)
    assert.deepEqual((await Blog.findById(blog.id)).comments.toObject(), [])
  })
})

test('unknown API routes remain JSON 404 responses even when HTML is accepted', async () => {
  for (const route of ['/api', '/api/missing', '/api/blogs/missing/nested']) {
    const response = await api
      .get(route)
      .set('Accept', 'text/html')
      .expect(404)
      .expect('Content-Type', /application\/json/)
    assert.equal(response.body.error, 'unknown endpoint')
  }
})
