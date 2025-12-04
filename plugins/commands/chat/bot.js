import axios from "axios";
import fs from "fs";

const config = {
  name: "bot",
  description: "Auto chat with loop using SIM API",
  usage: "bot hi | bot <message>",
  cooldown: 3,
  permissions: [0],
  nixprefix: true,
  credits: "LIKHON AHMED"
};

const LOCAL_CACHE = "./cache/teach.json";
const SIM_API_URL = "http://65.109.80.126:20392/sim";

function ensureCache() {
  const defaultData = [
    "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ",
    "কি গো সোনা আমাকে ডাকছ কেনো",
    "বার বার আমাকে ডাকস কেন",
    "আহ শোনা আমার আমাকে এতো ডাক্তাছো কেনো আসো বুকে আশো",
    "হুম জান তোমার অইখানে উম্মমাহ",
    "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি",
    "আমাকে এতো না ডেকে বস নয়নকে একটা গফ দে",
    "jang hanga korba",
    "jang bal falaba"
  ];

  if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");
  if (!fs.existsSync(LOCAL_CACHE)) {
    fs.writeFileSync(LOCAL_CACHE, JSON.stringify(defaultData, null, 2));
  }
}

export async function onCall({ message, args }) {
  ensureCache();

  const input = args.join(" ").trim();
  const botID = global.botID?.toString(); // স্ট্রিং করে নিচ্ছি

  // Full Name
  let name = "User";
  if (message.senderName) name = message.senderName;
  else {
    try {
      const info = await global.api.getUserInfo(message.senderID);
      name = info[message.senderID]?.name || "User";
    } catch {}
  }

  const send = (text) => message.reply({
    body: `( {\( {name}, ) \){text}`,
    mentions: [{ tag: name, id: message.senderID }]
  });

  // র‍্যান্ডম মেসেজ ফাংশন
  const randomReply = () => {
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE, "utf-8"));
    const clean = data.filter(m => typeof m === "string" && !m.startsWith("http"));
    const msg = clean[Math.floor(Math.random() * clean.length)];
    return send(msg);
  };

  // ১. Bot কে ট্যাগ করা হয়েছে কিনা?
  const taggedBot = message.mentions && Object.keys(message.mentions).some(id => id === botID);

  // ২. Bot-এর মেসেজের রিপ্লাই দেওয়া হয়েছে কিনা? (মূল ফিক্স)
  const isReplyToBot = message.reply_message && 
                       message.reply_message.senderID?.toString() === botID;

  // প্রথমবার ডাকলে (bot / hi / ট্যাগ / খালি) → র‍্যান্ডম
  if ((taggedBot || input === "" || input.toLowerCase() === "hi" || input.startsWith("bot")) && !isReplyToBot) {
    return randomReply();
  }

  // রিপ্লাই দিলে বা কথা বললে → SIM API
  if (isReplyToBot || taggedBot || input) {
    let ask = input;

    // শুধু রিপ্লাই দিলে কিছু না লিখলে
    if (isReplyToBot && (!message.body || message.body.trim() === "")) {
      ask = "হুম বলো";
    }

    try {
      const { data } = await axios.get(SIM_API_URL, {
        params: { type: "ask", ask: ask || "হাই" },
        timeout: 10000
      });

      if (data?.data?.msg) {
        return send(data.data.msg);
      }
    } catch (e) {
      console.log("SIM API Error:", e.message);
      return send("একটু পরে বলিস, সার্ভার ঘুমাচ্ছে");
    }
  }

  return randomReply(); // ফাইনাল ফলব্যাক
}

export default { config, onCall };
