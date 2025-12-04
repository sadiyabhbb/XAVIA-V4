import axios from 'axios';

const config = {
  name: 'imgur',
  version: '2.0.0',
  permissions: 0,
  credits: 'ArYAN',
  description: 'Upload image to Imgur using Aryan API',
  commandCategory: 'image',
  nixprefix: true,
  usages: 'reply to image',
  cooldown: 5
};

const langData = {
  "en_US": {
    "notAReply": "❌ Please reply to the image you want to upload.",
    "notAPhoto": "❌ The replied message is not a photo.",
    "processingError": "❌ Could not process the image.",
    "executionError": "❌ An error occurred while executing.",
    "success": "✅ Imgur Link:"
  }
};

async function onCall({ message, getLang }) {
  if (!message.messageReply || !message.messageReply.attachments?.length) {
    return message.reply(getLang("notAReply"));
  }

  const attachment = message.messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return message.reply(getLang("notAPhoto"));
  }

  try {
    const imageUrl = attachment.url;
    const apiUrl = `https://aryan-nix-apis.vercel.app/api/imgur?url=${encodeURIComponent(imageUrl)}`;

    const response = await axios.get(apiUrl);
    const resultUrl = response.data?.imgur;

    if (!resultUrl) {
      return message.reply(getLang("processingError"));
    }

    return message.reply(`${getLang("success")} ${resultUrl}`);
  } catch (error) {
    console.error("IMGUR CMD ERROR:", error);
    return message.reply(getLang("executionError"));
  }
}

export default {
  config,
  langData,
  onCall
};
