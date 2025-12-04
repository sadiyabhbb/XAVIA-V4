const config = {
    credits: "Malik",
    isAbsolute: true,
    cooldown: 3,
    nixprefix: true,
    version: "1.1.0"
}

function onLoad() {
    global.dispatching = [];
}

const langData = {
    "vi_VN": {
        "stopped": "Stopped!",
        "notRunning": "Not running yet!",
        "alreadyRun": "Already run!"
    },
    "en_US": {
        "stopped": "Stopped!",
        "notRunning": "Not running yet!",
        "alreadyRun": "Already run!"
    },
    "ar_SY": {
        "stopped": "توقف!",
        "notRunning": "لايعمل بعد!",
        "alreadyRun": "يعمل بالفعل!"
    }
}

async function onCall({ message, args, getLang }) {
    const input = args.join(" ").split(" - ");
    const content = input[0] || 'SPAM';
    let dispatchTimes = parseInt(input[1]);

    if (args[0] === "stop") {
        if (global.dispatching.includes(message.threadID)) {
            global.dispatching = global.dispatching.filter(e => e !== message.threadID);
            return message.reply(getLang("stopped"));
        } else {
            return message.reply(getLang("notRunning"));
        }
    }

    if (!dispatchTimes || isNaN(dispatchTimes) || dispatchTimes < 1) dispatchTimes = 10;

    if (global.dispatching.includes(message.threadID))
        return message.reply(getLang("alreadyRun"));

    global.dispatching.push(message.threadID);

    let fail = 0;
    for (let i = 0; i < dispatchTimes; i++) {
        try {
            if (!global.dispatching.includes(message.threadID)) break;
            await message.send(content);
            await global.sleep(100);
        } catch (error) {
            fail++;
            if (fail >= 3) break;
        }
    }

    global.dispatching = global.dispatching.filter(e => e !== message.threadID);
}

export default {
    onLoad,
    langData,
    config,
    onCall
}
