import puppeteer from 'puppeteer'
import inquirer from 'inquirer'
import fs from 'fs'

inquirer
    .prompt([
        {
            name: "link",
            type: "input",
            message: "Youtube Link:",
        },
    ])
    .then(data => {
        var link = data.link;
        (async () => {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(link, {
                waitUntil: 'networkidle0',
            });
            var disabledStatus = await page.evaluate(
                `document.querySelector('button[class="ytp-subtitles-button ytp-button"]').getAttribute("title")`
            )
            if (disabledStatus == "Subtitles/closed captions unavailable") {
                console.log("Auto-generated captions have been disabled by the owner.")
            } else {
                await page.waitForSelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
                await page.$eval('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]', e => e.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"));
                await page.waitForSelector('yt-formatted-string[class="segment-text style-scope ytd-transcript-segment-renderer"]');
                var captionArray = await page.evaluate(() => {
                    var pc = [];
                    transcriptEls = document.querySelectorAll('yt-formatted-string[class="segment-text style-scope ytd-transcript-segment-renderer"]')
                    transcriptEls.forEach(element => {
                        pc.push(element.textContent)
                    });
                    return pc;
                });
                var file = fs.createWriteStream('transcript.txt');
                file.on('error', function (err) { /* error handling */ });
                captionArray.forEach(function (i) { file.write(i + '\n'); });
                file.end();
                console.log("Success!")
            }
            await browser.close();
        })();
    });