if (Object.keys(pearls).includes(info.userId)) {
    try {
        getBot().chat(pearls[info.userId]["greeting"]);;
        getPearlBot().activateBlock(getPearlBot().blockAt(vec3(pearls[info.userId]["button"][0], pearls[info.userId]["button"][1], pearls[info.userId]["button"][2])));
    } catch (e) {
        logError(e);
    }
}
