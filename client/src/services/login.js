import axios from 'axios'
const login = async (credentials) =>
  (await axios.post('/api/login', credentials)).data
export default { login }
