import axios from "axios";
import fs from "fs-extra";
import path from "path";

const config = {
    name: "alldl",
    aliases: ["ad", "download"],
    description: "Download video from TikTok, Facebook, Instagram, YouTube and more.",
    usage: "[video_link]",
    cooldown: 3,
    permissions: [0],
    credits: "Dipto",
    nixprefix: true,
    vip: false
};

const langData = {
    "en_US": {
        "missingUrl": "Please provide a valid link or reply with a link.",
        "downloading": "⏳ Downloading your video...",
        "success": "✅ Download complete!",
        "error": "❌ Failed to download video.",
        "imgurDone": "✅ | Downloaded Imgur image!"
    }
};

async function onCall({ message, args, getLang }) {
    const { messageReply } = message;

    let url = args[0] || messageReply?.body;
    if (!url) return message.reply(getLang("missingUrl"));

    message.react("⏳");

    try {
        // NEW FIXED API
        const apiUrl = `https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`;

        const { data } = await axios.get(apiUrl);

        const videoUrl = data?.result;
        if (!videoUrl) throw new Error("Invalid download URL.");

        const cacheDir = path.join(process.cwd(), "cache");
        const filePath = path.join(cacheDir, "alldl_vid.mp4");

        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        const videoData = (
            await axios.get(videoUrl, { responseType: "arraybuffer" })
        ).data;

        fs.writeFileSync(filePath, Buffer.from(videoData));

        let short = videoUrl;
        try {
            short = await global.utils.shortenURL(videoUrl);
        } catch {}

        message.react("✅");

        await message.reply({
            body: `${getLang("success")}\n🔗 Link: ${short}`,
            attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);

        // imgur image handling
        if (url.startsWith("https://i.imgur.com")) {
            const ext = url.substring(url.lastIndexOf("."));
            const imgName = path.join(cacheDir, `imgur${ext}`);

            const imgData = await axios.get(url, {
                responseType: "arraybuffer"
            });

            fs.writeFileSync(imgName, Buffer.from(imgData.data));

            await message.reply({
                body: getLang("imgurDone"),
                attachment: fs.createReadStream(imgName)
            });

            fs.unlinkSync(imgName);
        }

    } catch (error) {
        console.log(error);
        message.react("❌");
        return message.reply(getLang("error") + "\n\n" + error.message);
    }
}

export default {
    config,
    langData,
    onCall
};
