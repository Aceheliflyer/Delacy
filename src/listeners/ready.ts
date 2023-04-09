import { Listener } from '@sapphire/framework'
import { Client } from 'discord.js'

export class ReadyListener extends Listener {
  public run (client: Client): void {
    this.container.logger.info(`Application ready as ${client.user?.tag ?? ''} (${client.user?.id ?? ''}).`)
  }
}
