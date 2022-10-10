const info = require("./data/players.json");

const exists = (key) => {
    return info[key] != null;
}

const add = (key) => {
    if (exists(key)) return;
    info[key] = {
        "names": [],
        "lastSeen": 0,
        "joins": 0,
        "leaves": 0,
        "deaths": 0,
        "messages": 0
    }
}

const save = () => {
    try {
        fs.writeFileSync("./data/players.json", JSON.stringify(info));
    } catch (err) {
        logger.info(err);
    }
}


const find = (key) => {
    if (info[key] != null) return info[key];
    Object.keys(info).forEach((player) => {

    });
}

const addJoin = (key) => {

}
