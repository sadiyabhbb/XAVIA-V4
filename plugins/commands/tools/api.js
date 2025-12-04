import axios from "axios";

const config = {
  name: "api",
  aliases: ["testapi", "apitest"],
  description: "Test API endpoints with GET method",
  usage: "[API_URL]",
  cooldown: 5,
  permissions: [2],
  nixprefix: true,
  credits: "ArYAN",
};

async function onCall({ message, args }) {
  const apiUrl = args[0];

  if (!apiUrl) {
    return message.reply("Please provide an API URL");
  }

  try {
    const response = await axios.get(apiUrl, { 
      responseType: 'stream',
      headers: {
        'Accept': '*/*'
      }
    });

    if (response.headers['content-type']?.includes('application/json')) {
      let data = '';
      response.data.on('data', chunk => data += chunk);
      response.data.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          message.reply(JSON.stringify(jsonData, null, 2));
        } catch (e) {
          message.reply(data);
        }
      });
    } else {
      await message.reply({
        attachment: response.data
      });
    }
  } catch (error) {
    console.error(error);
    message.reply(`Error: ${error.message}`);
  }
}

export default {
  config,
  onCall
};
