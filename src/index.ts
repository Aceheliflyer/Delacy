import {
  ApplicationCommandRegistries,
  container,
  LogLevel,
  RegisterBehavior,
  SapphireClient
} from '@sapphire/framework'
import { GatewayIntentBits } from 'discord.js'
import { hrtime } from 'process'
import * as dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV ??= 'development'

const client = new SapphireClient({
  loadMessageCommandListeners: true,
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  logger: { level: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Info }
})

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite)

try {
  container.logger.info('SapphireClient: Logging in...')

  let diff: bigint | number = hrtime.bigint()
  await client.login(process.env.DISCORD_TOKEN)
  diff = Number(hrtime.bigint() - diff)

  container.logger.info(`SapphireClient: Took ${Math.round(diff / 1e6).toLocaleString()}ms to login.`)
} catch (error) {
  container.logger.fatal(error)
  client.destroy()
  process.exit(1)
}
