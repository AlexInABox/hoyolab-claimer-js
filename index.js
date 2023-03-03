const fs = require("fs");
const path = require("path");
const axios = require("axios");
var config = require("./config.json");
var cookie;


const VER = "0.1.4";
const UPDATE_CHANNEL = "https://github.com/alexinabox/hoyolab-claimer-js/releases/latest";

// SETUP LOGGING
const logFilePath = path.join('./botlog.txt');
const log = fs.createWriteStream(logFilePath, { flags: 'a+' });

// SETUP CONFIG
const config_params = [
    "COOKIE",
    "SERVER_UTC",
    "DELAY_MINUTE",
    "RANDOMIZE",
    "RANDOM_RANGE",
    "ACT_ID",
    "DOMAIN_NAME",
];

async function checkConfig() {

    try {
        config = JSON.parse(fs.readFileSync(path.join("./config.json"), "utf8"));
        config_params.forEach((param) => {
            if (!(param in config)) {
                throw new Error(`ERROR: Broken config file, ${param} not found`);
            }
        });
    } catch (e) {
        console.log(e);
        console.log("Config not found/corrupted! Making default config...");
        config = {
            COOKIE: [],
            SERVER_UTC: 8,
            DELAY_MINUTE: 0,
            RANDOMIZE: false,
            RANDOM_RANGE: 3600,
            ACT_ID: "e202102251931481",
            DOMAIN_NAME: ".mihoyo.com"
        };
        config_file = fs.createWriteStream(path.join("./config.json"), { flags: "w" });
        await config_file.write(JSON.stringify(config, null, 4));
        config_file.close();
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    return;
}
// END SETUP CONFIG 

// GET COOKIE
function getCookie() {
    cookie = config.COOKIE;
    if (cookie == "") {
        console.log("ERROR: Cookie not found! Please fill in your cookie in config.json");
        process.exit(1);
    }
}
// END GET COOKIE

// API CALLS
function getDailyStatus(cookie) {
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Origin': 'https://webstatic-sea.mihoyo.com',
        'Connection': 'keep-alive',
        'Referer': `https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=${config.ACT_ID}&lang=en-us`,
        'Cache-Control': 'max-age=0',
        'Cookie': cookie
    }

    const params = {
        lang: 'en-us',
        act_id: config.ACT_ID
    }

    return axios.get('https://hk4e-api-os.mihoyo.com/event/sol/info', { headers, params })
        .then(response => response.data)
        .catch(error => {
            console.log('CONNECTION ERROR: cannot get daily check-in status');
            console.log(error);
            log.write('CONNECTION ERROR: cannot get daily check-in status\n');
            log.write(error + '\n');
            return null;
        });
}

async function isClaimed(cookie) {
    try {
        return getDailyStatus(cookie)
            .then(resp => resp ? resp.data.is_sign : null);
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

function claimReward(cookie) {
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'application/json;charset=utf-8',
        'Origin': 'https://webstatic-sea.mihoyo.com',
        'Connection': 'keep-alive',
        'Referer': `https://webstatic-sea.mihoyo.com/ys/event/signin-sea/index.html?act_id=${config.ACT_ID}&lang=en-us`,
        'Cookie': cookie
    }

    const params = {
        lang: 'en-us'
    }

    const data = {
        act_id: config.ACT_ID
    }

    return axios.post('https://hk4e-api-os.mihoyo.com/event/sol/sign', data, { headers, params })
        .then(response => response.data)
        .catch(error => {
            console.log('CONNECTION ERROR: cannot claim daily check-in reward');
            console.log(error);
            log.write('CONNECTION ERROR: cannot claim daily check-in reward\n');
            log.write(error + '\n');
            return null;
        });
}
// END API CALLS


// MAIN
async function main() {
    console.log(`Hoyolab Daily Claimer v${VER}`);
    console.log(`Checking for updates...`);

    await axios.get(UPDATE_CHANNEL)
        .then(response => {
            const latest = response.request.res.responseUrl;
            const latest_ver = latest.split('/').pop();
            if (latest_ver != VER) {
                console.log(`New version available: ${latest_ver}`);
                console.log(`Please update at: ${latest}`);
            } else {
                console.log(`You are up to date!`);
            }
        })
        .catch(error => {
            console.log(`ERROR: Failed to check for updates`);
            console.log(error);
        });

    getCookie();


    for (let i = 0; i < cookie.length; i++) {
        isClaimed(cookie[i])
            .then(resp => {
                if (resp) {
                    console.log('Aleady claimed reward for account ' + (i + 1) + ' today!');
                    log.write('Already claimed reward for account ' + (i + 1) + 'today!\n');
                    sendWebhookFail(i);
                    return;
                } else {
                    claimReward(cookie[i])
                        .then(resp => {
                            if (resp.retcode == 0) {
                                console.log('Successfully claimed reward!');
                                log.write('Successfully claimed reward!\n');
                                sendWebhookSuccess(i);
                                return;
                            } else {
                                console.log('ERROR: Failed to claim reward!');
                                log.write('ERROR: Failed to claim reward!\n');
                                sendWebhookFail(i);
                                return;
                            }
                        });
                }
            });
    }

}

//Discord Webhook event announcer

async function sendWebhookSuccess(i) {
    fetch(config.WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "content": null,
            "embeds": [
                {
                    "title": "Hoyolab Daily Claimer",
                    "description": "Daily check-in reward claimed for account " + (i + 1) + "!",
                    "color": 1158948,
                    "footer": {
                        "text": "Hoyolab Daily Claimer v" + VER + " | AlexInABox"
                    },
                    "timestamp": new Date()
                }
            ],
            "attachments": []
        }),
    });
}


async function sendWebhookFail(i) {
    fetch(config.WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "content": null,
            "embeds": [
                {
                    "title": "Hoyolab Daily Claimer",
                    "description": "Failed to claim daily check-in reward for account " + (i + 1) + "!",
                    "color": 13046547,
                    "footer": {
                        "text": "Hoyolab Daily Claimer v" + VER + " | AlexInABox"
                    },
                    "timestamp": new Date()
                }
            ],
            "attachments": []
        }),
    });
}

// END MAIN
setInterval(main, 30000);
main().catch(console.error);




