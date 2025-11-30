import axios from "axios";
import fs from "fs-extra";
import path from "path";

const langData = {
    "en_US": {
        "downloading": "⏳ Downloading...",
        "done": "✅ Download complete!",
        "error": "❌ Could not download video."
    }
};

async function baseApiUrl() {
    try {
        const base = await axios.get(
            "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json"
        );
        return base.data.api;
    } catch {
        return null;
    }
}

export default {
    config: {
        name: "alldlAuto",
        eventType: ["message"],
        langData
    },

    onMessage: async function ({ message, getLang }) {
        const text = message.body;
        if (!text) return;
        if (!text.startsWith("http")) return;

        message.react("⏳");

        try {
            const apiBase = await baseApiUrl();
            if (!apiBase) throw new Error("API offline");

            const res = await axios.get(
                `${apiBase}/alldl?url=${encodeURIComponent(text)}`
            );

            const video = res.data?.result;
            if (!video) throw new Error("Invalid result");

            const cacheDir = path.join(process.cwd(), "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const filePath = path.join(cacheDir, "auto_dl.mp4");

            const file = (
                await axios.get(video, { responseType: "arraybuffer" })
            ).data;

            fs.writeFileSync(filePath, Buffer.from(file));

            message.react("✅");

            await message.reply({
                body: getLang("done"),
                attachment: fs.createReadStream(filePath)
            });

            fs.unlinkSync(filePath);

        } catch (e) {
            message.react("❌");
            message.reply(getLang("error") + "\n" + e.message);
        }
    }
};
