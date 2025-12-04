import axios from "axios";

const config = {
  name: "drive",
  _name: {
    "ar_SY": "رفع"
  },
  aliases: ["gdrive", "upload"],
  version: "1.0.1",
  description: "Upload media or files to Google Drive",
  usage: "[link] or reply to media/file",
  credits: "ArYAN",
  permissions: 0,
  nixprefix: true,
  cooldown: 5,
  category: "Utility"
};

const langData = {
  "en_US": {
    "drive.noInput": "Please provide a valid file URL or reply to a message containing a file or image.",
    "drive.uploading": "⏳ Uploading your file to Google Drive...",
    "drive.success": "✅ File uploaded to Google Drive!\n\n🔗 URL: {link}",
    "drive.failed": "❌ Upload failed: {error}",
    "drive.error": "An error occurred during upload. Please try again later."
  },
  "vi_VN": {
    "drive.noInput": "Vui lòng cung cấp URL hợp lệ hoặc trả lời tin nhắn chứa tệp hoặc hình ảnh.",
    "drive.uploading": "⏳ Đang tải lên Google Drive...",
    "drive.success": "✅ Tải tệp lên Google Drive thành công!\n\n🔗 Liên kết: {link}",
    "drive.failed": "❌ Tải lên thất bại: {error}",
    "drive.error": "Đã xảy ra lỗi khi tải lên. Vui lòng thử lại sau."
  },
  "ar_SY": {
    "drive.noInput": "يرجى تقديم رابط صالح أو الرد على رسالة تحتوي على ملف أو صورة.",
    "drive.uploading": "⏳ جارٍ رفع الملف إلى Google Drive...",
    "drive.success": "✅ تم رفع الملف إلى Google Drive!\n\n🔗 الرابط: {link}",
    "drive.failed": "❌ فشل الرفع: {error}",
    "drive.error": "حدث خطأ أثناء الرفع. حاول مرة أخرى لاحقاً."
  }
};

async function onCall({ message, args, getLang }) {
  let inputUrl = args[0];

  // Get file URL from replied message (Xavia-style)
  if (!inputUrl && message.messageReply?.attachments?.length > 0) {
    const file = message.messageReply.attachments[0];

    if (["photo", "video", "file"].includes(file.type) && file.url) {
      inputUrl = file.url;
    }
  }

  if (!inputUrl) {
    return message.reply(getLang("drive.noInput"));
  }

  const uploading = await message.reply(getLang("drive.uploading"));

  try {
    const apiKey = "ArYAN";
    const api = `https://aryan-xyz-google-drive.vercel.app/drive?url=${encodeURIComponent(inputUrl)}&apikey=${apiKey}`;

    const res = await axios.get(api);
    const data = res.data;

    const driveLink = data.driveLink || data.driveLIink;

    if (driveLink) {
      return message.reply(getLang("drive.success", { link: driveLink }));
    } else {
      const error = data.error || data.message || JSON.stringify(data);
      return message.reply(getLang("drive.failed", { error }));
    }
  } catch (err) {
    console.error("Upload Error:", err);
    return message.reply(getLang("drive.error"));
  } finally {
    // Optional: delete loading message if system supports it
    // await message.unsendMessage(uploading.messageID).catch(() => {});
  }
}

export default {
  config,
  langData,
  onCall
};
