import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Auto chat with loop using SIM API",
  usage: "bot hi | bot <your message>",
  cooldown: 3,
  permissions: [0],
  nixprefix: true,
  credits: "LIKHON AHMED"
};

const LOCAL_CACHE = "./cache/teach.json";
const SIM_API_URL = "http://65.109.80.126:20392/sim";

function ensureCache() {
  const defaultData = [
    "Hello! How can I help you today?",
    "I'm always here for you!",
    "What's up? 😊",
    "Need any help?",
    "Hi there! I'm your bot buddy.",
    "Bot is alive 😎",
    "Ready to respond anytime!",
    "How’s your day going?"
  ];

  if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");

  if (!fs.existsSync(LOCAL_CACHE)) {
    fs.writeFileSync(LOCAL_CACHE, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

export async function onCall({ message, args }) {
  ensureCache();

  const inputText = args.join(" ").trim();
  const replyText = message?.reply_message?.text?.trim();

  // ========== NAME FIX ==========
  let fullName = message.senderName;
  if (!fullName || fullName.trim() === "") {
    try {
      const info = await global.api.getUserInfo(message.senderID);
      fullName = info[message.senderID]?.name || "User";
    } catch {
      fullName = "User";
    }
  }

  // ==== MENTION FUNCTION ====
  const replyWithMention = (text) => {
    return message.reply({
      body: `${fullName}, ${text}`,
      mentions: [{ tag: fullName, id: message.senderID }]
    });
  };

  // ===== bot word detect =====
  const triggers = ["bot", "বট", "robot", "robo", "রোবট"];
  const msgLower = inputText.toLowerCase();

  const calledBot = triggers.some(w => msgLower.startsWith(w));

  // ========== CASE 1: user says "bot" → RANDOM MESSAGE ==========
  if (calledBot) {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(m => typeof m === "string" && !m.startsWith("http"));
    const random = filtered[Math.floor(Math.random() * filtered.length)];

    return replyWithMention(random);
  }

  // ========== CASE 2: user replies to bot → SEND TO SIM API ==========
  if (replyText && message.reply_message?.senderID === global.botID) {
    const ask = inputText || replyText;

    try {
      const res = await axios.get(SIM_API_URL, {
        params: { type: "ask", ask }
      });

      if (res.data?.data?.msg) {
        return replyWithMention(res.data.data.msg);
      } else {
        return replyWithMention("কিছু বুঝলাম না 😅");
      }
    } catch {
      return message.reply("⚠️ API error!");
    }
  }

  // OTHERWISE → ignore
  return;
}

export default {
  config,
  onCall
};
