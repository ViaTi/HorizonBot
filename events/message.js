var valid = info.message.match(getRegex().message_discord);
var conclusion = false;

if (!isAlive()) conclusion = true;

if (valid != null && !conclusion) {
    let name = valid.toString();
    if (discordNames.includes(name.split("> ")[1].replace(":", ""))) {
        logMcChat("**" + Util.escapeMarkdown(valid.toString()) + "**" + Util.escapeMarkdown(info.message.replace(name, "")));
        conclusion = true;
    }
}

valid = info.message.match(getRegex().message);

if (valid != null && !conclusion) {
    if (getTracker().includes(valid.toString().toLowerCase().replace("<", "").replace(">", "")) && info.message.includes("!pearl")) {
        getTracking().send(info.message);
    }

    addSpam(info.message);

    if (isSpam(info.message)) {
        getLogger().info(`<Message> ${info.message}`);
        conclusion = true;
    }

    if (!conclusion) {
        logMcChat("**" + Util.escapeMarkdown(valid.toString()) + "**" + Util.escapeMarkdown(info.message.replace(getRegex().message, "")));
        processCommand(info.message.replace(getRegex().message, "").trim(), valid.toString().replace("<", "").replace(">", ""), false);
        console.log(valid.toString().replace("<", "").replace(">", ""));
    }
    conclusion = true;
}

var name = info.message.split(" ")[0];
//if (getCachedName() == null || name == getBot().players[getCachedName()].displayName.text) conclusion = true;

var embed;

valid = info.message.match(getRegex().joined);

if (valid != null && !conclusion) {
    embed = createEmbed("Player Joined", Util.escapeMarkdown(info.message).replace(name, "**"+name+"**"), 0x21DE51);
    logMcEmbed(embed);
    if (getTracker().includes(name.toLowerCase().replace("<", "").replace(">", ""))) getTracking().send({"embeds": [embed]});
    conclusion = true;;
}

valid = info.message.match(getRegex().left);

if (valid != null && !conclusion) {
    embed = createEmbed("Player Left", Util.escapeMarkdown(info.message).replace(name, "**"+name+"**"), 0xE51A36);
    logMcEmbed(embed);
    if (getTracker().includes(name.toLowerCase().replace("<", "").replace(">", ""))) getTracking().send({"embeds": [embed]});
    conclusion = true;;
}

valid = info.message.match(getRegex().died);

if (valid != null && !conclusion) {
    embed = createEmbed("Player Died", Util.escapeMarkdown(info.message).replace(name, "**"+name+"**"), 0xC11BE4);
    logMcEmbed(embed);
    conclusion = true;;
}

valid = info.message.match(getRegex().advancement);

if (valid != null && !conclusion) {
    embed = createEmbed("Advancement Obtained", Util.escapeMarkdown(info.message).replace(name, "**"+name+"**"), 0xF10EEC);
    logMcEmbed(embed);
    conclusion = true;;
}

valid = info.message.match(getRegex().whisper);

if (valid != null && !conclusion) {
    processCommand(info.message.replace(getRegex().whisper, "").trim(), info.message.split(" ")[0].replace("[", ""), false);
}


if (isAlive() && !conclusion) {
    getLogger().info(`<Unknown Message> ${info.message}`);
    sendOtherLog(info.message);
}
