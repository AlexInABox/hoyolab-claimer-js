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
    const redemptionUrl = `https://public-operation-hk4e.hoyoverse.com/common/apicdkey/api/webExchangeCdkey?uid=${uid}&region=${region}&lang=en&cdkey=${redemptionCode}&game_biz=hk4e_global&sLangKey=en-us`;
    console.log(redemptionUrl);
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

    try {
        const response = await fetch(redemptionUrl, { headers: redemptionHeaders, method: 'GET' });
        const responseData = await response.json();

        if (responseData.message === "OK") {
            console.log("redemption success");
            return 1;
        } else if (responseData.message === "Already Claimed") {
            return 0;
        } else {
            console.log(`redemption failed with message: ${responseData.message}`);
            return -1;
        }
    } catch (error) {
        console.error(`Error while redeeming: ${error.message}`);
        return -1;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Export the main function
module.exports = { main };