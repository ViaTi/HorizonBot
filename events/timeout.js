getDiscLogger().info("<Timeout> " + info.time);
let timeoutEmbed = new EmbedBuilder()
    .setColor(0xE51A36)
    .setTitle("Bot was timedout")
    .setDescription("Time: " + info.time);
logMcEmbed(timeoutEmbed);
disconnectBot();
