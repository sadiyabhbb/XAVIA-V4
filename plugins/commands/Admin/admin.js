const config = {
    name: "admin",
    aliases: ["adm"],
    description: "Manage temporary admins (until bot restart)",
    usage: "[-a/@mention] [-r/@mention] [-l]",
    cooldown: 3,
    permissions: [2],
    isAbsolute: true,
    credits: "Aryan Rayh",
    nixprefix: true,
    vip: false
};

const langData = {
    "en_US": {
        "notGroup": "This command only works in group",
        "missingTarget": "Please mention or reply to a user",
        "alreadyAdmin": "{name} is already an admin",
        "addedAdmin": "Added {name} as temporary admin",
        "notAdmin": "{name} is not a temporary admin",
        "removedAdmin": "Removed {name} from temporary admins",
        "adminList": "Temporary Admin List:\n{list}",
        "noAdmins": "No temporary admins",
        "cannotAddSelf": "You cannot add yourself",
        "cannotAddBot": "Cannot add bot as admin",
        "invalidUsage": "Usage:\n• admin -a @user (add admin)\n• admin -r @user (remove admin)\n• admin -l (list admins)\n\nOr reply to a message with:\n• admin add\n• admin remove",
        "error": "An error occurred"
    },
    "vi_VN": {
        "notGroup": "Lệnh này chỉ hoạt động trong nhóm",
        "missingTarget": "Vui lòng tag hoặc reply người dùng",
        "alreadyAdmin": "{name} đã là admin rồi",
        "addedAdmin": "Đã thêm {name} làm admin tạm thời",
        "notAdmin": "{name} không phải admin tạm thời",
        "removedAdmin": "Đã xóa {name} khỏi danh sách admin tạm thời",
        "adminList": "Danh sách Admin tạm thời:\n{list}",
        "noAdmins": "Không có admin tạm thời",
        "cannotAddSelf": "Bạn không thể thêm chính mình",
        "cannotAddBot": "Không thể thêm bot làm admin",
        "invalidUsage": "Cách dùng:\n• admin -a @user (thêm admin)\n• admin -r @user (xóa admin)\n• admin -l (danh sách admin)\n\nHoặc reply tin nhắn với:\n• admin add\n• admin remove",
        "error": "Đã có lỗi xảy ra"
    },
    "ar_SY": {
        "notGroup": "هذا الأمر يعمل فقط في المجموعة",
        "missingTarget": "يرجى الإشارة أو الرد على مستخدم",
        "alreadyAdmin": "{name} هو بالفعل مشرف",
        "addedAdmin": "تمت إضافة {name} كمشرف مؤقت",
        "notAdmin": "{name} ليس مشرفًا مؤقتًا",
        "removedAdmin": "تمت إزالة {name} من المشرفين المؤقتين",
        "adminList": "قائمة المشرفين المؤقتين:\n{list}",
        "noAdmins": "لا يوجد مشرفون مؤقتون",
        "cannotAddSelf": "لا يمكنك إضافة نفسك",
        "cannotAddBot": "لا يمكن إضافة البوت كمشرف",
        "invalidUsage": "الاستخدام:\n• admin -a @user (إضافة مشرف)\n• admin -r @user (إزالة مشرف)\n• admin -l (قائمة المشرفين)",
        "error": "حدث خطأ"
    }
};

if (!global.tempAdmins) {
    global.tempAdmins = new Map();
}

function getThreadAdmins(threadID) {
    if (!global.tempAdmins.has(threadID)) {
        global.tempAdmins.set(threadID, new Set());
    }
    return global.tempAdmins.get(threadID);
}

async function getUserName(userID) {
    try {
        const userInfo = await global.api.getUserInfo(userID);
        return userInfo[userID]?.name || userID;
    } catch {
        return userID;
    }
}

async function onCall({ message, args, getLang, data }) {
    const { threadID, senderID, mentions, messageReply, type } = message;
    
    if (!message.isGroup) return message.reply(getLang("notGroup"));
    
    const threadAdmins = getThreadAdmins(threadID);
    const input = args[0]?.toLowerCase();
    
    let targetIDs = [];
    
    if (Object.keys(mentions).length > 0) {
        targetIDs = Object.keys(mentions);
    } else if (type === "message_reply" && messageReply?.senderID) {
        targetIDs = [messageReply.senderID];
    }
    
    try {
        if (input === "-a" || input === "add" || input === "-add") {
            if (targetIDs.length === 0) return message.reply(getLang("missingTarget"));
            
            const targetID = targetIDs[0];
            if (targetID === senderID) return message.reply(getLang("cannotAddSelf"));
            if (targetID === global.botID) return message.reply(getLang("cannotAddBot"));
            
            if (threadAdmins.has(targetID)) {
                const name = await getUserName(targetID);
                return message.reply(getLang("alreadyAdmin", { name }));
            }
            
            threadAdmins.add(targetID);
            
            // Add to config.json MODERATORS if not already there
            if (!global.config.MODERATORS.includes(targetID)) {
                global.config.MODERATORS.push(targetID);
                
                // Save to config file
                try {
                    const fs = await import('fs/promises');
                    const configPath = './config/config.main.json';
                    const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
                    configData.MODERATORS = global.config.MODERATORS;
                    await fs.writeFile(configPath, JSON.stringify(configData, null, 4));
                } catch (error) {
                    console.error('Failed to save config:', error);
                }
            }
            
            const name = await getUserName(targetID);
            return message.reply(getLang("addedAdmin", { name }));
            
        } else if (input === "-r" || input === "remove" || input === "-remove") {
            if (targetIDs.length === 0) return message.reply(getLang("missingTarget"));
            
            const targetID = targetIDs[0];
            
            if (!threadAdmins.has(targetID)) {
                const name = await getUserName(targetID);
                return message.reply(getLang("notAdmin", { name }));
            }
            
            threadAdmins.delete(targetID);
            
            // Remove from config.json MODERATORS
            const modIndex = global.config.MODERATORS.indexOf(targetID);
            if (modIndex > -1) {
                global.config.MODERATORS.splice(modIndex, 1);
                
                // Save to config file
                try {
                    const fs = await import('fs/promises');
                    const configPath = './config/config.main.json';
                    const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
                    configData.MODERATORS = global.config.MODERATORS;
                    await fs.writeFile(configPath, JSON.stringify(configData, null, 4));
                } catch (error) {
                    console.error('Failed to save config:', error);
                }
            }
            
            const name = await getUserName(targetID);
            return message.reply(getLang("removedAdmin", { name }));
            
        } else if (input === "-l" || input === "list" || input === "-list") {
            const adminList = [];
            let index = 1;
            
            // Show config.json moderators first
            const configAdmins = global.config.MODERATORS || [];
            for (const adminID of configAdmins) {
                const name = await getUserName(adminID);
                adminList.push(`${index}. ${name} (${adminID}) [Config]`);
                index++;
            }
            
            // Then show temporary admins
            for (const adminID of threadAdmins) {
                if (!configAdmins.includes(adminID)) {
                    const name = await getUserName(adminID);
                    adminList.push(`${index}. ${name} (${adminID}) [Temp]`);
                    index++;
                }
            }
            
            if (adminList.length === 0) {
                return message.reply(getLang("noAdmins"));
            }
            
            return message.reply(getLang("adminList", { list: adminList.join("\n") }));
            
        } else {
            return message.reply(getLang("invalidUsage"));
        }
    } catch (e) {
        console.error(e);
        return message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall
};
