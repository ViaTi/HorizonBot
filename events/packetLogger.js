if (!config.ignoredPackets.includes(info.metadata.name)) {
    switch (info.metadata.name) {
        case "map_chunk":
            getPacketLogger().info("<Chunk Loaded> " + info.json.x + ", " + info.json.z);
        break;
        case "scoreboard_score":
            if (info.json.scoreName == "TAB-YellowNumber") {
                getLogger().info("<Ping Updated> " + info.json.itemName + ": " + info.json.value);
            } else {
                getPacketLogger().info("<Unknown Packet> " + info.metadata.name);
                getPacketLogger().info(info.json);
            }
        break;
        case "update_time":
            getLogger().info("<Time Updated> " + info.json.age + ", " + info.json.time);
        break;
        case "keep_alive":
            getLogger().info("<Keep Alive> " + info.json.keepAliveId);
        break;
        default:
            getPacketLogger().info("<Unknown Packet> " + info.metadata.name);
            if (JSON.stringify(info.json).length < 1000) getPacketLogger().info(info.json);
        break;
    }
}
