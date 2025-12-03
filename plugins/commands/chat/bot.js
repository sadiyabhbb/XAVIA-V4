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
  let askText = inputText;

  if (!askText && replyText) askText = replyText;

  // ===== FIX: FULL NAME 100% Ensure =====
  let fullName = message.senderName;

  // যদি senderName না আসে → fallback from message.senderID
  if (!fullName || fullName.trim() === "") {
    try {
      const info = await global.api.getUserInfo(message.senderID);
      fullName = info[message.senderID]?.name || "User";
    } catch {
      fullName = "User";
    }
  }

  // === PERFECT Mention ===
  const replyWithMention = (text) => {
    const bodyText = `${fullName}, ${text}`;

    return message.reply({
      body: bodyText,
      mentions: [
        {
          tag: fullName,
          id: message.senderID
        }
      ]
    });
  };

  // Bot tag detection
  const isBotTagged =
    message?.mentions && Object.keys(message.mentions).includes(global.botID);

  if (isBotTagged) {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg => typeof msg === "string" && !msg.startsWith("http"));
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return replyWithMention(random);
  }

  // HI or empty
  if (askText.toLowerCase() === "hi" || askText === "") {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg => typeof msg === "string" && !msg.startsWith("http"));
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return replyWithMention(random);
  }

  // SIM API
  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: askText }
    });

    if (res.data?.data?.msg) {
      return replyWithMention(res.data.data.msg);
    }
  } catch {
    return message.reply("⚠️ API error. Try again.");
  }

  return message.reply("⚠️ Sorry, no reply found.");
}

export default {
  config,
  onCall
};
