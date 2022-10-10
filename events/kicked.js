if (info.reason != undefined) {
    getDiscLogger().info("<KICKED> " + JSON.stringify(info.reason));
    logMcEmbed(createEmbed("Bot was kicked", "Reason: " + JSON.parse(info.reason).text, 0xE51A36));
    disconnectBot();
}
