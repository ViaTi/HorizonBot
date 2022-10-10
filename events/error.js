getDiscLogger().info(info.error);
sendOtherLog({content: "Bot is not fine send help.\n" + info.error.toString(), files: [gifs.panic[floor(random()*gifs.panic.length)]]});
disconnectBot();
