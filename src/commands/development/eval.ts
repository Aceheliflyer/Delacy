import { Command } from '@sapphire/framework'
import { EmbedBuilder, Message } from 'discord.js'
import { runInNewContext } from 'vm'
import { inspect } from 'util'
import { oneLine } from 'common-tags'

export class EvalCommand extends Command {
  public constructor (context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Allows the bot owners to eval arbitrary JavaScript without restrictions.',
      preconditions: ['BotOwnerOnly']
    })
  }

  public override registerApplicationCommands (registry: Command.Registry): void {
    registry.registerChatInputCommand(builder =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option //
            .setName('code')
            .setDescription('What code would you like to evaluate?')
            .setRequired(true)
        )
    )
  }

  public override async chatInputRun (interaction: Command.ChatInputCommandInteraction): Promise<Message> {
    const embed = new EmbedBuilder()
      .setColor(interaction.guild?.members.me?.displayHexColor ?? 'Blue')
      .setDescription('Pending...')

    await interaction.reply({ embeds: [embed] })
    const code = interaction.options.getString('code', true)
    const { result, evalTime, success } = await this._eval(code, interaction)

    embed
      .setAuthor({ name: interaction.client.user?.tag ?? '', iconURL: interaction.client.user?.displayAvatarURL() })
      .setDescription(`*Evaluated in ${evalTime[0] > 0 ? `${evalTime[0]}s ` : ''}${(evalTime[1] / 1e6).toFixed(3)}ms.*`)
      .setFields({ name: 'Evaluated', value: '```js\n' + this._clean(code) + '\n```' })
      .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp(new Date())

    if (success) {
      return await interaction.editReply({
        embeds: [
          embed //
            .setColor('Green')
            .addFields([
              { name: 'Result', value: '```js\n' + this._clean(this._expand(result)) + '\n```' },
              { name: 'Type', value: '```js\n' + this._clean(this._type(result)) + '\n```' }
            ])
        ]
      })
    } else {
      return await interaction.editReply({
        embeds: [
          embed //
            .setColor('Red')
            .addFields([{ name: 'Exception', value: '```js\n' + this._clean(String(result)) + '\n```' }])
        ]
      })
    }
  }

  private async _eval (
    code: string,
    interaction: Command.ChatInputCommandInteraction
  ): Promise<{ result: unknown, evalTime: [number, number], success: boolean }> {
    let result: unknown, evalTime: bigint | number | [number, number], success: boolean

    evalTime = process.hrtime.bigint()
    try {
      result = runInNewContext(code, {
        this: this,
        process,
        interaction,
        message: interaction,
        channel: interaction.channel,
        guild: interaction.guild,
        client: interaction.client,
        container: this.container
      })
      success = true
    } catch (error) {
      result = error
      success = false
    }
    evalTime = Number(process.hrtime.bigint() - evalTime)
    evalTime = [evalTime / 1e9, evalTime / 1e6]

    return { result, evalTime, success }
  }

  private _clean (text: string): string {
    const token = this.container.client.token ?? ''
    const tokenRegex = new RegExp(
      `${token.split('').join('[^]{0,}')}|${token.split('').reverse().join('[^]{0,}')}`,
      'gi'
    )
    text = text.replaceAll(tokenRegex, '[TOKEN]')
    text = text.replaceAll('```', '`\u200B`\u200B`\u200B')
    return text
  }

  private _expand (content: unknown): string {
    if (typeof content === 'function') return String(content)
    return inspect(content, {
      showHidden: true,
      compact: false,
      depth: 0
    })
  }

  private _type (content: unknown): string {
    switch (typeof content) {
      case 'object':
        if (content === null) return `object - ${typeof content}`
        return `object - ${content.constructor.name}`
      case 'function':
        return oneLine`
          function
          ${content.name !== null || content.length !== null ? '-' : ''}
          ${content.name !== null ? `Name: ${content.name}` : ''}
          ${content.name !== null && content.length !== null ? '|' : ''}
          ${content.length !== null ? `#Args: ${content.length}` : ''}
        `
      default:
        return typeof content
    }
  }
}
