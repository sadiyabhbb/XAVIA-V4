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

  // ✅ যদি কিছু না লেখে এবং কিছুর উপরে reply করে
  if (!askText && replyText) {
    askText = replyText;
  }

  // ✅ যদি 'hi' বা 'bot' বা খালি কিছু লিখে
  if (askText.toLowerCase() === "hi" || askText === "") {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg =>
      typeof msg === "string" && !msg.startsWith("http")
    );

    if (!filtered.length) return message.reply("⚠️ No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return message.reply(random);
  }

  // 🔁 SIM API তে পাঠাও
  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: askText }
    });

    if (res.data && res.data.data && res.data.data.msg) {
      return message.reply(res.data.data.msg);
    }
  } catch (e) {
    return message.reply("⚠️ API error. Try again.");
  }

  return message.reply("⚠️ Sorry, no reply found.");
}

export default {
  config,
  onCall
};
