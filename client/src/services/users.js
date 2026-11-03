import axios from 'axios'
const getAll = async () => (await axios.get('/api/users')).data
export default { getAll }
