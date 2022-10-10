const fs = require('fs');
const vm = require('vm');
var cmdMap = {};
var eventMap = {};

const getCmd = (file) => {
    if (!Object.keys(cmdMap).includes(file)) fs.readFile("./modules/" + file + ".js", 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                return "NO COMMAND";
            }
            cmdMap[file] = new vm.Script(data);
        });
    if (cmdMap[file] != null) {
        return cmdMap[file];
    }
    return "NO COMMAND";
}

const getEvent = (file) => {
    if (!Object.keys(eventMap).includes(file)) fs.readFile("./events/" + file + ".js", 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                return "NO EVENT";
            }
            eventMap[file] = new vm.Script(data);
        });
    if (eventMap[file] != null) {
        return eventMap[file];
    }
    return "NO EVENT";
}

const clearCmds = () => {
    cmdMap = {};
}

const clearEvents = () => {
    eventMap = {};
}

module.exports = { getCmd, clearCmds, getEvent, clearEvents }
