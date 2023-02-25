const AppIdMap = Object.freeze({
    production: Object.freeze({
        'bot.deriv.com': '35590',
        'bot.deriv.me': '35590', // todo: change when will be registered
        'bot.deriv.be': '35590',
    }),
    staging: Object.freeze({
        'staging-bot.deriv.com': '35590',
        'staging-bot.deriv.be': '35590',
    }),
    dev: Object.freeze({
        localhost: '35590',
        'localbot.binary.sx': '35590',
    }),
});
export default AppIdMap;
