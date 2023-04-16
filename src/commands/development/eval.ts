import { Command } from '@sapphire/framework'
import { EmbedBuilder, Message } from 'discord.js'

export class EvalCommand extends Command {
  public constructor (context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Allows the bot owners to eval arbitrary JavaScript without restrictions.',
      preconditions: ['BotOwnerOnly']
    })
  }

  public override registerApplicationCommands (registry: Command.Registry): void {
    registry.registerChatInputCommand(builder => builder
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(option => option
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

    await interaction.reply({ content: '', embeds: [embed] })
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
        content: '',
        embeds: [embed
          .setColor('Green')
          .addFields([
            { name: 'Result', value: '```js\n' + this._clean(result.toString()) + '\n```' },
            { name: 'Type', value: '```js\n' + this._clean(typeof result) + '\n```' }
          ])
        ]
      })
    } else {
      return await interaction.editReply({
        content: '',
        embeds: [embed
          .setColor('Red')
          .addFields([
            { name: 'Exception', value: '```js\n' + this._clean(result.toString()) + '\n```' }
          ])
        ]
      })
    }
  }

  private async _eval (code: string, interaction: Command.ChatInputCommandInteraction): Promise<{ result: any, evalTime: [number, number], success: boolean }> {
    /* eslint-disable */
    const message = interaction
    const channel = interaction.channel
    const guild = interaction.guild
    const client = interaction.client
    /* eslint-enable */

    let result, evalTime, success

    evalTime = process.hrtime()
    try {
      result = await eval(code) // eslint-disable-line no-eval
      success = true
    } catch (error) {
      result = error
      success = false
    }
    evalTime = process.hrtime(evalTime)

    return { result, evalTime, success }
  }

  private _clean (text: string): string {
    const replaceStrings = [
      [this.container.client.token ?? '', '[TOKEN]'],
      ['```', '`\u200B`\u200B`\u200B']
    ]

    for (let i = 0; i < replaceStrings.length; i++) {
      const str = replaceStrings[i]
      text = text.replaceAll(str[0], str[1])
    }

    return text
  }
}
