import axios from "axios";
import fs from "fs";
import { resolve } from "path";

// Je website gular link dile auto download hobe
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
    const { senderID, body, reply } = message;

    // Bot nijer message e reply dibe na
    if (senderID == global.botID) return;
    if (!body) return;

    // Message theke link khuje ber kora
    const match = body.match(urlRegex);
    if (!match) return; 

    const url = match[0];

    // Check kora link ta supported kina
    const isSupported = supportedDomains.some(domain => url.includes(domain));
    if (!isSupported) return; 

    try {
        // Tomar dewa API Call
        const apiUrl = `https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`;
        
        const res = await axios.get(apiUrl);
        const data = res.data;

        // API response theke video link ber kora
        // Nayan API usually 'data' object er vitore 'high' ba 'low' link dey
        const videoUrl = data.data?.high || data.data?.low || data.url || data.video;
        const title = data.data?.title || "Auto Downloader";

        if (!videoUrl) return; 

        // Video download er path set kora
        const path = resolve(process.cwd(), "core", "var", "cache", `autodl_${Date.now()}.mp4`);
        
        // Video stream download start
        const videoStream = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(path);
        videoStream.data.pipe(writer);

        writer.on('finish', () => {
            // Video send kora
            reply({
                body: `✅ ${title}`,
                attachment: fs.createReadStream(path)
            }, () => {
                // Send hoar por file delete kore dibe storage bachate
                if (fs.existsSync(path)) fs.unlinkSync(path);
            });
        });

        writer.on('error', (err) => {
            console.error("[AutoDL] Stream Error:", err);
        });

    } catch (e) {
        // Kono error hole console e dekhabe, user ke disturb korbe na
        console.error("[AutoDL] API Error:", e.message);
    }
}

export default {
    onCall
};
