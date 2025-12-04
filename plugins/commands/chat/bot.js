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
    "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
    "কি গো সোনা আমাকে ডাকছ কেনো",
    "বার বার আমাকে ডাকস কেন😡",
    "আহ শোনা আমার আমাকে এতো ডাক্তাছো কেনো আসো বুকে আশো🥱",
    "হুম জান তোমার অইখানে উম্মমাহ😷😘",
    "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি",
    "আমাকে এতো না ডেকে বস নয়নকে একটা গফ দে 🙄",
    "jang hanga korba",
    "jang bal falaba🙂"
  ];

  if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");
  if (!fs.existsSync(LOCAL_CACHE)) {
    fs.writeFileSync(LOCAL_CACHE, JSON.stringify(defaultData, null, 2), "utf-8");
  }
}

export async function onCall({ message, args }) {
  ensureCache();

  const inputText = args.join(" ").trim();

  // Full Name 100% পাওয়া
  let fullName = message.senderName || "User";
  if (!fullName || fullName.trim() === "") {
    try {
      const info = await global.api.getUserInfo(message.senderID);
      fullName = info[message.senderID]?.name || "User";
    } catch {
      fullName = "User";
    }
  }

  // এই ফরম্যাটে রিপ্লাই দিবে → ( {নাম}, ) মেসেজ
  const replyWithMention = (text) => {
    return message.reply({
      body: `( {\( {fullName}, ) \){text}`,
      mentions: [{ tag: fullName, id: message.senderID }]
    });
  };

  // ১. Bot কে ট্যাগ করা হয়েছে কি না?
  const isBotTagged = message.mentions && Object.keys(message.mentions).includes(global.botID);

  // ২. Bot-এর মেসেজের রিপ্লাই দেওয়া হয়েছে কি না? (এটাই মূল চেক)
  const isReplyToBot = message.reply_message && message.reply_message.senderID === global.botID;

  // ৩. প্রথমবার ডাকা হচ্ছে (bot / hi / ট্যাগ / খালি) → র‍্যান্ডম মেসেজ
  const isFirstCall = isBotTagged || 
                      inputText === "" || 
                      inputText.toLowerCase() === "hi" || 
                      inputText.toLowerCase().startsWith("bot");

  if (isFirstCall && !isReplyToBot) {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const filtered = data.filter(msg => typeof msg === "string" && !msg.startsWith("http"));
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    return replyWithMention(random);
  }

  // ৪. Bot-এর মেসেজের রিপ্লাই দিলে → SIM API চালাবে (এটাই তুমি চেয়েছিলে)
  if (isReplyToBot || isBotTagged || inputText) {
    let ask = message.body?.trim() || inputText || "হুম বলো";

    // যদি শুধু রিপ্লাই দেয় আর কিছু না লেখে → তবুও কাজ করবে
    if (isReplyToBot && !message.body?.trim()) {
      ask = "হুম বলো 😊";
    }

    try {
      const res = await axios.get(SIM_API_URL, {
        params: { type: "ask", ask: ask }
      });

      if (res.data?.data?.msg) {
        return replyWithMention(res.data.data.msg);
      } else {
        return replyWithMention("একটু ভেবে বলছি... 🥺");
      }
    } catch (err) {
      console.error("SIM API Error:", err.message);
      return replyWithMention("সার্ভার ডাউন ভাই, পরে বলিস 😭");
    }
  }

  // কিছুই না মিললে
  return replyWithMention("কিছু বল না কেনো? 😏");
}

export default {
  config,
  onCall
};
