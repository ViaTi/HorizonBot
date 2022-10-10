if (isAlive()) {
    if (getBot().food <= 19) {
        getBot().autoEat.enable();
    } else {
        getBot().autoEat.disable();
    }
    if (getBot().health <= 19) {
        logMcChat("<@616113977830932490> the bot is on " + getBot().health + " health, please get on.");
        disconnectBot();
        setReconnect(true);
    }
}
