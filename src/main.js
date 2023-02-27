const puppeteer = require('puppeteer');
const http = require('http');
const Config = require('./config');
const Hypixel = require('./hypixel');
const { formatColor } = require('./util');
const request = require('request');
const fs = require('fs');
const url = require('url');

const log = (text) => console.log(`[${new Date().toLocaleString()}] ${text}`);
const sleep = (time) => new Promise(resolve => setTimeout(() => resolve(), time));

const config = new Config('./config.json', {
    apikey: '',
    port: 23168
});
const port = config.get('port');

const hypixel = new Hypixel(config.get('apikey'));

let browser = null;
(async () => browser = await puppeteer.launch({
    defaultViewport: { width: 800, height: 450 }
}))();

const hyp = async (name) => {
    log(`Fetching player ${name} Hypixel data`);
    await hypixel.download(name);
    if (hypixel.data[name].nick == true)
        return 404;

    log(`Rendering player ${name} Hypixel image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/template/hyp.html`);
    // Add a style tag to the page
    await page.evaluate((nameFormat, uuid, data) => {
        document.body.innerHTML=document.body.innerHTML.replace('${nameFormat}',nameFormat).replace('${uuid}',uuid);
        document.body.innerHTML=data.reduce((p,c,i)=>p.replace(`\${data[${i}]}`,c),document.body.innerHTML);
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, 'ov'));
    await sleep(1000);
    // Take a screenshot
    log(`Saving player ${name} Hypixel image`);
    await page.screenshot({ path: `./src/temp/${name}@hyp.png`, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} Hypixel image generate`);
}

const bw = async (name) => {
    log(`Fetching player ${name} Bedwars data`);
    await hypixel.download(name);
    if (hypixel.data[name].nick == true)
        return 404;

    log(`Rendering player ${name} Bedwars image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/template/bw.html`);
    // Add a style tag to the page
    await page.evaluate((nameFormat, uuid, data) => {
        document.body.innerHTML=document.body.innerHTML.replace('${nameFormat}',nameFormat).replace('${uuid}',uuid);
        document.body.innerHTML=data.reduce((p,c,i)=>p.replace(`\${data[${i}]}`,c),document.body.innerHTML);
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, 'bw'));
    await sleep(1000);
    // Take a screenshot
    log(`Saving player ${name} Bedwars image`);
    await page.screenshot({ path: `./src/temp/${name}@bw.png`, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} Bedwars image generate`);
}

const sw = async (name) => {
    log(`Fetching player ${name} SkyWar data`);
    await hypixel.download(name);
    if (hypixel.data[name].nick == true)
        return 404;

    log(`Rendering player ${name} SkyWar image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/template/sw.html`);
    // Add a style tag to the page
    await page.evaluate((nameFormat, uuid, data) => {
        document.body.innerHTML=document.body.innerHTML.replace('${nameFormat}',nameFormat).replace('${uuid}',uuid);
        document.body.innerHTML=data.reduce((p,c,i)=>p.replace(`\${data[${i}]}`,c),document.body.innerHTML);
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, 'sw'));
    await sleep(1000);
    // Take a screenshot
    log(`Saving player ${name} SkyWar image`);
    await page.screenshot({ path: `./src/temp/${name}@sw.png`, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} SkyWar image generate`);
}

const mm = async (name) => {
    log(`Fetching player ${name} MurderMystery data`);
    await hypixel.download(name);
    if (hypixel.data[name].nick == true)
        return 404;

    log(`Rendering player ${name} MurderMystery image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/template/sw.html`);
    // Add a style tag to the page
    await page.evaluate((nameFormat, uuid, data) => {
        document.body.innerHTML=document.body.innerHTML.replace('${nameFormat}',nameFormat).replace('${uuid}',uuid);
        document.body.innerHTML=data.reduce((p,c,i)=>p.replace(`\${data[${i}]}`,c),document.body.innerHTML);
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, 'sw'));
    await sleep(1000);
    // Take a screenshot
    log(`Saving player ${name} MurderMystery image`);
    await page.screenshot({ path: `./src/temp/${name}@sw.png`, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} MurderMystery image generate`);
}


const server = http.createServer(async (req, res) => {
    if (request.url == '/favicon.ico') return;
    log(`${req.socket.remoteAddress}:${req.socket.remotePort}-> GET ${req.url}`);
    let data = url.parse(req.url, true);
    let path = data.pathname;
    let params = data.query;
    let name = params.name;
    if (path == '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`200 OK`);
        return;
    }
    if (name == null) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing field');
        return;
    }
    if (path == '/hyp') {
        let r = await hyp(name);
        if (r == 404) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`${__dirname}/temp/${name}@hyp.png`);
        }
    }
    if (path == '/bw') {
        let r = await bw(name);
        if (r == 404) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`${__dirname}/temp/${name}@bw.png`);
        }
    }
    if (path == '/sw') {
        let r = await sw(name);
        if (r == 404) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`${__dirname}/temp/${name}@sw.png`);
        }
    }
});

server.on('listening', () => log(`Server running on 127.0.0.1:${port}`));
server.listen(port);

log(`Starting Hypixel img backend server`);