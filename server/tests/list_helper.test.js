const { describe, test } = require('node:test')
const assert = require('node:assert/strict')
const helper = require('../utils/list_helper')
const { initialBlogs: blogs } = require('./test_helper')

const one = [blogs[0]]

describe('dummy', () => {
  test('always returns one', () => {
    assert.equal(helper.dummy([]), 1)
    assert.equal(helper.dummy(blogs), 1)
  })
})

describe('totalLikes', () => {
  test('empty list has zero likes', () =>
    assert.equal(helper.totalLikes([]), 0))
  test('one blog returns its likes', () =>
    assert.equal(helper.totalLikes(one), 5))
  test('sums every blog', () => assert.equal(helper.totalLikes(blogs), 36))
})

describe('favoriteBlog', () => {
  test('empty list has no favorite', () =>
    assert.equal(helper.favoriteBlog([]), null))
  test('one blog is the favorite', () =>
    assert.deepEqual(helper.favoriteBlog(one), blogs[0]))
  test('returns the whole blog with most likes', () =>
    assert.deepEqual(helper.favoriteBlog(blogs), blogs[1]))
  test('ties return one of the tied blogs', () =>
    assert.deepEqual(helper.favoriteBlog([blogs[0], blogs[3]]), blogs[0]))
  test('zero likes still has a favorite', () =>
    assert.deepEqual(helper.favoriteBlog([blogs[5]]), blogs[5]))
})

describe('mostBlogs', () => {
  test('empty list has no author', () =>
    assert.equal(helper.mostBlogs([]), null))
  test('one blog belongs to its author', () =>
    assert.deepEqual(helper.mostBlogs(one), { author: 'Ada', blogs: 1 }))
  test('counts blogs per author', () =>
    assert.deepEqual(helper.mostBlogs(blogs), { author: 'Ada', blogs: 3 }))
  test('ties select a top author', () =>
    assert.deepEqual(helper.mostBlogs(blogs.slice(0, 2)), {
      author: 'Ada',
      blogs: 1,
    }))
  test('handles author names that are object property names', () => {
    assert.deepEqual(
      helper.mostBlogs([
        { author: '__proto__' },
        { author: '__proto__' },
        { author: 'constructor' },
      ]),
      { author: '__proto__', blogs: 2 },
    )
  })
})

describe('mostLikes', () => {
  test('empty list has no author', () =>
    assert.equal(helper.mostLikes([]), null))
  test('one blog contributes all its likes', () =>
    assert.deepEqual(helper.mostLikes(one), { author: 'Ada', likes: 5 }))
  test('sums likes by author', () =>
    assert.deepEqual(helper.mostLikes(blogs), { author: 'Grace', likes: 22 }))
  test('aggregates several blogs rather than selecting only the favorite', () => {
    assert.deepEqual(
      helper.mostLikes([...blogs, { author: 'Ada', likes: 10 }]),
      { author: 'Ada', likes: 24 },
    )
  })
  test('ties select a top author', () =>
    assert.deepEqual(
      helper.mostLikes([
        { author: 'Ada', likes: 0 },
        { author: 'Grace', likes: 0 },
      ]),
      { author: 'Ada', likes: 0 },
    ))
})

test('all aggregation helpers preserve their input', () => {
  const copy = structuredClone(blogs)
  for (const fn of Object.values(helper)) fn(blogs)
  assert.deepEqual(blogs, copy)
})
