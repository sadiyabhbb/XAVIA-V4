import axios from "axios";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

const GoatStor = "http://goatstore.vercel.app";

function findCommandFile(commandName, baseDir) {
  const searchDirs = (dir) => {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        const result = searchDirs(fullPath);
        if (result) return result;
      } else if (item === `${commandName}.js`) {
        return fullPath;
      }
    }
    return null;
  };
  return searchDirs(baseDir);
}

const config = {
  name: "xaviastore",
  aliases: ["xs", "market"],
  version: "0.0.1",
  permissions: [0],
  credits: "ArYAN",
  description: "XaviaStore - Your Command Marketplace - Browse, search, upload commands",
  usage: "show <ID> | page <number> | search <query> | trending | status | like <ID> | upload <name>",
  category: "market",
  cooldowns: 0
};

async function onCall({ message, args }) {
  const sendBeautifulMessage = (content) => {
    const header = "╭──『 ⚡𝗫𝗮𝘃𝗶𝗮𝗦𝘁𝗼𝗿𝗲 』──╮\n";
    const footer = "\n╰──────────────╯";
    return message.reply(header + content + footer);
  };

  try {
    if (!args[0]) {
      return sendBeautifulMessage(
        "\n" +
        `╭─❯ ${message.prefix}xaviastore show <ID>\n├ 📦 Get command code\n╰ Example: show 1\n\n` +
        `╭─❯ ${message.prefix}xaviastore page <number>\n├ 📄 Browse commands\n╰ Example: page 1\n\n` +
        `╭─❯ ${message.prefix}xaviastore search <query>\n├ 🔍 Search commands\n╰ Example: search music\n\n` +
        `╭─❯ ${message.prefix}xaviastore trending\n├ 🔥 View trending\n╰ Most popular commands\n\n` +
        `╭─❯ ${message.prefix}xaviastore status\n├ 📊 View statistics\n╰ Marketplace insights\n\n` +
        `╭─❯ ${message.prefix}xaviastore like <ID>\n├ 💝 Like a command\n╰ Example: like 1\n\n` +
        `╭─❯ ${message.prefix}xaviastore upload <name>\n├ ⬆️ Upload command\n╰ Example: upload music\n\n` +
        "💫 𝗧𝗶𝗽: Explore the marketplace!"
      );
    }

    const command = args[0].toLowerCase();

    switch (command) {
      case "show": {
        const itemID = parseInt(args[1]);
        if (isNaN(itemID)) return sendBeautifulMessage("\n[⚜️]➜ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐢𝐭𝐞𝐦 𝐈𝐃.");
        const response = await axios.get(`${GoatStor}/api/item/${itemID}`);
        const item = response.data;

        const bangladeshTime = new Date(item.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

        return sendBeautifulMessage(
          "\n" +
          `╭─❯ 👑 𝗡𝗮𝗺𝗲\n╰ ${item.itemName}\n\n` +
          `╭─❯ 🆔 𝗜𝗗\n╰ ${item.itemID}\n\n` +
          `╭─❯ ⚙️ 𝗧𝘆𝗽𝗲\n╰ ${item.type || 'Unknown'}\n\n` +
          `╭─❯ 📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻\n╰ ${item.description}\n\n` +
          `╭─❯ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿\n╰ ${item.authorName}\n\n` +
          `╭─❯ 📅 𝗔𝗱𝗱𝗲𝗱\n╰ ${bangladeshTime}\n\n` +
          `╭─❯ 👀 𝗩𝗶𝗲𝘄𝘀\n╰ ${item.views}\n\n` +
          `╭─❯ 💝 𝗟𝗶𝗸𝗲𝘀\n╰ ${item.likes}\n\n` +
          `╭─❯ 🔗 𝗥𝗮𝘄 𝗟𝗶𝗻𝗸\n╰ ${GoatStor}/raw/${item.rawID}`
        );
      }

      case "page": {
        const page = parseInt(args[1]) || 1;
        const { data: { items, total } } = await axios.get(`${GoatStor}/api/items?page=${page}&limit=5`);
        const totalPages = Math.ceil(total / 5);
        if (page <= 0 || page > totalPages) {
          return sendBeautifulMessage("\n[⚜️]➜ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐩𝐚𝐠𝐞 𝐧𝐮𝐦𝐛𝐞𝐫.");
        }
        const itemsList = items.map((item, index) =>
          `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
          `├ 🆔 𝗜𝗗: ${item.itemID}\n` +
          `├ ⚙️ 𝗧𝘆𝗽𝗲: ${item.type}\n` +
          `├ 📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${item.description}\n` +
          `├ 👀 𝗩𝗶𝗲𝘄𝘀: ${item.views}\n` +
          `├ 💝 𝗟𝗶𝗸𝗲𝘀: ${item.likes}\n` +
          `╰ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${item.authorName}\n`
        ).join("\n");
        return sendBeautifulMessage(`\n📄 𝗣𝗮𝗴𝗲 ${page}/${totalPages}\n\n${itemsList}`);
      }

      case "search": {
        const query = args.slice(1).join(" ");
        if (!query) return sendBeautifulMessage("\n[⚜️]➜ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐬𝐞𝐚𝐫𝐜𝐡 𝐪𝐮𝐞𝐫𝐲. ");
        const { data } = await axios.get(`${GoatStor}/api/items?search=${encodeURIComponent(query)}`);
        const results = data.items;
        if (!results.length) return sendBeautifulMessage("\n❌ 𝐍𝐨 𝐦𝐚𝐭𝐜𝐡𝐢𝐧𝐠 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬 𝐟𝐨𝐮𝐧𝐝.");
        const searchList = results.slice(0, 5).map((item, index) =>
          `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
          `├ 🆔 𝗜𝗗: ${item.itemID}\n` +
          `├ ⚙️ 𝗧𝘆𝗽𝗲: ${item.type}\n` +
          `├ 👀 𝗩𝗶𝗲𝘄𝘀: ${item.views}\n` +
          `├ 💝 𝗟𝗶𝗸𝗲𝘀: ${item.likes}\n` +
          `╰ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿: ${item.authorName}\n`
        ).join("\n");
        return sendBeautifulMessage(`\n📝 Query: "${query}"\n\n${searchList}`);
      }

      case "trending": {
        const { data } = await axios.get(`${GoatStor}/api/trending`);
        const trendingList = data.slice(0, 5).map((item, index) =>
          `╭─❯ ${index + 1}. 🔥 ${item.itemName}\n` +
          `├ 💝 𝗟𝗶𝗸𝗲𝘀: ${item.likes}\n` +
          `╰ 👀 𝗩𝗶𝗲𝘄𝘀: ${item.views}\n`
        ).join("\n");
        return sendBeautifulMessage(`\n${trendingList}`);
      }

      case "status": {
        const { data: stats } = await axios.get(`${GoatStor}/api/stats`);
        const { hosting, totalCommands, totalLikes, dailyActiveUsers, popularTags, topAuthors, topViewed } = stats;
        const uptimeStr = `${hosting?.uptime?.years}y ${hosting?.uptime?.months}m ${hosting?.uptime?.days}d ${hosting?.uptime?.hours}h ${hosting?.uptime?.minutes}m ${hosting?.uptime?.seconds}s`;
        const tagList = popularTags.map((tag, i) =>
          `${i + 1}. ${tag._id || 'Unknown'} (${tag.count})`
        ).join('\n');
        const authorList = topAuthors.map((a, i) =>
          `${i + 1}. ${a._id || 'Unknown'} (${a.count})`
        ).join('\n');
        const viewedList = topViewed.map((v, i) =>
          `${i + 1}. ${v.itemName} 𝗜𝗗: ${v.itemID}\n 𝗩𝗶𝗲𝘄𝘀: ${v.views}`
        ).join('\n\n');
        return sendBeautifulMessage(
          `\n╭─❯ 📦 Total Commands: ${totalCommands}\n` +
          `├─❯ 💝 Total Likes: ${totalLikes}\n` +
          `├─❯ 👥 Daily Users: ${dailyActiveUsers}\n` +
          `╰─❯ ⏰ Uptime: ${uptimeStr}\n\n` +
          `══『 🌟 Top Authors 』══\n╰${authorList}\n\n` +
          `══『 🔥 Most Viewed 』══\n╰${viewedList}\n` +
          `      🌐 𝗛𝗼𝘀𝘁𝗶𝗻𝗴 𝗜𝗻𝗳𝗼\n` +
          `╭─❯ 💻 𝗦𝘆𝘀𝘁𝗲𝗺\n` +
          `├ 🔧 ${hosting.system.platform} (${hosting.system.arch})\n` +
          `├ 📌 Node ${hosting.system.nodeVersion}\n` +
          `╰ 🖥️ CPU Cores: ${hosting.system.cpuCores}`
        );
      }

      case "like": {
        const likeItemId = parseInt(args[1]);
        if (isNaN(likeItemId)) return sendBeautifulMessage("\n[⚠️]➜ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐢𝐭𝐞𝐦 𝐈𝐃.");
        const { data } = await axios.post(`${GoatStor}/api/items/${likeItemId}/like`);
        if (data.success) {
          return sendBeautifulMessage(
            `\n╭─❯ ✨ 𝗦𝘁𝗮𝘁𝘂𝘀\n╰ Successfully liked!\n\n╭─❯ 💝 𝗧𝗼𝘁𝗮𝗹 𝗟𝗶𝗸𝗲𝘀\n╰ ${data.likes}`
          );
        } else {
          return sendBeautifulMessage("\n[⚜️]➜ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐥𝐢𝐤𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.");
        }
      }

      case "upload": {
        const commandName = args[1];
        if (!commandName) return sendBeautifulMessage("\n[⚜️]➜ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐧𝐚𝐦𝐞.");
        const commandsDir = join(global.mainPath, 'plugins', 'commands');
        const commandPath = findCommandFile(commandName, commandsDir);
        if (!commandPath) return sendBeautifulMessage(`\n❌ 𝐅𝐢𝐥𝐞 '${commandName}.js' 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝 𝐢𝐧 𝐚𝐧𝐲 𝐟𝐨𝐥𝐝𝐞𝐫.`);
        try {
          const code = readFileSync(commandPath, 'utf8');
          let commandFile;
          try {
            commandFile = await import(pathToFileURL(commandPath).href);
          } catch (err) {
            return sendBeautifulMessage("\n[⚜️]➜  𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐟𝐢𝐥𝐞 𝐟𝐨𝐫𝐦𝐚𝐭.");
          }
          const uploadData = {
            itemName: commandFile.default?.config?.name || commandName,
            description: commandFile.default?.config?.description || "No description",
            type: "XaviaBot",
            code,
            authorName: commandFile.default?.config?.credits || message.senderID || "Unknown"
          };
          const response = await axios.post(`${GoatStor}/v1/paste`, uploadData);
          if (response.data.success) {
            const { itemID, link } = response.data;
            return sendBeautifulMessage(
              "\n" +
              `╭─❯ ✅ 𝗦𝘁𝗮𝘁𝘂𝘀\n╰ command uploaded successfully\n\n` +
              `╭─❯ 👑 𝗡𝗮𝗺𝗲\n╰ ${uploadData.itemName}\n\n` +
              `╭─❯ 🆔 𝗜𝗗\n╰ ${itemID}\n\n` +
              `╭─❯ 👨‍💻 𝗔𝘂𝘁𝗵𝗼𝗿\n╰ ${uploadData.authorName}\n\n` +
              `╭─❯ 🔗 𝗥𝗮𝘄 𝗟𝗶𝗻𝗸\n╰ ${link}`
            );
          }
          return sendBeautifulMessage("\n[⚜️]➜ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐮𝐩𝐥𝐨𝐚𝐝 𝐭𝐡𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.");
        } catch (error) {
          console.error("Upload error:", error);
          return sendBeautifulMessage("\n[⚜️]➜ 𝐀𝐧 𝐮𝐧𝐞𝐱𝐩𝐞𝐜𝐭𝐞𝐝 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐝𝐮𝐫𝐢𝐧𝐠 𝐮𝐩𝐥𝐨𝐚𝐝.");
        }
      }

      default:
        return sendBeautifulMessage("\n[⚜️]➜ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐬𝐮𝐛𝐜𝐨𝐦𝐦𝐚𝐧𝐝.");
    }
  } catch (err) {
    console.error("XaviaStore Error:", err);
    return sendBeautifulMessage("\n[⚜️]➜ 𝐀𝐧 𝐮𝐧𝐞𝐱𝐩𝐞𝐜𝐭𝐞𝐝 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝.");
  }
}

export default {
  config,
  onCall
};
