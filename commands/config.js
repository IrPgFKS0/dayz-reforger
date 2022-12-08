const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const bitfieldCalculator = require('discord-bitfield-calculator');

module.exports = {
  name: "config",
  debug: false,
  global: false,
  description: "Configure your server settings",
  usage: "[opt] [action] [value]",
  permissions: {
    channel: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
    member: ["MANAGE_GUILD"],
  },  
  options: [
    {
      name: "allowed_channels",
      description: "Set channels you're allowed to use the bot in",
      value: "allowed_channels",
      type: 2,
      options: [
        {
          name: "add",
          description: "Add channel",
          value: "add",
          type: 1,
          options: [{
            name: "channel",
            description: "The channel to configure",
            value: "channel",
            type: 7,
            channel_types: [0], // Restrict to text channel
            required: true,
          }]
        },
        {
          name: "remove",
          description: "Remove channel",
          value: "remove",
          type: 1,
          options: [{
            name: "channel",
            description: "The channel to configure",
            value: "channel",
            type: 7,
            channel_types: [0], // Restrict to text channel
            required: true,
          }]
        },
      ]
    },
    {
      name: "bot_admin_role",
      description: "Set/remove bot admin role",
      value: "bot_admin_role",
      type: 2,
      options: [
        {
          name: "set",
          description: "Set role",
          value: "role",
          type: 1,
          options: [{
            name: "role",
            description: "Role to set",
            value: "role",
            type: 8,
            required: true,
          }]
        },
        {
          name: "remove",
          description: "Remove role",
          value: "remove",
          type: 1,
        },
      ]
    },
    {
      name: "exclude_role",
      description: "Exclude roles from users to use to claim a flag.",
      value: "exclude_role",
      type: 1,
      options: [
        {
          name: "add_or_remove",
          description: "Add or remove a role from the exclude list.",
          value: "add_or_remove",
          type: 3,
          choices: [
            { name: 'add', value: 'add' }, { name: 'remove', value: 'remove' },
          ],
          required: true,
        },
        {
          name: "role",
          description: "The role to manage",
          value: "role",
          type: 8,
          required: true,
        },
      ]
    },
    {
      name: "reset",
      description: "Restore all settings to default configurations",
      value: "reset",
      type: 1,
    },
    {
      name: "view",
      description: "View current settings configuration",
      value: "view",
      type: 1,
    }
  ],  
  SlashCommand: {
    /**
     *
     * @param {require("../structures/QuarksBot")} client
     * @param {import("discord.js").Message} message
     * @param {string[]} args
     * @param {*} param3
    */
    run: async (client, interaction, args, { GuildDB }) => {      
      const permissions = bitfieldCalculator.permissions(interaction.member.permissions);
      let canUseCommand = false;

      if (permissions.includes("MANAGE_GUILD")) canUseCommand = true;
      if (client.exists(GuildDB.botAdmin) && interaction.member.roles.includes(GuildDB.botAdmin)) canUseCommand = true;
      if (!canUseCommand) return interaction.send({ content: 'You don\'t have the permissions to use this command.' });

      if (args[0].name == 'allowed_channels') {
        const channelid = args[0].options[0].options[0].value;

        if (args[0].options[0].name == 'add') {
          const channel = client.channels.cache.get(channelid);

          const errorEmbed = new EmbedBuilder().setColor(client.config.Colors.Red)
          let error = false;

          if (!channel) {error=true;errorEmbed.setDescription(`**Error Notice:** Cannot find that channel.`);}
          if (channel.type=="voice") {error=true;errorEmbed.setDescription(`**Error Notice:** Cannot add voice channel to allowed channels.`);}
          if (error) return interaction.send({ embeds: [errorEmbed] });
                    
          client.dbo.collection("guilds").updateOne({"server.serverID":GuildDB.serverID}, {$push:{"server.allowedChannels": channelid}}, function (err, res) {
            if (err) return client.sendInternalError(interaction, err);
          });

          const successEmbed = new EmbedBuilder()
            .setColor(client.config.Colors.Green)
            .setDescription(`**Success:** Set <#${channelid}> as an allowed channel.`);

          return interaction.send({ embeds: [successEmbed] });
        } else if (args[0].options[0].name=='remove') {

          const embed = new EmbedBuilder()
            .setDescription(`**Error Notice:** <#${channelid}> is not in allowed channels.`)
            .setColor(client.config.Colors.Red)

          if (!GuildDB.allowedChannels.includes(channelid)) return interaction.send({ embeds: [embed] });

          const prompt = new EmbedBuilder()
            .setTitle(`Are you sure you want to remove this channel from allowed channels?`)
            .setColor(client.config.Colors.Default)

          const opt = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`RemoveAllowedChannels-yes-${interaction.member.user.id}`)
                .setLabel("Yes")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`RemoveAllowedChannels-no-${interaction.member.user.id}`)
                .setLabel("No")
                .setStyle(ButtonStyle.Success)
            )

          return interaction.send({ embeds: [prompt], components: [opt], flags: (1 << 6) });
          
        } else client.error('exception?');

      } else if (args[0].name == 'bot_admin_role') {
        
          if (args[0].options[0].name == 'set') {
            const roleId = args[0].options[0].options[0].value;
  
            client.dbo.collection("guilds").updateOne({"server.serverID":GuildDB.serverID},{$set:{"server.botAdmin": roleId}}, function(err, res) {
              if (err) return client.sendInternalError(interaction, err);
            });
      
            const successEmbed = new EmbedBuilder()
              .setDescription(`Successfully set <@&${roleId}> as a bot admin role.\nUsers with this role can use restricted commands.`)
              .setColor(client.config.Colors.Green);
      
            return interaction.send({ embeds: [successEmbed] });    

          } else if (args[0].options[0].name== 'remove') {
            const prompt = new EmbedBuilder()
              .setTitle(`Are you sure you want to remove this role as a bot admin?`)
              .setColor(client.config.Colors.Default)

            const opt = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(`RemoveBotAdminRole-yes-${interaction.member.user.id}`)
                  .setLabel("Yes")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId(`RemoveBotAdminRole-no-${interaction.member.user.id}`)
                  .setLabel("No")
                  .setStyle(ButtonStyle.Success)
              )

            return interaction.send({ embeds: [prompt], components: [opt], flags: (1 << 6) });
          }

      } else if (args[0].name == 'exclude') {

        if (args[0].options[0].value == 'add') {
          client.dbo.collection('guilds').updateOne({'server.serverID': GuildDB.serverID}, {$push: {'server.excludedRoles': args[0].options[1].value}}, function(err, res) {
            if (err) return client.sendInternalError(interaction, err);
          })

          const success = new EmbedBuilder()
            .setColor(client.config.Colors.Green)
            .setDescription(`**Done!**\n> Successfully added <@&${args[0].options[1].value}> to list of excluded roles.`)

          return interaction.send({ embeds: [success] });

        } else if (args[0].options[0].value == 'remove') {
          client.dbo.collection('guilds').updateOne({'server.serverID': GuildDB.serverID}, {$pull: {'server.excludedRoles': args[0].options[1].value}}, function(err, res) {
            if (err) return client.sendInternalError(interaction, err);
          })

          const success = new EmbedBuilder()
            .setColor(client.config.Colors.Green)
            .setDescription(`**Done!**\n> Successfully removed <@&${args[0].options[1].value}> to list of excluded roles.`)

          return interaction.send({ embeds: [success] });
        }

      } else if (args[0].name == 'reset') {
        const prompt = new EmbedBuilder()
          .setTitle(`Woah!? Hold on.`)
          .setDescruotion('Are you sure you wish to remove all your configurations for this guild?')
          .setColor(client.config.Colors.Default)

        const opt = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`ResetSettings-yes-${interaction.member.user.id}`)
              .setLabel("Yes")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`ResetSettings-no-${interaction.member.user.id}`)
              .setLabel("No")
              .setStyle(ButtonStyle.Success)
          )

        return interaction.send({ embeds: [prompt], components: [opt], flags: (1 << 6) });

      } else if (args[0].name == 'view') {
        const channelsInfo = GuildDB.customChannelStatus ? '\n╚➤ \`/channels\` to view' : '';
        const channelColor = GuildDB.customChannelStatus ? '+ ' : '- ';
        const botAdminRole = GuildDB.botAdmin ? `\n╚➤ <@&${GuildDB.botAdmin}>` : '';
        const botAdminRoleColor = GuildDB.botAdmin ? `+ ` : '- ';
        
        const settingsEmbed = new EmbedBuilder()
          .setColor(client.config.Colors.Default)
          .setTitle('Current Guild Configurations')
          .addFields(
            { name: 'Guild ID', value: `\`\`\`arm\n${GuildDB.serverID}\`\`\``, inline: true },
            { name: 'Has Allowed Channels?', value: `\`\`\`diff\n${channelColor}${GuildDB.customChannelStatus}\`\`\`${channelsInfo}`, inline: true },
            { name: 'Has bot admin role?', value: `\`\`\`diff\n${botAdminRoleColor}${client.exists(GuildDB.botAdmin)}\`\`\`${botAdminRole}`, inline: true }, 
          );

        return interaction.send({ embeds: [settingsEmbed] });
      }
    },
  },

  Interactions: {
    
    RemoveAllowedChannels: {
      run: async (client, interaction, GuildDB) => {
        if (!queryString.endsWith(interaction.member.user.id)) {
          return ButtonInteraction.reply({
            content: "This button is not for you",
            flags: (1 << 6)
          })
        }
        let action = ''
        if (interaction.customId.split('-')[1]=='yes') {
          action = 'removed';
          client.dbo.collection("guilds").updateOne({"server.serverID":GuildDB.serverID}, {$pull:{"server.allowedChannels": channelid}}, function (err, res) {
            if (err) return client.sendInternalError(interaction, err);
          });
        } else if (interaction.customId.split('-')[1]=='no') action = 'kept';
    
        const successEmbed = new EmbedBuilder()
          .setColor(client.config.Colors.Green)
          .setTitle(`Success: You ${action} the channel.`)
    
        return interactino.update({ embeds: [successEmbed], components: [] });
      }
    },

    RemoveBotAdminRole: {
      run: async (client, interaction, GuildDB) => {
        if (!interaction.customId.endsWith(interaction.member.user.id)) {
          return ButtonInteraction.reply({
            content: "This button is not for you",
            flags: (1 << 6)
          })
        }
        let action = '';
        if (interaction.customId.split('-')[1]=='yes') {
          action = 'removed';
          client.dbo.collection("guilds").updateOne({"server.serverID":GuildDB.serverID}, {$set: {"server.botAdmin": null}}, function(err, res) {
            if (err) return client.sendInternalError(interaction, err);
          });
        } else if (interaction.customId.split('-')[1]=='no') action = 'kept';
    
        const successEmbed = new EmbedBuilder()
          .setColor(client.config.Colors.Green)
          .setTitle(`Successfully ${action} <@&${roleId}> as the bot admin role.`)
    
        return interaction.update({ embeds: [successEmbed], components: [] });
      }
    },

    ResetSettings: {
      run: async (client, interaction, GuildDB) => {
        if (!interaction.customId.endsWith(interaction.member.user.id)) {
          return ButtonInteraction.reply({
            content: "This button is not for you",
            flags: (1 << 6)
          })
        }
        let action = '';
        if (interaction.customId.split('-')[1]=='yes') {
          action = 'reset';
          const defaultGuildConfig = client.getDefaultSettings(GuildDB.serverID);
          client.dbo.collection("guilds").updateOne({"server.serverID":GuildDB.serverID}, {$set: {"server": defaultGuildConfig}}, function(err, res) {
            if (err) return client.sendInternalError(interaction, err);
          });
        } else if (interaction.customId.split('-')[1]=='no') action = 'kept';
    
        const successEmbed = new EmbedBuilder()
          .setColor(client.config.Colors.Green)
          .setTitle(`Successfully ${action} guild configurations.`)
    
        return interaction.update({ embeds: [successEmbed], components: [] });
      }
    }
  } 
}