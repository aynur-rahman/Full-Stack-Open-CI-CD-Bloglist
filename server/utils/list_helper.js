const dummy = (_blogs) => 1

const totalLikes = (blogs) => blogs.reduce((sum, blog) => sum + blog.likes, 0)

const favoriteBlog = (blogs) =>
  blogs.reduce(
    (favorite, blog) =>
      !favorite || blog.likes > favorite.likes ? blog : favorite,
    null,
  )

const mostBlogs = (blogs) => {
  const counts = new Map()
  for (const blog of blogs)
    counts.set(blog.author, (counts.get(blog.author) || 0) + 1)
  let winner = null
  for (const [author, count] of counts) {
    if (!winner || count > winner.blogs) winner = { author, blogs: count }
  }
  return winner
}

const mostLikes = (blogs) => {
  const totals = new Map()
  for (const blog of blogs)
    totals.set(blog.author, (totals.get(blog.author) || 0) + blog.likes)
  let winner = null
  for (const [author, likes] of totals) {
    if (!winner || likes > winner.likes) winner = { author, likes }
  }
  return winner
}

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes }
