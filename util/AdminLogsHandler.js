const { EmbedBuilder } = require('discord.js');

module.exports = {

  SendConnectionLogs: async (client, guildId, data) => {
    let guild = await client.GetGuild(guildId);
    if (!client.exists(guild.connectionLogsChannel)) return;
    const channel = client.GetChannel(guild.connectionLogsChannel);

    let newDt = await client.getDateEST(data.time);
    let unixTime = Math.floor(newDt.getTime() / 1000);

    let connectionLog = new EmbedBuilder()
      .setColor(data.connected ? client.config.Colors.Green : client.config.Colors.Red)
      .setDescription(`**${data.connected ? 'Connect' : 'Disconnect'} Event - <t:${unixTime}>\n${data.player} ${data.connected ? 'Connected' : 'Disconnected'}**`);

    if (!data.connected) {
      if (!(data.lastConnectionDate == null)) {
        let oldUnixTime = Math.floor(data.lastConnectionDate.getTime() / 1000);
        let sessionTime = client.secondsToDhms(unixTime - oldUnixTime);
        connectionLog.addFields({ name: '**Session Time**', value: `**${sessionTime}**`, inline: false });
      } else connectionLog.addFields({ name: '**Session Time**', value: `**Unknown**`, inline: false });
    }

    if (client.exists(channel)) await channel.send({ embeds: [connectionLog] });
  },

  DetectCombatLog: async (client, guildId, data) => {
    if (data.lastDamageDate == null) return;

    const newDt = await client.getDateEST(data.time);
    const diffSeconds = Math.round((newDt.getTime() - data.lastDamageDate.getTime()) / 1000);

    // If diff is greater than 5 minutes, not a combat log
    // or if death after last combat
    if (diffSeconds > (data.combatLogTimer * 60)) return;
    if (data.lastDamageDate <= data.lastDeathDate) return;

    let guild = await client.GetGuild(guildId);
    if (!client.exists(guild.connectionLogsChannel)) return;
    const channel = client.GetChannel(guild.connectionLogsChannel);
    if (!channel) return;

    let unixTime = Math.floor(newDt.getTime() / 1000);

    let combatLog = new EmbedBuilder()
      .setColor(client.config.Colors.Red)
      .setDescription(`**NOTICE:**\n**${data.player}** has combat logged at <t:${unixTime}> when fighting **${data.lastHitBy}\nLocation [${data.pos[0]}, ${data.pos[1]}](https://www.izurvive.com/chernarusplussatmap/#location=${data.pos[0]};${data.pos[1]})**`);

    if (client.exists(guild.adminRole)) channel.send({ content: `<@&${guild.adminRole}>` });

    return channel.send({ embeds: [combatLog] });
  }
};
