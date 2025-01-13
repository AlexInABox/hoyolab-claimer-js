const fetch = require('node-fetch');
const config = require('./config.json');

async function main(redemptionCode) {
    const COOKIES = config.COOKIES;
    for (let i = 0; i < COOKIES.length; i++) {
        try {
            const cookie_owner_name = String(COOKIES[i].name);
            const cookie_owner_value = String(COOKIES[i].cookie);
            const cookie_owner_uid = String(COOKIES[i].uid);
            const cookie_owner_region = String(COOKIES[i].region);

            const claimResultNumber = await claimRedemptionCode(cookie_owner_value, cookie_owner_uid, cookie_owner_region, redemptionCode);
            // claimResultNumber can have 3 values: 0, 1, -1
            switch (claimResultNumber) {
                case 0:
                    console.log(`${cookie_owner_name} has already claimed the reward for today`);
                    break;
                case 1:
                    console.log(`${cookie_owner_name} claim success`);
                    break;
                case -1:
                    console.log(`${cookie_owner_name} claim failed`);
                    break;
                default:
                    console.log(`${cookie_owner_name} claim failed`);
                    break;
            }
        } catch (error) {
            console.log(error);
        }
        await sleep(5000);
    }
}

async function claimRedemptionCode(cookie, uid, region, redemptionCode) {
    const maxRetries = 5;
    const redemptionUrl = `https://public-operation-hk4e.hoyoverse.com/common/apicdkey/api/webExchangeCdkey?uid=${uid}&region=${region}&lang=en&cdkey=${redemptionCode}&game_biz=hk4e_global&sLangKey=en-us`;
    const redemptionHeaders = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': cookie,
        'Origin': 'https://genshin.hoyoverse.com',
        'Referer': 'https://genshin.hoyoverse.com',
        'Sec-Ch-Ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Opera GX";v="102"',
        'Sec-Ch-Ua-Mobile': '?0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to redeem code...`);
            console.log(redemptionUrl);

            const response = await fetch(redemptionUrl, { headers: redemptionHeaders, method: 'GET' });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.message === "OK") {
                console.log("Redemption success.");
                return 1;
            } else if (responseData.message === "Already Claimed") {
                console.log("Redemption code already claimed.");
                return 0;
            } else {
                console.log(`Redemption failed with message: ${responseData.message}`);
                return -1;
            }
        } catch (error) {
            console.log(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === maxRetries) {
                console.error("Max retries reached. Returning failure...");
                return -1;
            }
            // Wait before retrying (optional)
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Export the main function
module.exports = { main };