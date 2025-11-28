function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

const config = {
    name: "filteruser",
    aliases: ["filter", "kicklow"],
    version: "2.0",
    author: "NTKhang (Rewritten by Xavia)",
    description: "Filter users by message count or remove locked accounts",
    usage: "[<message_count>] | die",
    cooldown: 5,
    permissions: [1],
    nixprefix: true,
    vip: false,
    category: "box chat"
};

const langData = {
    "en_US": {
        needAdmin: "⚠️ | Please make the bot an admin to use this command",
        confirm: "⚠️ | Remove members with messages less than {min}? React to confirm.",
        kickByBlock: "✅ | Removed {count} locked accounts",
        kickByMsg: "✅ | Removed {count} members having less than {min} messages",
        noBlock: "✅ | No locked accounts found",
        noMsg: "✅ | No members found with messages less than {min}",
        kickError: "❌ | Failed to kick {count} users:\n{list}"
    },

    "vi_VN": {
        needAdmin: "⚠️ | Vui lòng thêm bot làm quản trị viên để dùng lệnh này",
        confirm: "⚠️ | Bạn có chắc muốn xóa thành viên có số tin nhắn nhỏ hơn {min}? Hãy thả cảm xúc vào tin nhắn này để xác nhận",
        kickByBlock: "✅ | Đã xóa {count} thành viên bị khóa acc",
        kickByMsg: "✅ | Đã xóa {count} thành viên có số tin nhắn nhỏ hơn {min}",
        noBlock: "✅ | Không có thành viên nào bị khóa acc",
        noMsg: "✅ | Không có thành viên nào có số tin nhắn nhỏ hơn {min}",
        kickError: "❌ | Không thể kick {count} thành viên:\n{list}"
    }
};

const reactionCache = new Map();

async function onCall({ message, args, getLang, threadsData, api, event }) {
    const threadData = await threadsData.get(event.threadID);

    if (!threadData.adminIDs.includes(api.getCurrentUserID()))
        return message.reply(getLang("needAdmin"));

    // --- Handle Number (filter by message count)
    if (!isNaN(args[0])) {
        const minimum = Number(args[0]);

        return message.reply(
            getLang("confirm", { min: minimum }),
            (err, info) => {
                reactionCache.set(info.messageID, {
                    author: event.senderID,
                    minimum,
                    threadID: event.threadID
                });
            }
        );
    }

    // --- Handle "die" (remove locked users)
    if (args[0] === "die") {
        const info = await api.getThreadInfo(event.threadID);
        const users = info.userInfo;

        const locked = users.filter(u => u.type !== "User");
        const success = [];
        const errors = [];

        for (const u of locked) {
            try {
                if (!info.adminIDs.includes(u.id)) {
                    await api.removeUserFromGroup(u.id, event.threadID);
                    success.push(u.id);
                    await sleep(700);
                }
            } catch {
                errors.push(u.name);
            }
        }

        let msg = "";
        if (success.length)
            msg += getLang("kickByBlock", { count: success.length }) + "\n";
        if (errors.length)
            msg += getLang("kickError", { count: errors.length, list: errors.join("\n") });

        if (!msg)
            msg = getLang("noBlock");

        return message.reply(msg);
    }

    // Invalid usage
    return message.reply("Usage: filteruser <number> | die");
}

async function onReaction({ message, event, getLang, threadsData, api }) {
    const data = reactionCache.get(event.messageID);
    if (!data) return;

    if (event.userID !== data.author) return;

    const { minimum, threadID } = data;
    const thread = await threadsData.get(threadID);
    const botID = api.getCurrentUserID();

    const targets = thread.members.filter(m =>
        m.count < minimum &&
        m.inGroup &&
        m.userID !== botID &&
        !thread.adminIDs.includes(m.userID)
    );

    const success = [];
    const errors = [];

    for (const user of targets) {
        try {
            await api.removeUserFromGroup(user.userID, threadID);
            success.push(user.userID);
        } catch {
            errors.push(user.name);
        }
        await sleep(700);
    }

    let msg = "";
    if (success.length)
        msg += getLang("kickByMsg", { count: success.length, min: minimum }) + "\n";
    if (errors.length)
        msg += getLang("kickError", { count: errors.length, list: errors.join("\n") });

    if (!msg)
        msg = getLang("noMsg", { min: minimum });

    message.reply(msg);
    reactionCache.delete(event.messageID);
}

export default {
    config,
    langData,
    onCall,
    onReaction
};
