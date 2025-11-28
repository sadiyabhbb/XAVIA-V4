import speakeasy from 'speakeasy';

const config = {
  name: "2fa",
  description: "Generate 2FA code for using secret code.",
  usage: "/2fa <secret>",
  cooldown: 3,
  author: "LIKHON AHMED",
  permissions: [0],
  credits: "LIKHONAHMED009"
};

export async function onCall({ message, args }) {
  if (args.length < 1) {
    return message.reply("❌ use /2fa <secret>");
  }

  // 1. Join args (remove spaces), normalize to base32 format
  const secret = args.join('').replace(/[^A-Z2-7]/gi, '').toUpperCase();

  // 2. Get current time in seconds, rounded to nearest 30-second window
  const currentTime = Math.floor(Date.now() / 1000);

  try {
    // 3. Generate token (with step=30s, encoding base32, 6-digit)
    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      digits: 6,
      step: 30,
      time: currentTime
    });

    return message.reply(` ${token}`);
  } catch (e) {
    return message.reply("❌ worng code:\n" + e.message);
  }
}

export default {
  config,
  onCall
};
