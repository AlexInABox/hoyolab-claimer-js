const { Client, GatewayIntentBits } = require('discord.js');
const { main } = require('./redemptionCode'); // Assuming redeem.js is in the same directory
const config = require('./config.json');

// Replace with your Discord bot token and channel ID
const BOT_TOKEN = config.BOT_TOKEN;
const CHANNEL_ID = config.CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.channel.id === CHANNEL_ID) {
        // Use regex to find all codes (i.e., all occurrences of code=xxxx)
        const codeRegex = /code=([A-Za-z0-9]+)/g; // "g" flag for global search
        let match;

        // Array to store all matched codes
        const redemptionCodes = [];

        // Find all matches in the message
        while ((match = codeRegex.exec(message.content)) !== null) {
            redemptionCodes.push(match[1]); // Push the matched code into the array
        }

        // If codes are found, process each code
        if (redemptionCodes.length > 0) {
            console.log(`Found redemption codes: ${redemptionCodes.join(', ')}`);
            for (let redemptionCode of redemptionCodes) {
                try {
                    await main(redemptionCode);
                } catch (error) {
                    console.error(`Error processing redemption code ${redemptionCode}: ${error.message}`);
                }
            }
        } else {
            console.log('No valid redemption codes found in the message');
        }
    }
});

async function startBot() {
    try {
        await client.login(BOT_TOKEN);
    } catch (error) {
        console.error('Bot login failed:', error);
        // Restart the bot after failure
        setTimeout(startBot, 5000); // Restart the bot after 5 seconds
    }
}

// Start the bot
startBot();