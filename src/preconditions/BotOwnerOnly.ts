import { Precondition, Result, UserError } from '@sapphire/framework'
import { CommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js'

export class BotOwnerOnlyPrecondition extends Precondition {
  // Message commands
  public override async messageRun (message: Message): Promise<Result<unknown, UserError>> {
    return await this.checkOwner(message.author.id)
  }

  // Slash commands
  public override async chatInputRun (interaction: CommandInteraction): Promise<Result<unknown, UserError>> {
    return await this.checkOwner(interaction.user.id)
  }

  // Context menu
  public override async contextMenuRun (
    interaction: ContextMenuCommandInteraction
  ): Promise<Result<unknown, UserError>> {
    return await this.checkOwner(interaction.user.id)
  }

  private async checkOwner (userId: string): Promise<Result<unknown, UserError>> {
    return (await this.container.client.application?.fetch().then(app => app.owner?.id)) === userId
      ? await this.ok()
      : await this.error({ message: 'Only the bot owner can use this command!' })
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    BotOwnerOnly: never
  }
}
