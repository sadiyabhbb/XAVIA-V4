import axios from "axios";
import fs from "fs";
import { resolve } from "path";

const supportedDomains = [
    "facebook.com", 
    "fb.watch", 
    "tiktok.com", 
    "instagram.com", 
    "youtu.be", 
    "youtube.com", 
    "twitter.com",
    "x.com",
    "capcut.com"
];

const urlRegex = /(https?:\/\/[^\s]+)/g;

async function onCall({ message }) {
    const { senderID, body, reply, react } = message;

    if (senderID == global.botID) return;
    if (!body) return;

    const match = body.match(urlRegex);
    if (!match) return; 

    const url = match[0];
    const isSupported = supportedDomains.some(domain => url.includes(domain));
    if (!isSupported) return; 

    try {

        // ⭐ Start downloading reaction
        try { react("⏳"); } catch {}

        const apiUrl = `https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`;
        
        const res = await axios.get(apiUrl);
        const data = res.data;

        const videoUrl = data.data?.high || data.data?.low || data.url || data.video;
        const title = data.data?.title || "Auto Downloader";

        if (!videoUrl) return; 

        const cacheDir = resolve(process.cwd(), "core", "var", "cache");
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const path = resolve(cacheDir, `autodl_${Date.now()}.mp4`);
        
        const videoStream = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(path);
        videoStream.data.pipe(writer);

        writer.on('finish', async () => {

            // ⭐ Send video (callback আর ব্যবহার করছিনা)
            const sent = await reply({
                body: `✅ ${title}`,
                attachment: fs.createReadStream(path)
            });

            // ⭐ Now react on that sent message
            try { 
                react("✅", sent.messageID);
            } catch (e) {
                console.log("React error:", e);
            }

            if (fs.existsSync(path)) fs.unlinkSync(path);
        });

        writer.on('error', (err) => {
            console.error("[AutoDL] Stream Error:", err);
        });

    } catch (e) {
        console.error("[AutoDL] API Error:", e.message);
    }
}

export default {
    onCall
};
