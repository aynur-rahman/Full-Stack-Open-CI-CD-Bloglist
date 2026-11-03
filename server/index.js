const config = require('./utils/config')
const app = require('./app')
const database = require('./utils/database')
const logger = require('./utils/logger')

const start = async () => {
  if (!config.SECRET) throw new Error('SECRET is required')
  await database.connect(config.MONGODB_URI)
  const server = app.listen(config.PORT, () =>
    logger.info(`Server running on port ${config.PORT}`),
  )
  server.on('error', async (error) => {
    logger.error('Server could not start:', error.code)
    await database.disconnect()
    process.exitCode = 1
  })
  const stop = () =>
    server.close(async () => {
      await database.disconnect()
    })
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
}

start().catch(async (error) => {
  logger.error(
    'Startup failed. Check SECRET and database configuration.',
    error.name,
  )
  await database.disconnect()
  process.exitCode = 1
})
