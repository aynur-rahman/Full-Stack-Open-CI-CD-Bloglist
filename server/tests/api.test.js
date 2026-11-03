process.env.NODE_ENV = 'test'
process.env.SECRET = 'isolated-bloglist-test-signing-secret'

const { before, after, beforeEach, describe, test } = require('node:test')
const assert = require('node:assert/strict')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const database = require('../utils/database')
const Blog = require('../models/blog')
const User = require('../models/user')
const helper = require('./test_helper')
const config = require('../utils/config')

const api = supertest(app)
const newBlog = {
  title: 'A new blog',
  author: 'Test Author',
  url: 'https://example.com/new',
  likes: 8,
}
let mongo, data, token, otherToken

before(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.TEST_MONGODB_URI = mongo.getUri('bloglist_test')
  await database.connect(process.env.TEST_MONGODB_URI)
})
after(async () => {
  await database.disconnect()
  if (mongo) await mongo.stop()
})
beforeEach(async () => {
  data = await helper.seed()
  token = (
    await api
      .post('/api/login')
      .send({ username: 'owner', password: 'test-password' })
      .expect(200)
  ).body.token
  otherToken = (
    await api
      .post('/api/login')
      .send({ username: 'other', password: 'test-password' })
      .expect(200)
  ).body.token
})

const create = (body) =>
  api.post('/api/blogs').auth(token, { type: 'bearer' }).send(body)
const remove = (id, accessToken = token) =>
  api.delete(`/api/blogs/${id}`).auth(accessToken, { type: 'bearer' })
const unchangedBlogs = async (operation, status) => {
  const beforeBlogs = JSON.stringify(await Blog.find({}).sort('_id'))
  const response = await operation.expect(status)
  assert.equal(typeof response.body.error, 'string')
  assert.equal(JSON.stringify(await Blog.find({}).sort('_id')), beforeBlogs)
}

describe('public blog reads', () => {
  test('GET returns the exact count as JSON without authentication', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    assert.equal(response.body.length, 2)
    assert.deepEqual(
      response.body.map((b) => b.title).sort(),
      helper.initialBlogs
        .slice(0, 2)
        .map((b) => b.title)
        .sort(),
    )
  })
  test('uses id instead of _id and embeds safe creator information', async () => {
    const { body } = await api.get('/api/blogs').expect(200)
    for (const blog of body) {
      assert.equal(typeof blog.id, 'string')
      assert.equal(blog._id, undefined)
      assert.equal(blog.__v, undefined)
      assert.deepEqual(blog.user, {
        id: data.owner.id,
        username: 'owner',
        name: 'Blog Owner',
      })
    }
  })
  test('GET remains public even with an invalid Authorization header', async () => {
    await api
      .get('/api/blogs')
      .set('Authorization', 'Bearer invalid')
      .expect(200)
  })
  test('fetches one blog and distinguishes missing from malformed ids', async () => {
    const result = await api.get(`/api/blogs/${data.blogs[0].id}`).expect(200)
    assert.equal(result.body.title, helper.initialBlogs[0].title)
    await api.get(`/api/blogs/${new mongoose.Types.ObjectId()}`).expect(404)
    await api.get('/api/blogs/not-an-id').expect(400)
  })
})

describe('authenticated creation', () => {
  test('persists every blog field and increments the count', async () => {
    const result = await create(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    assert.equal(await Blog.countDocuments(), 3)
    const saved = await Blog.findById(result.body.id)
    for (const [key, value] of Object.entries(newBlog))
      assert.equal(saved[key], value)
    assert.equal(saved.user.toString(), data.owner.id)
  })
  test('missing likes defaults to zero', async () => {
    const body = { ...newBlog }
    delete body.likes
    const result = await create(body).expect(201)
    assert.equal(result.body.likes, 0)
    assert.equal((await Blog.findById(result.body.id)).likes, 0)
  })
  for (const field of ['title', 'url']) {
    for (const value of [undefined, '', '   ', null]) {
      test(`rejects ${field}=${JSON.stringify(value)} without insertion`, async () => {
        await unchangedBlogs(create({ ...newBlog, [field]: value }), 400)
      })
    }
  }
  for (const likes of [-1, 1.5, '3', null]) {
    test(`rejects invalid likes ${JSON.stringify(likes)}`, async () => {
      await unchangedBlogs(create({ ...newBlog, likes }), 400)
    })
  }
  test('creator comes from token, never a supplied user or id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const result = await create({
      ...newBlog,
      user: data.other.id,
      _id: fakeId,
      id: fakeId,
    }).expect(201)
    assert.equal(result.body.user.id, data.owner.id)
    assert.notEqual(result.body.id, fakeId)
  })
  test('simultaneous creations both appear in the creator relationship', async () => {
    const results = await Promise.all([
      create(newBlog),
      create({ ...newBlog, title: 'Second concurrent blog' }),
    ])
    results.forEach((r) => assert.equal(r.status, 201))
    const users = (await api.get('/api/users')).body
    assert.equal(users.find((u) => u.id === data.owner.id).blogs.length, 4)
  })
  test('missing token returns 401 and does not insert a blog', async () => {
    await unchangedBlogs(api.post('/api/blogs').send(newBlog), 401)
  })
  for (const authorization of [
    'Bearer invalid',
    'Basic abc',
    'Bearer',
    'Bearer a b',
  ]) {
    test(`rejects invalid Authorization header ${authorization}`, async () => {
      await unchangedBlogs(
        api
          .post('/api/blogs')
          .set('Authorization', authorization)
          .send(newBlog),
        401,
      )
    })
  }
  test('accepts case-insensitive bearer scheme', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
  })
  for (const kind of [
    'expired',
    'wrong signature',
    'missing id',
    'bad id',
    'unknown user',
    'wrong algorithm',
  ]) {
    test(`rejects a token with ${kind}`, async () => {
      const payload = { id: data.owner.id }
      let secret = config.SECRET
      const options = { algorithm: 'HS256' }
      if (kind === 'expired') options.expiresIn = -1
      if (kind === 'wrong signature') secret = 'different-test-secret'
      if (kind === 'missing id') delete payload.id
      if (kind === 'bad id') payload.id = 'invalid'
      if (kind === 'unknown user')
        payload.id = new mongoose.Types.ObjectId().toString()
      if (kind === 'wrong algorithm') options.algorithm = 'HS384'
      const invalidToken = jwt.sign(payload, secret, options)
      await unchangedBlogs(
        api
          .post('/api/blogs')
          .auth(invalidToken, { type: 'bearer' })
          .send(newBlog),
        401,
      )
    })
  }
})

describe('blog updates', () => {
  test('updates likes and keeps fields, id, and creator intact', async () => {
    const original = data.blogs[0]
    const result = await api
      .put(`/api/blogs/${original.id}`)
      .send({ likes: 12, user: data.other.id })
      .expect(200)
    assert.equal(result.body.likes, 12)
    assert.equal(result.body.title, original.title)
    assert.equal(result.body.id, original.id)
    assert.equal(result.body.user.id, data.owner.id)
    assert.equal((await Blog.findById(original.id)).likes, 12)
  })
  test('updates title, author and URL', async () => {
    const result = await api
      .put(`/api/blogs/${data.blogs[0].id}`)
      .send(newBlog)
      .expect(200)
    for (const [key, value] of Object.entries(newBlog))
      assert.equal(result.body[key], value)
  })
  for (const body of [
    { likes: -1 },
    { likes: null },
    { likes: '12' },
    { title: '' },
    { url: '' },
    {},
  ]) {
    test(`rejects invalid update ${JSON.stringify(body)} without modifying database`, async () => {
      await unchangedBlogs(
        api.put(`/api/blogs/${data.blogs[0].id}`).send(body),
        400,
      )
    })
  }
  test('does not create a missing blog and reports malformed ids', async () => {
    await unchangedBlogs(
      api.put(`/api/blogs/${new mongoose.Types.ObjectId()}`).send({ likes: 1 }),
      404,
    )
    await unchangedBlogs(
      api.put('/api/blogs/not-an-id').send({ likes: 1 }),
      400,
    )
  })
})

describe('creator-only deletion', () => {
  test('creator deletes the blog and the populated user list stays consistent', async () => {
    const id = data.blogs[0].id
    await remove(id).expect(204)
    assert.equal(await Blog.countDocuments(), 1)
    assert.equal(await Blog.findById(id), null)
    const users = (await api.get('/api/users').expect(200)).body
    assert.equal(users.find((u) => u.id === data.owner.id).blogs.length, 1)
  })
  test('another user cannot delete the blog', async () => {
    await unchangedBlogs(remove(data.blogs[0].id, otherToken), 403)
  })
  test('missing and invalid tokens cannot delete', async () => {
    await unchangedBlogs(api.delete(`/api/blogs/${data.blogs[0].id}`), 401)
    await unchangedBlogs(remove(data.blogs[0].id, 'invalid'), 401)
  })
  test('malformed and nonexistent ids return errors without other changes', async () => {
    await unchangedBlogs(remove('not-an-id'), 400)
    await unchangedBlogs(remove(new mongoose.Types.ObjectId().toString()), 404)
  })
  test('a token for a deleted user no longer grants access', async () => {
    await User.findByIdAndDelete(data.owner.id)
    await unchangedBlogs(remove(data.blogs[0].id), 401)
  })
})

describe('user administration', () => {
  test('creates a user with bcrypt hash and never exposes the hash', async () => {
    const result = await api
      .post('/api/users')
      .send({
        username: 'newuser',
        name: 'New User',
        password: 'safe-password',
      })
      .expect(201)
    assert.equal(await User.countDocuments(), 3)
    const saved = await User.findById(result.body.id).select('+passwordHash')
    assert(await bcrypt.compare('safe-password', saved.passwordHash))
    assert.equal(bcrypt.getRounds(saved.passwordHash), 10)
    assert.equal(result.body.passwordHash, undefined)
    assert.equal(result.body.password, undefined)
    const raw = await User.collection.findOne({ _id: saved._id })
    assert.equal(raw.password, undefined)
  })
  test('three-character username and password are accepted', async () => {
    await api
      .post('/api/users')
      .send({ username: 'abc', password: 'xyz' })
      .expect(201)
  })
  const invalidUsers = [
    {},
    { username: 'newuser' },
    { password: 'secret' },
    { username: 'ab', password: 'secret' },
    { username: '  a ', password: 'secret' },
    { username: 'newuser', password: 'ab' },
    { username: 123, password: 'secret' },
    { username: 'newuser', password: 123 },
    { username: 'newuser', password: null },
    { username: 'newuser', password: 'a'.repeat(73) },
    { username: 'newuser', password: 'é'.repeat(37) },
    { username: 'owner', password: 'secret' },
    { username: ' owner ', password: 'secret' },
  ]
  for (const [index, body] of invalidUsers.entries()) {
    test(`invalid user case ${index + 1} returns 400 and inserts nothing`, async () => {
      const count = await User.countDocuments()
      const response = await api.post('/api/users').send(body).expect(400)
      assert.equal(typeof response.body.error, 'string')
      assert.equal(await User.countDocuments(), count)
    })
  }
  test('database unique index handles concurrent duplicate registration', async () => {
    const body = { username: 'concurrent', password: 'test-password' }
    const responses = await Promise.all([
      api.post('/api/users').send(body),
      api.post('/api/users').send(body),
    ])
    assert.deepEqual(responses.map((r) => r.status).sort(), [201, 400])
    assert.equal(await User.countDocuments({ username: 'concurrent' }), 1)
  })
  test('public user listing populates blogs and excludes password data', async () => {
    const result = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    assert.equal(result.body.length, 2)
    const owner = result.body.find((user) => user.id === data.owner.id)
    assert.equal(owner.blogs.length, 2)
    assert.equal(owner.blogs[0].title, data.blogs[0].title)
    assert.equal(typeof owner.blogs[0].id, 'string')
    assert.deepEqual(
      result.body.find((user) => user.id === data.other.id).blogs,
      [],
    )
    assert(!JSON.stringify(result.body).includes('password'))
  })
})

describe('login and middleware', () => {
  test('valid login returns a signed expiring token for the right user', async () => {
    const result = await api
      .post('/api/login')
      .send({ username: 'owner', password: 'test-password' })
      .expect(200)
    const decoded = jwt.verify(result.body.token, config.SECRET)
    assert.equal(decoded.id, data.owner.id)
    assert.equal(decoded.username, 'owner')
    assert.equal(decoded.exp - decoded.iat, 3600)
    assert.equal(result.body.name, 'Blog Owner')
    assert.equal(result.body.passwordHash, undefined)
  })
  for (const body of [
    { username: 'owner', password: 'wrong' },
    { username: 'unknown', password: 'wrong' },
    {},
    { username: { $ne: null }, password: 'test-password' },
  ]) {
    test(`invalid login ${JSON.stringify(body)} returns 401 without token`, async () => {
      const result = await api.post('/api/login').send(body).expect(401)
      assert.equal(result.body.error, 'invalid username or password')
      assert.equal(result.body.token, undefined)
    })
  }
  test('unknown endpoint and malformed JSON have JSON errors', async () => {
    await api
      .get('/api/unknown')
      .expect(404)
      .expect('Content-Type', /application\/json/)
    await api
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400)
  })
  test('supports CORS for the next part frontend', async () => {
    await api
      .options('/api/blogs')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204)
      .expect('Access-Control-Allow-Origin', '*')
  })
})
