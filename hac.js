const config = require('./config.json');
const fetch = require('node-fetch');

//run the main function every day at set SERVER_UTC time
//this is to ensure that the daily reward is claimed at the same time every day

startUp();

function startUp() {
    //Just in case try the main loop once at start up
    main();

    //Schedule the main loop to run every day
    scheduleDailyClaim();
}

function scheduleDailyClaim() {
    // Calculate a random minute within the first hour (0-59)
    const randomMinute = Math.floor(Math.random() * 60);

    // Calculate the milliseconds until the next day
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, randomMinute, 0, 0);

    // Calculate the delay in milliseconds until the next run
    const delay = tomorrow - now;

    console.log(`Next run: ${tomorrow.toLocaleString()}`);
    console.log(`Current time: ${now.toLocaleString()}`);
    console.log('Timezone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone);


    // Schedule the next run
    setTimeout(() => {
        main();
        // Re-run this function at the next natural interval
        scheduleDailyClaim();
    }, delay);
}


async function main() {
    var COOKIES = config.COOKIES;
    for (var i = 0; i < COOKIES.length; i++) {
        try {
            var cookie_owner_name = String(COOKIES[i].name);
            var cookie_owner_value = String(COOKIES[i].cookie);

            var claimResultNumber = await claimDailyReward(cookie_owner_value);
            //claimResultNumber can have 3 values: 0, 1, 2
            //-1: claim failed (no apparent reason)
            // 0: already claimed
            // 1: claim success 

            switch (claimResultNumber) {
                case 0:
                    console.log(cookie_owner_name + " has already claimed the reward for today");
                    break;
                case 1:
                    console.log(cookie_owner_name + " claim success");
                    break;
                case -1:
                    console.log(cookie_owner_name + " claim failed");
                    break;
                default:
                    console.log(cookie_owner_name + " claim failed");
                    break;
            }

        } catch (error) {
            console.log(error);
        }
    }
}

async function claimDailyReward(cookie) {
    var alreadyClaimed = await alreadyClaimedDaily(cookie);
    if (alreadyClaimed == -1) {
        console.log("cookie or account seems to be invalid");
        return -1;
    } else if (alreadyClaimed) {
        return 0;
    }

    const dailyRewardURL = "https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=" + config.ACT_ID;
    const dailyRewardHeaders = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Content-Length': '29',
        'Content-Type': 'application/json;charset=UTF-8',
        'Cookie': cookie,
        'Origin': 'https://act.hoyolab.com',
        'Referer': 'https://act.hoyolab.com/',
        'Sec-Ch-Ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Opera GX";v="102"',
        'Sec-Ch-Ua-Mobile': '?0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 OPR/102.0.0.0S'
    }


    const response = await fetch(dailyRewardURL, { headers: dailyRewardHeaders, method: 'POST' });
    const responseData = await response.json();

    if (responseData.message == "OK") {
        console.log("claim success");
        return 1;
    }
    else {
        console.log("claim failed with message: " + responseData.message);
        return -1;
    }
}

async function alreadyClaimedDaily(cookie) {
    try {

        const dailyRewardURL = "https://sg-hk4e-api.hoyolab.com/event/sol/resign_info?act_id=" + config.ACT_ID;
        const dailyRewardHeaders = {
            'Cookie': cookie
        }

        const response = await fetch(dailyRewardURL, { headers: dailyRewardHeaders });
        const responseData = await response.json();
        console.log("already claimed: " + responseData.data.signed);

        return responseData.data.signed;
    } catch (error) {
        console.log(error);
        return -1;
    }
}

async function claimMakeUpMissions(cookie) {
    const makeUpMissionsURL = "https://sg-hk4e-api.hoyolab.com/event/sol/task/award?lang=en-us";
    const myHeaders = {
        'Cookie': cookie,
        'Content-Type': 'application/json;charset=UTF-8'
    }

    for (var i = 1; i <= 3; i++) {

        var raw = JSON.stringify({
            "act_id": "e202102251931481",
            "lang": "en-us",
            "id": i
        });

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow',
            waitUntil: 'networkidle0'
        };

        await fetch(makeUpMissionsURL, requestOptions)
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.log('error', error));
    }
}