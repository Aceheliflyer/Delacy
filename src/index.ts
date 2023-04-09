import { ApplicationCommandRegistries, RegisterBehavior, SapphireClient, LogLevel } from '@sapphire/framework'
import * as dotenv from 'dotenv'; dotenv.config()

process.env.NODE_ENV ??= 'development'

const client = new SapphireClient({
  loadMessageCommandListeners: true,
  intents: [],
  logger: {
    level: (
      process.env.NODE_ENV === 'development'
        ? LogLevel.Debug
        : LogLevel.Info
    )
  }
})

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite)

try {
  client.logger.info('SapphireClient: Logging in...')

  let diff = process.hrtime()
  await client.login(process.env.DISCORD_TOKEN)
  diff = process.hrtime(diff)

  client.logger.info(`SapphireClient: Took ${(diff[0] * 1e3) + Math.round(diff[1] / 1e6)}ms to login.`)
} catch (error) {
  client.logger.fatal(error)
  client.destroy()
  process.exit(1)
}
