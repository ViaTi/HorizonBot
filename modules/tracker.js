sendOtherLog("Args: " + info.args);
switch (info.args[1]) {
    case "add":
        getTracker().push(info.args[2]);
        saveTracker();
        reply("Beep boop, " + info.args[2] + " added to tracking");
    break
    case "remove":
        setTracker(getTracker().filter(function(value, index, arr){return value != info.args[2];}));
        saveTracker();
        reply("Beep boop, " + info.args[2] + " remove from tracking");
    break
}
