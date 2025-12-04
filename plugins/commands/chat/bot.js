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

  // Full Name Fix
  let fullName = message.senderName || "User";
  if (!fullName || fullName.trim() === "") {
    try {
      const info = await global.api.getUserInfo(message.senderID);
      fullName = info[message.senderID]?.name || "User";
    } catch (e) {
      fullName = "User";
    }
  }

  const replyWithMention = (text) => {
    return message.reply({
      body: `\( {fullName}, \){text}`,
      mentions: [{ tag: fullName, id: message.senderID }]
    });
  };

  // ১. Bot ট্যাগ করলে বা "bot" / "hi" / খালি মেসেজ → র‍্যান্ডম রিপ্লাই
  const isBotTagged = message?.mentions && Object.keys(message.mentions).includes(global.botID);
  const isBotCall = inputText === "" || 
                    inputText.toLowerCase() === "hi" || 
                    inputText.toLowerCase().startsWith("bot");

  if (isBotTagged || isBotCall) {
    // যদি Bot-এর মেসেজের রিপ্লাই দেওয়া হয় → তাহলে SIM API চালাবে (নিচে চেক করা হয়েছে)
    if (message.reply_message && message.reply_message.senderID === global.botID) {
      // এটা রিপ্লাই → SIM API তে যাবে (নিচে হবে)
    } else {
      // প্রথমবার ডাকা হচ্ছে → র‍্যান্ডম মেসেজ
      const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
      const filtered = data.filter(msg => typeof msg === "string" && !msg.startsWith("http"));
      const random = filtered[Math.floor(Math.random() * filtered.length)];
      return replyWithMention(random);
    }
  }

  // ২. Bot-এর মেসেজের রিপ্লাই দিলে → SIM API
  let askText = inputText;

  if (message.reply_message && message.reply_message.senderID === global.botID) {
    askText = message.body.trim() || "হুম বলো";
  }

  // যদি কোনো টেক্সট থাকে তাহলে SIM API চালাবে
  if (askText) {
    try {
      const res = await axios.get(SIM_API_URL, {
        params: { type: "ask", ask: askText }
      });

      if (res.data?.data?.msg) {
        return replyWithMention(res.data.data.msg);
      } else {
        return replyWithMention("একটু ভেবে বলছি... 😅");
      }
    } catch (err) {
      console.error("SIM API Error:", err.message);
      return replyWithMention("⚠️ সার্ভারে সমস্যা, পরে বলো 🥲");
    }
  }

  // ফলব্যাক
  return replyWithMention("কিছু বলো না কেন? 😊");
}

export default {
  config,
  onCall
};
