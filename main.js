const { Client, Intents, GatewayIntentBits, SlashCommandBuilder, Routes, EmbedBuilder, Util, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const config = require('./configs/config.json');
const vec3 = require('vec3');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
const rest = new REST({ version: '10' }).setToken(config.discord.token);
const commandsPrivate = [
    new SlashCommandBuilder().setName('flood').setDescription('Inspired from ducky.').addIntegerOption(option =>
		option.setName('messages')
			.setDescription('Amount of messages to send.')
			.setRequired(true)).addStringOption(option =>
		option.setName('message')
			.setDescription('The message to send.')
			.setRequired(true)),
    new SlashCommandBuilder().setName('lookup').setDescription('Returns the players object.').addStringOption(option =>
		option.setName('player')
			.setDescription('The players name')
			.setRequired(true))
].map(command => command.toJSON());
const commandsPublic = [
    new SlashCommandBuilder().setName('force').setDescription('Sends a message as the bot.'),
    new SlashCommandBuilder().setName('status').setDescription('Returns data points about the bots status.'),
    new SlashCommandBuilder().setName('players').setDescription('Returns a list of currently online players.'),
	new SlashCommandBuilder().setName('relog').setDescription('Attempts to relog the minecraft bot.'),
	new SlashCommandBuilder().setName('disconnect').setDescription('Disconnects the bot.'),
	new SlashCommandBuilder().setName('createmenu').setDescription('Creates a server menu.')
].map(command => command.toJSON());
const mc = require('./minecraft_bot.js');

//Technical
var messageInterval;
const channels = [], channelIds = [];
var otherLog, dontReconnect = false, cachedName = "";
//Logger
const winston = require('winston');
const { combine, timestamp, prettyPrint } = winston.format;
const discordNames = [];
var cachedPlayers = "";
var lastCachedPlayers;
var queuedMessages = [];
//Gifs
var gifs = {
    "panic": []
};

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/warnings.log', level: 'warn' }),
    new winston.transports.File({ filename: 'logs/info.log', level: 'info' })
  ]
});

const packetLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/packets.log', level: 'info' })
  ]
});

const logDisconnect = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/disconnect.log' }),
  ],
});

setInterval(() => {
        if (mc.isAlive() && mc.getPlayers() != "") {
            if (lastCachedPlayers != mc.getPlayers()) {
                logger.info(mc.getPlayers());
                lastCachedPlayers = mc.getPlayers();
            }
        }
}, 500, 500);

mc.setLoggers(logger, logDisconnect, packetLogger);
mc.loadWords();

rest.put(Routes.applicationCommands(config.discord.client), { body: commandsPublic })
	.then(() => logger.info('Successfully registered public application commands.'))
	.catch(logger.error);

client.once('ready', () => {
	logger.info('Discord bot loaded.');
    mc.createBot();
    mc.setDiscord(client);
    setInterval(() => {
        if (!mc.isAlive() && !dontReconnect) {
            console.log("Disconnecting mc bot.");
            mc.createBot();
        }
    }, 15000, 15000)

    setInterval(() => {
        if (mc.isAlive() && mc.getMessage() != "") {
            channels.forEach(channel => {
                channel.send(mc.getMessage().replaceAll("@", "\\@"));
            })

            mc.setMessage("");
        }
    }, 500, 500);

    config.discord.channels.forEach(channel => {
        channels.push(client.channels.cache.get(channel));
        logger.info(`Added channel with the id of ${channels[channels.length-1].id} named ${channels[channels.length-1].name}`);
        channels[channels.length-1].mcChat = true;
    });

    otherLog = client.channels.cache.get("PRIVATE-LOGS");
    mc.setChannels(channels);
    mc.setOtherLog(otherLog);
    mc.setTracking(client.channels.cache.get(config.discord.tracking));
});

client.on('error', e => {
    logger.error(e);
    otherLog.send({content: "Bot is not fine send help.\n" + e, files: [gifs.panic[Math.floor(Math.random()*gifs.panic.length)]]});
});

client.on('messageCreate', message => {
    if (config.autisticMode) return;
    if (message.author.bot) return;
    if (message.channel.mcChat && mc.isAlive()) {
        try {
            if (message.content.startsWith("-")) return;
            if (!discordNames.includes(message.member.displayName)) {
                discordNames.push(message.member.displayName);
                mc.addDiscord(message.member.displayName);
            }

            if (message.content.startsWith("say ") && message.author.id == "<YOUR-ID>") {
                mc.processCommand(message.content, message.author.id, null);
                message.delete();
                return;
            }

            mc.addQueueMessage(message.member.displayName + ": " + proccessDiscordMsg(message));
            mc.processCommand(message.content, message.author.id, null);
            message.delete();
        } catch (e){}
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        switch (interaction.customId) {
            case "get-players":
                await interaction.reply({ephemeral: true, content: Util.escapeMarkdown(mc.getPlayers())});
            break;
            case "iq-troll":
                await interaction.reply({ephemeral: true, content: `Your IQ is: ${Math.round(Math.random() * (60)) + 20}`});
            break;
        }
    }
	if (!interaction.isChatInputCommand()) return;

	var commandName = interaction.commandName;

    try {
        switch (commandName) {
            case "createmenu":
                if (hasAccess(interaction.user.id, 3)) {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('get-players')
                                .setLabel('Players')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('iq-troll')
                                .setLabel('Your IQ')
                                .setStyle(ButtonStyle.Danger));
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Server Info')
                        .setDescription('Returns information about Horizon.');
                    await interaction.reply({ ephemeral: false, embeds: [embed], components: [row] });
                } else {
                    await interaction.reply({content: 'You don\'t have enough swags.', ephemeral: true});
                }
            break;
            case "flood":
                if (hasAccess(interaction.user.id, 3)) {
                    await interaction.reply('Attempting to flood chat.');
                    mc.floodChat(interaction.options.getString("message"), interaction.options.getInteger("messages"));
                } else {
                    await interaction.reply({content: 'You don\'t have enough swags.', ephemeral: true});
                }
            break;
            case "relog":
                console.log("Relog attempted");
                if (hasAccess(interaction.user.id, 3)) {
                    await interaction.reply('Attempting to relog.');
                    interaction.channel.send(interaction.user.username + " has restarted the minecraft bot.");
                    dontReconnect = false;
                    mc.createBot();
                } else {
                    await interaction.reply({content: 'You don\'t have enough swags.', ephemeral: true});
                }
            break;
            case "disconnect":
                if (hasAccess(interaction.user.id, 3)) {
                    await interaction.reply('Disconnecting the minecraft bot.');
                    interaction.channel.send(interaction.user.username + " has disconnected the minecraft bot.");
                    mc.disconnectBot();
                    dontReconnect = true;
                } else {
                    await interaction.reply({content: 'You don\'t have enough swags.', ephemeral: true});
                }
            break;
            case "force":
                if (mc.getBot() != null) {
                    if (hasAccess(interaction.user.id, 3)) {
                        await interaction.reply('Attempting to send command.');
                        mc.getBot().chat(interaction.options.getString("command"));
                    } else {
                        await interaction.reply({content: 'You don\'t have enough swags.', ephemeral: true});
                    }
                } else {
                    await interaction.reply('The bot is offline.');
                }
            break;
            case "status":
                let statusEmbed = new EmbedBuilder()
                    .setColor(0x0CEEF3)
                    .setTitle("Status");
                if (mc.getBot() == null) {
                    statusEmbed.addFields([{name: "Bot:", value: "offline"}]);
                } else {
                    if (mc.getBot().entity == null) {
                        mc.disconnectBot();
                        statusEmbed.addFields([{name: "Bot:", value: "offline"}]);
                    } else {
                        statusEmbed.addFields([{name: "Bot:", value: "online"}]);
                    }
                }
                statusEmbed.addFields([{name: "Auto Reconnect:", value: (!dontReconnect ? "on" : "off")}]);
                statusEmbed.addFields([{name: "Autistic Mode:", value: (config.autisticMode ? "on" : "off")}]);
                statusEmbed.addFields([{name: "Chat Nuker:", value: (config.spamDuck != "" ? "on" : "off")}]);
                await interaction.reply({"embeds":[statusEmbed]});
            break;
            case "lookup":
                if (mc.getBot() != null) {
                    console.log(mc.getBot().players[interaction.options.getString("player")]);
                    console.log(mc.getBot().blockAt(vec3(0, 229, 0)));
                    console.log(mc.getBot().players);
                    let player = mc.getBot().players[interaction.options.getString("player")];
                    await interaction.reply(mc.getBot().players[interaction.options.getString("player")].toString());
                } else {
                    await interaction.reply("The bot is offline.");
                }
            break;
            case "spawn":
                if (mc.getBot() != null) {
                    console.log(bot.entities);
                    await interaction.reply("Logging entity info");
                } else {
                    await interaction.reply("The bot is offline.");
                }
            break;
        }
    } catch (e){
        console.error(e);
    }
});

try {
    client.login(config.discord.token);
} catch (e) {}

function hasAccess(id, level) {
    if (config.access[id] == null) return false;
    return config.access[id] >= level;
}

function proccessDiscordMsg(msg) {
  let message = msg.content;
  msg.mentions.channels.forEach((c) => {
    message = message.replace("<#" + c.id + ">", "#" + client.channels.cache.get(c.id).name);
  });

  msg.mentions.users.forEach((u) => {
    message = message.replace("<@" + u.id + ">", "\@" + u.tag);
  });
  message = message.replaceAll("\n", " ").slice(0, 220);
  console.log(message);
  return message;
}
