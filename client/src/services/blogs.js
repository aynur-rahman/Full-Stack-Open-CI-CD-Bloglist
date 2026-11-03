import axios from 'axios'
const baseUrl = '/api/blogs'
const authorization = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
})
const getAll = async () => (await axios.get(baseUrl)).data
const create = async (blog, token) =>
  (await axios.post(baseUrl, blog, authorization(token))).data
const like = async (blog, token) =>
  (
    await axios.put(
      `${baseUrl}/${blog.id}`,
      {
        title: blog.title,
        author: blog.author,
        url: blog.url,
        likes: blog.likes + 1,
        user: blog.user.id,
      },
      authorization(token),
    )
  ).data
const remove = async (id, token) =>
  axios.delete(`${baseUrl}/${id}`, authorization(token))
const comment = async (id, comment) =>
  (await axios.post(`${baseUrl}/${id}/comments`, { comment })).data
export default { getAll, create, like, remove, comment }
