import { Command } from '@sapphire/framework'
import { EmbedBuilder, Message } from 'discord.js'
import { stripIndents } from 'common-tags'

export class PingCommand extends Command {
  public constructor (context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Obtain the WS and API latency to Discord.'
    })
  }

  public override registerApplicationCommands (registry: Command.Registry): void {
    registry.registerChatInputCommand(builder =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
    )
  }

  public override async chatInputRun (interaction: Command.ChatInputCommandInteraction): Promise<Message> {
    const discordTObotLatency = Date.now() - interaction.createdTimestamp

    const embed = new EmbedBuilder()
      .setColor(interaction.guild?.members.me?.displayHexColor ?? 'Blue')
      .setDescription('Pinging...')

    let botTOdiscordLatency = Date.now()
    await interaction.reply({ content: '', embeds: [embed] })
    botTOdiscordLatency = Date.now() - botTOdiscordLatency

    return await interaction.editReply({
      content: '',
      embeds: [
        embed.setDescription(stripIndents`
          Bot \u2BAB Discord: \`${botTOdiscordLatency}ms\`
          Bot \u2BA8 Discord: \`${discordTObotLatency}ms\`
          Total Latency: \`${discordTObotLatency + botTOdiscordLatency}ms\`
          Socket Heartbeat: \`${this.container.client.ws.ping}ms\`
        `)
      ]
    })
  }
}
