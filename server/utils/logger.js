const info = (...args) => {
  if (process.env.NODE_ENV !== 'test') console.log(...args)
}
const error = (...args) => console.error(...args)

module.exports = { info, error }
