const config = require('./configs/config.json');
const pearls = require('./configs/pearls.json');
const commands = require('./configs/commands.json');
const events = require('./configs/events.json');
const { EmbedBuilder, Util } = require('discord.js');
const mineflayer = require('mineflayer');
const inventoryViewer = require('mineflayer-web-inventory');
const vm = require('vm');
const fs = require('fs');
var cmds = require('./commands.js');
const regex = {
    "whisper": /^\[[\w]{3,16} -> me\] /,
    "message": /^\<?\s?[~|\w]{3,16}\s?\>/,
    "message_discord": /^<?[\.*]{3,18}> \.*:/,
    "joined": /^\w+ joined the game?.$/,
    "left": /^\w+ left the game?.$/,
    "died": /\.*? (sonic boom|shrieked|walked into danger zone|was slain by|suffocated|was squished|was impaled|didn't want to live|withered away|whilst fighting|went off with a bang|tried to swim in lava|was struck by|floor was lava|went up in flames|was skewered|was squashed|was impaled on|hit the ground too hard|fell from|fell out|fell off|killed|died|was pummeled by|was shot by|whilst trying to escape|experienced kinetic energy|blew up|was blown up|death|drowned|was fireballed)\.*?/,
    "advancement": /\w+ has (made the advancement|completed the challenge|reached the goal) \[.*?\]/,
    "isInt": /-?[0-9]+/g,
    "url": /((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?\/?/g
};
const vec3 = require('vec3');
var bot = null, pearlBot = null;
var dontReconnect = false;
var channels = [];
var otherLog = null;
var tracking = null;
var tracker = require("./configs/tracker.json");
var playerInfo = require("./data/players.json");
var cachedName = "";
var logger;
var logDisconnect;
var packetLogger;
//To prevent an overflow of messages.
var nextMessage = "";
var discordNames = [];
var discord;
var lastCommand = 0;
var recentMessages = [];
var queuedMessages = [];
var words = [];

var gifs = {
    "panic": []
};

const autoeat = require("mineflayer-auto-eat");
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const goals = require('mineflayer-pathfinder').goals

Object.keys(commands).forEach((k) => {
   cmds.getCmd(commands[k].file);
});

setInterval(() => {
    if (lastCommand > 0) lastCommand--;
}, 50);

setInterval(() => {
    if (bot == null) return;

    if (config.spamDuck != "") {
        let pls = Object.keys(bot.players);
        bot.chat("/minecraft:tell " + pls[Math.floor(Math.random()*pls.length)] + " " + randomSentence());
    }
}, 2500);

setInterval(() => {
    if (bot == null) return;

    let msg = getNextMessage();
    if (!isSpam(msg) && msg != null && msg != "") {
        bot.chat(msg);
    }
}, 1250);

const disconnectBot = () => {
    if (bot != null) {
        bot.quit();
    }

    if (pearlBot != null) {
        pearlBot.quit();
    }

    pearlBot = null;
    bot = null;
};

const createBot = () => {
    vm.createContext(context);
    if (config.account.email == null || config.account.password == null) {
        return;
    }

    if (bot != null) {
        bot.quit();
    }

    try {
        botInstance = mineflayer.createBot({host: config.server.ip, username: config.account.email, password: config.account.password, version: config.server.version, auth: 'microsoft'});
        bot = botInstance;
        if (!config.autisticMode) pearlBot = mineflayer.createBot({host: config.server.ip, username: config.pearlAcc.email, password: config.pearlAcc.password, version: config.server.version, auth: 'microsoft'});
        initEvents();
        bot.loadPlugin(autoeat);
        bot.loadPlugin(pathfinder);

        bot._client.on('packet', (json, metadata, raw, full) => {
            context["info"] = {"json": json, "metadata": metadata, "raw": raw, "full": full}
            cmds.getEvent("packetLogger").runInContext(context);
        });


        bot.once('spawn', () => {
            if (bot == null) return;
            delete require.cache["<YOUR-PATH>/configs/config.json"];
            delete require.cache["<YOUR-PATH>/configs/tracker.json"];
            delete require.cache["<YOUR-PATH>/configs/commands.json"];
            cachedName = bot.username;
            logger.info("Minecraft bot has spawned.");
            /*const mcData = require('minecraft-data')(bot.version);
            const defaultMove = new Movements(bot, mcData);*/
            //bot.pathfinder.setMovements(defaultMove);

            bot.autoEat.options.priority = "foodPoints";
            bot.autoEat.options.checkOnItemPickup = true;
            bot.autoEat.options.startAt = 19;
            bot.autoEat.options.bannedFood = [];
            bot.autoEat.options.eatingTimeout = 5;
        });

        bot.on('kicked', (reason) => {
            context["info"] = {"reason": reason}
            cmds.getEvent("kicked").runInContext(context);
        });

        bot.on('end', (e) => {
            context["info"] = {"error": e}
            cmds.getEvent("end").runInContext(context);
        });

        bot.on('error', (e) => {
            context["info"] = {"error": e}
            cmds.getEvent("error").runInContext(context);
        });

        bot.on('timeout', (time) => {
            context["info"] = {"time": time}
            cmds.getEvent("timeout").runInContext(context);
        });

        try {
            bot.on('health', () => {
                if (bot == null || config.server.ip != "horizonanarchy.net") return;
                if (bot.food <= 19) {
                    bot.autoEat.enable();
                } else {
                    bot.autoEat.disable();
                }
               if (bot.health <= 19) {
                   logMcChat("The bot is on " + bot.health + " health, please get on.");
                   disconnectBot();
                   dontReconnect = true;
               }
            });

            bot.on('soundEffectHeard', (soundName, position, volume, pitch) => {
               if (soudName == "entity.wither.spawn" || soudName == "entity.lightning.impact" || soundName == "entity.lightning.thunder") {
                    let reasonStr = JSON.parse(reason).text;
                    let soundEmbed = new EmbedBuilder()
                        .setColor(0xE51A36)
                        .setTitle("Heard sound")
                        .setDescription(`${soundName} from ${position}`);
                   otherLog.send({"embeds": [soundEmbed]});
                   logger.info(`<SOUND> ${soundName} from ${position}`)
               }
            });

            bot.on('messagestr', (message) => {
                context["info"] = {"message": message}
                cmds.getEvent("message").runInContext(context);
            })
        } catch (e) {
            console.error(e);
            logger.error(e);
            otherLog.send({content: "Bot is not fine send help.\n" + e.toString(), files: [gifs.panic[Math.floor(Math.random()*gifs.panic.length)]]});
            disconnectBot();
        }
    } catch (e) {
        console.error(e);
        logger.error(e);
        otherLog.send({content: "Bot is not fine send help.\n" + e.toString(), files: [gifs.panic[Math.floor(Math.random()*gifs.panic.length)]]});
        if (bot != null) {
            disconnectBot();
        }
    }
};

const error = (e) => {
    console.error(e);
        logger.error(e);
        otherLog.send({content: "Bot is not fine send help.\n" + e.toString(), files: [gifs.panic[Math.floor(Math.random()*gifs.panic.length)]]});
        if (bot != null) {
            disconnectBot();
        }
}

const isAlive = () => {
    return bot != null && bot.entity != null && bot.entity.position != null;
};


const logMcChat = (message) => {
    if (config.autisticMode) return;
    logger.info(`<Message> ${message}`);
    if ((message + "\n" + nextMessage).length >= 1999) {
        channels.forEach(channel => {
            channel.send(nextMessage.replaceAll("@", "**@**"));
        })
        nextMessage = "";
    }

    nextMessage = nextMessage + (nextMessage != "" ? "\n" : "") + message
}

const logMcEmbed = (embed) => {
    if (config.autisticMode) return;
    logger.info(`<${embed.data.title}> ${embed.data.description}`);
    channels.forEach(channel => {
        channel.send({embeds: [embed]});
    })
}

const getPlayers = () => {
    let names = [];
    Object.keys(bot.players).forEach((name)=>{
        names.push(`${name} <${bot.players[name].ping}>`);
    });
    return names.join(", ");
}

const setChannels = (channels2) => {
    channels = channels2;
}

const setOtherLog = (channel) => {
    otherLog = channel;
}

const setTracking = (channel) => {
    tracking = channel;
}

const setLoggers = (logger1, logger2, logger3) => {
    logger = logger1;
    logDisconnect = logger2;
    packetLogger = logger3;
}

const setMessage = (message) => {
    nextMessage = message;
}

const getMessage = () => {
    return nextMessage;
}

const addDiscord = (name) => {
    if (!discordNames.includes(name)) discordNames.push(name);
}

const getBot = () => {
    return bot;
}

const floodChat = (message, amount) => {
    for (let i = 0; i < amount; i++) {
        bot.chat(message + " : " + Math.round(Math.random() * (9899999 - 99999 + 1) + 99999));
    }
}

const processCommand = (command, did, discord) => {
    if (config.autisticMode) return;
    let id = did;
    if (bot != null && Object.keys(bot.players).includes(id)) id = bot.players[id].uuid;
    console.log(id);
    if (id == "BLOCKED UUID") return;
    if (lastCommand > 0) return;
    let newCmd = "";
    let tempCmd  = command.commandPrep();
    for (let i in commands) {
        if (tempCmd.startsWith(i)) {
            if (!tempCmd.endsWith(i)) {
                if (tempCmd.startsWith(i + " ")) {
                    newCmd = i;
                    break;
                }
            } else {
                newCmd = i;
                break;
            }
        }
    }

    if (newCmd == "") return;

    let args = command.commandPrep().replace(newCmd, "").split(" ");

    if (!isAlive) {
        reply("Bot offline");
        return;
    }

    let cmdConfig = commands[newCmd];

    if (!hasAccess(id, cmdConfig.access)) {
        if (cmdConfig.deny) reply("You don't have a high enough access level. : " + Math.round(Math.random() * (989999999 - 99999 + 1) + 99999), null);
        return;
    }

    lastCommand = 40;

    switch (newCmd) {
        case "reload":
            delete require.cache["<YOUR-PATH>/configs/config.json"];
            delete require.cache["<YOUR-PATH>/configs/tracker.json"];
            delete require.cache["<YOUR-PATH>/configs/commands.json"];
            delete require.cache["<YOUR-PATH>/configs/events.json"];
            cmds.clearCmds();
            Object.keys(commands).forEach((k) => {
                cmds.getCmd(commands[k].file);
            });
            initEvents();
            queuedMessages = [];
            reply("Reloaded bot caches.", null);
            logger.info("Reloaded bot caches.");
        break;
        default:
            try {
                context["info"] = {"userId": id, "args": args, "command": cmdConfig, "message": command};
                cmds.getCmd(cmdConfig.file).runInContext(context);
            } catch (e) {
                otherLog.send({content: "Bot is not fine send help.\n" + e.toString(), files: [gifs.panic[Math.floor(Math.random()*gifs.panic.length)]]});
            }
        break;
    }
}

const addSpam = (message) => {
    if (recentMessages.length >= config.antiSpam.backlog) {
        recentMessages.pop();
    }
    recentMessages.unshift(message);
}

const isSpam = (message) => {
    if (message == null || message == "") return true;
    let count = recentMessages.filter(function(value) {return value.replaceAll(regex.isInt, "") == message.replaceAll(regex.isInt, "")}).length;
    return count > config.antiSpam.frequency;
}

const setDiscord = (disc) => {
    discord = disc;
}

const reply = (response, discord) => {
    if (config.autisticMode) return;
    channels.forEach(channel => {
        if (response["title"] != undefined) {
            channel.send({embeds: [playersEmbed]})
        } else {
            if (discord != null && discord) channel.send(response);
            else addQueueMessage(response);
        }
    })
}

const hasAccess = (id, level) => {
    if (config.access[id] == null) return level == 0;
    return config.access[id] >= level;
}

String.prototype.commandPrep = function() {
    return this.replace(/[!@]/g);
}

const addQueueMessage = (message) => {
    queuedMessages.unshift(message);
}

const getNextMessage = () => {
    let msg = queuedMessages[queuedMessages.length - 1];
    queuedMessages.pop();
    return msg;
}

const getLogger = () => {
    return logger;
}

const getPacketLogger = () => {
    return packetLogger;
}

const getDiscLogger = () => {
    return logDisconnect;
}

const getTracking = () => {
    return tracking;
}

const getTracker = () => {
    return tracker;
}

const getRegex = () => {
    return regex;
}

const setReconnect = (val) => {
    dontReconnect = val;
}

const getReconnect = () => {
    return dontReconnect;
}

const initEvents = () => {
    cmds.clearEvents();
    events.forEach((s) => {
       cmds.getEvent(s);
    });
}

const sendOtherLog = (message) => {
    if (otherLog != null) otherLog.send(message);
}

const getPearlBot = (message) => {
    return pearlBot;
}

const createEmbed = (title, description, color) => {
    let embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description);
    return embed;
}

const getCachedName = () => {
    return cachedName;
}

const setTracker = (array) => {
    tracker = array;
}

const saveTracker = () => {
    fs.writeFileSync("./configs/tracker.json", JSON.stringify(getTracker(), null, 2));
}

const randomWord = () => {
    return words[Math.floor(Math.random()*words.length)];
}

const randomSentence = () => {
    let str = "";
    for (let i = 0; i < Math.floor(Math.random() * 7) + 4; i++) {
        str += randomWord() + " ";
    }
    return str;
}

const loadWords = () => {
    fs.readFile('./data/words.txt', (err, data) => {
        if (err) throw err;
        console.log(data);
        words = data.toString().split("\n");
    });
}

var context = { "createBot": createBot, "disconnectBot": disconnectBot, "getPlayers": getPlayers, "getBot": getBot, "isAlive": isAlive, "floodChat": floodChat, "reply": reply, "isSpam": isSpam, "addSpam": addSpam, "addQueueMessage": addQueueMessage, "getNextMessage": getNextMessage, "pearls": pearls, "config": config, "vec3": vec3, "logError": error, "goals": goals, "logMcEmbed": logMcEmbed, "logMcChat": logMcChat, "processCommand": processCommand, "otherLog": otherLog, "sendOtherLog": sendOtherLog, "getLogger": getLogger, "getPacketLogger": getPacketLogger, "getDiscLogger": getDiscLogger, "getTracking": getTracking, "getTracker": getTracker, "getRegex": getRegex, "setReconnect": setReconnect, "getReconnect": getReconnect, "EmbedBuilder": EmbedBuilder, "Util": Util, "gifs": gifs, "floor": Math.floor, "random": Math.random, "getPearlBot": getPearlBot, "discordNames": discordNames, "createEmbed": createEmbed, "getCachedName": getCachedName, "fs": fs, "setTracker": setTracker, "saveTracker": saveTracker}

module.exports = { createBot, disconnectBot, getPlayers, getBot, isAlive, setChannels, setOtherLog, logMcChat, logMcEmbed, setLoggers, setMessage, getMessage, addDiscord, floodChat, hasAccess, reply, setDiscord, processCommand, isSpam, addSpam, addQueueMessage, getNextMessage, setTracking, loadWords }
