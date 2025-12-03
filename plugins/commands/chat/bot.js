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

  // যদি reply থাকে এবং input না থাকে
  if (!askText && replyText) {
    askText = replyText;
  }

  // প্রেরকের নাম বের করার চেষ্টা করছি (ধরে নিচ্ছি message.senderName এখানে আছে)
  // যদি না পাওয়া যায়, তবে "বন্ধু" ব্যবহার করা হবে।
  const senderName = message.senderName || "বন্ধু"; 

  // === HELPER FUNCTION: Reply with Mention by Name ===
  const replyWithMention = (text) => {
    // Message Body: এখানে শুধু নাম থাকবে, সামনে @ থাকবে না।
    // যেমন: "Likhon Ahmed Bot is alive 😎"
    const bodyText = `${senderName} ${text}`;
    
    return message.reply({
      body: bodyText,
      mentions: [
        {
          // Tag: body-তে থাকা যে টেক্সটটি ট্যাগ হবে, সেটি। 
          tag: senderName, 
          // Id: প্রেরকের ID
          id: message.senderID 
        }
      ]
    });
  };

  // ================= TAG DETECT =================
  const isBotTagged =
    message?.mentions && Object.keys(message.mentions).includes(global.botID);

  // যদি কেউ বটকে tag করে → random message with mention
  if (isBotTagged) {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg => typeof msg === "string" && !msg.startsWith("http"));

    if (!filtered.length) return message.reply("⚠️ No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    
    // মেনশন সহ রিপ্লাই
    return replyWithMention(random);
  }

  // ================= RANDOM HI MSG =================
  if (askText.toLowerCase() === "hi" || askText === "") {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg => typeof msg === "string" && !msg.startsWith("http"));

    if (!filtered.length) return message.reply("⚠️ No valid messages available.");
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    
    // মেনশন সহ রিপ্লাই
    return replyWithMention(random);
  }

  // ================= SIM API =================
  try {
    const res = await axios.get(SIM_API_URL, {
      params: { type: "ask", ask: askText }
    });

    if (res.data && res.data.data && res.data.data.msg) {
      // API থেকে আসা রিপ্লাই মেনশন সহ
      return replyWithMention(res.data.data.msg);
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
