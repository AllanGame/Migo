const { Interaction, MessageEmbed, Message } = require("discord.js");
const config = require("../../../config.json");
const { SlashCommandBuilder } = require("@discordjs/builders");
const Command = require("../../command");

module.exports = class ApproveCommand extends Command {
  constructor() {
    super();
    this.data = new SlashCommandBuilder()
      .setName("approve")
      .setDescription("Aprobar una sugerencia")
      .addStringOption((option) =>
        option
          .setRequired(true)
          .setName("id")
          .setDescription("La ID de la sugerencia que quieres aprobar")
      )
      .addStringOption((option) =>
        option
          .setRequired(false)
          .setName("nota")
          .setDescription(
            "Una nota opcional de el por qué se aceptó esta sugerencia"
          )
      );
  }

  /**
   * @param {Interaction} interaction
   */
  async execute(interaction) {
    const client = interaction.client;
    const member = interaction.member;

    if (!member.permissions.has("KICK_MEMBERS")) {
      interaction.reply(`:x: | No tienes permisos para ejecutar ese comando.`);
      return;
    }

    const suggestionId = interaction.options.getString("id");
    let optionalNote = interaction.options.getString("nota");

    let channel = await client.channels.cache.get(
      config.utils.suggestionChannel
    );

    channel.messages
      .fetch(suggestionId)

      .then((/** @type Message */ message) => {
        let yesCount = message.reactions.cache.get("✅").count;
        let noCount = message.reactions.cache.get("❌").count;
        let suggestionContent = message.embeds[0].fields[0].value;

        message.thread.delete();

        message.delete();

        let embed = new MessageEmbed()
          .setTitle(`Sugerencia aceptada!`)
          .setColor("GREEN")
          .setDescription(
            `La siguiente sugerencia fue aceptada por ${member.user.tag}:`
          )
          .addField(
            "Votos",
            `:white_check_mark: - ${yesCount}\n:x: - ${noCount}`
          )
          .addField("Autor", member.toString())
          .addField("Sugerencia", suggestionContent)
          .setFooter("Migo", client.user.displayAvatarURL())
          .setTimestamp();

        if (optionalNote) {
          embed.addField(`Respuesta`, optionalNote);
        }

        client.channels.cache
          .get(config.utils.suggestionsResultsChannel)
          .send({ embeds: [embed] });

        interaction.reply(
          `:white_check_mark: | Has aceptado la sugerencia con ID \`${suggestionId}\`!`
        );
      })
      .catch((err) => {
        if (err.code === 10008) {
          interaction.reply(":x: No se ha encontrado el mensaje");
          return;
        }

        interaction.reply(":x: Algo salió mal. Por favor intenta de nuevo mas tarde.");
      });
  }
};
