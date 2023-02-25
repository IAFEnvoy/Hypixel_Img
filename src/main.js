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
    log(`Fetching player ${name} hypixel data`);
    await hypixel.download(name);
    if (hypixel.data[name].nick == true)
        return 404;

    log(`Rendering player ${name} image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/index.html`);
    // Add a style tag to the page
    await page.addStyleTag({ content: 'body { background: url("./img/ov1.png"); }' });
    await page.evaluate((nameFormat, uuid, data) => {
        document.body.innerHTML = `<div style="font-size:25px;font-family:Minecraftia;position:absolute;left:30px;top:20px">${nameFormat}</div>
            <img src="https://crafatar.com/renders/body/${uuid}?overlay" style="position:absolute;left:40px;top:80px">
            <div style="position:absolute;left:200px;top:70px;width:590px;height:360px;background-color:rgba(0,0,0,0.5);border-radius:30px;font-weight:bold"></div>
    
            <div class="text" style="font-size:20px;color:red;left:200px;top:80px;">等级</div>
            <div class="text" style="font-size:20px;color:orange;left:400px;top:80px;">人品</div>
            <div class="text" style="font-size:20px;color:yellow;left:600px;top:80px;">语言</div>
            <div class="text" style="font-size:25px;color:white;left:200px;top:130px;">${data[0]}</div>
            <div class="text" style="font-size:25px;color:white;left:400px;top:130px;">${data[1]}</div>
            <div class="text" style="font-size:25px;color:white;left:600px;top:130px;">${data[2]}</div>
            
            <div class="text" style="font-size:20px;color:greenyellow;left:200px;top:200px;">成就点数</div>
            <div class="text" style="font-size:20px;color:aqua;left:400px;top:200px;">完成任务</div>
            <div class="text" style="font-size:20px;color:blue;left:600px;top:200px;">完成挑战</div>
            <div class="text" style="font-size:25px;color:white;left:200px;top:250px;">${data[3]}</div>
            <div class="text" style="font-size:25px;color:white;left:400px;top:250px;">${data[4]}</div>
            <div class="text" style="font-size:25px;color:white;left:600px;top:250px;">${data[5]}</div>
            
            <div class="text" style="font-size:20px;color:fuchsia;left:200px;top:320px;">Rank赠送</div>
            <div class="text" style="font-size:20px;color:white;left:400px;top:320px;">公会</div>
            <div class="text" style="font-size:25px;color:white;left:200px;top:370px;">${data[6]}</div>
            <div class="text" style="font-size:25px;color:white;left:400px;top:370px;">${data[7]}</div>`;
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, 'ov'));
    await sleep(1000);
    // Take a screenshot
    log(`Saving player ${name} image`);
    await page.screenshot({ path: `./src/temp/${name}_hyp.png`, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} image generate`);
}

const bw = async (name) => {
    log(`Fetching player ${name} bedwars data`);
    await hypixel.download(name);
    if (hypixel.data[name].nick == true)
        return 404;

    log(`Rendering player ${name} bedwars image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/index.html`);
    // Add a style tag to the page
    await page.addStyleTag({ content: 'body { background: url("./img/bw1.png"); }' });
    await page.evaluate((nameFormat, uuid, data) => {
        document.body.innerHTML = `<div style="font-size:25px;font-family:Minecraftia;position:absolute;left:30px;top:20px">${nameFormat}</div>
            <img src="https://crafatar.com/renders/body/${uuid}?overlay" style="position:absolute;left:40px;top:80px">
            <div style="position:absolute;left:200px;top:70px;width:590px;height:360px;background-color:rgba(0,0,0,0.5);border-radius:30px;font-weight:bold"></div>
    
            <div class="text" style="font-size:15px;color:orange;left:200px;top:80px;;">等级</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:80px;">连胜</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:80px;">硬币</div>
            <div class="text" style="font-size:25px;color:yellow;left:200px;top:100px;">${data[0]}</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:400px;top:105px;">${data[1]}</div>
            <div class="text" style="font-size:25px;color:yellow;left:600px;top:105px;">${data[2]}</div>
            
            <div class="text" style="font-size:15px;color:orange;left:200px;top:150px;">胜场</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:150px;">W/L</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:150px;">败场</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:200px;top:175px;">${data[3]}</div>
            <div class="text" style="font-size:25px;color:yellow;left:400px;top:175px;">${data[4]}</div>
            <div class="text" style="font-size:25px;color:red;left:600px;top:175px;">${data[5]}</div>
            
            <div class="text" style="font-size:15px;color:orange;left:200px;top:220px;">击杀</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:220px;">K/D</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:220px;">死亡</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:200px;top:245px;">${data[6]}</div>
            <div class="text" style="font-size:25px;color:yellow;left:400px;top:245px;">${data[7]}</div>
            <div class="text" style="font-size:25px;color:red;left:600px;top:245px;">${data[8]}</div>
            
            <div class="text" style="font-size:15px;color:orange;left:200px;top:290px;">最终击杀</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:290px;">FKDR</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:290px;">最终死亡</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:200px;top:315px;">${data[9]}</div>
            <div class="text" style="font-size:25px;color:yellow;left:400px;top:315px;">${data[10]}</div>
            <div class="text" style="font-size:25px;color:red;left:600px;top:315px;">${data[11]}</div>
            
            <div class="text" style="font-size:15px;color:orange;left:200px;top:360px;">破坏床数</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:360px;">BBLR</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:360px;">被破坏床数</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:200px;top:385px;">${data[12]}</div>
            <div class="text" style="font-size:25px;color:yellow;left:400px;top:385px;">${data[13]}</div>
            <div class="text" style="font-size:25px;color:red;left:600px;top:385px;">${data[14]}</div>`;
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, 'bw'));
    await sleep(1000);
    // Take a screenshot
    log(`Saving player ${name} bedwars image`);
    await page.screenshot({ path: `./src/temp/${name}_bw.png`, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} bedwars image generate`);
}

const sw = async (name) => {
    log(`Fetching player ${name} bedwars data`);
    await hypixel.download(name);
    if (hypixel.data[name].nick == true)
        return 404;

    log(`Rendering player ${name} bedwars image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/index.html`);
    // Add a style tag to the page
    await page.addStyleTag({ content: 'body { background: url("./img/sw1.png"); }' });
    await page.evaluate((nameFormat, uuid, data) => {
        document.body.innerHTML = `<div style="font-size:25px;font-family:Minecraftia;position:absolute;left:30px;top:20px">${nameFormat}</div>
            <img src="https://crafatar.com/renders/body/${uuid}?overlay" style="position:absolute;left:40px;top:80px">
            <div style="position:absolute;left:200px;top:70px;width:590px;height:360px;background-color:rgba(0,0,0,0.5);border-radius:30px;font-weight:bold"></div>
    
            <div class="text" style="font-size:15px;color:orange;left:200px;top:80px;;">等级</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:80px;">硬币</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:80px;">代币</div>
            <div class="text" style="font-size:25px;color:white;left:200px;top:100px;">${data[0]}</div>
            <div class="text" style="font-size:25px;color:gold;left:400px;top:105px;">${data[1]}</div>
            <div class="text" style="font-size:25px;color:green;left:600px;top:105px;">${data[2]}</div>
            
            <div class="text" style="font-size:15px;color:orange;left:200px;top:150px;">胜场</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:150px;">W/L</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:150px;">败场</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:200px;top:175px;">${data[3]}</div>
            <div class="text" style="font-size:25px;color:yellow;left:400px;top:175px;">${data[4]}</div>
            <div class="text" style="font-size:25px;color:red;left:600px;top:175px;">${data[5]}</div>
            
            <div class="text" style="font-size:15px;color:orange;left:200px;top:220px;">击杀</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:220px;">K/D</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:220px;">死亡</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:200px;top:245px;">${data[6]}</div>
            <div class="text" style="font-size:25px;color:yellow;left:400px;top:245px;">${data[7]}</div>
            <div class="text" style="font-size:25px;color:red;left:600px;top:245px;">${data[8]}</div>
            
            <div class="text" style="font-size:15px;color:orange;left:200px;top:290px;">灵魂</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:290px;">头颅</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:290px;">助攻</div>
            <div class="text" style="font-size:25px;color:aqua;left:200px;top:315px;">${data[9]}</div>
            <div class="text" style="font-size:25px;color:fuchsia;left:400px;top:315px;">${data[10]}</div>
            <div class="text" style="font-size:25px;color:red;left:600px;top:315px;">${data[11]}</div>

            <div class="text" style="font-size:15px;color:orange;left:200px;top:360px;">欧泊</div>
            <div class="text" style="font-size:15px;color:orange;left:400px;top:360px;">游玩时间</div>
            <div class="text" style="font-size:15px;color:orange;left:600px;top:360px;">碎片</div>
            <div class="text" style="font-size:25px;color:blue;left:200px;top:385px;">${data[12]}</div>
            <div class="text" style="font-size:25px;color:greenyellow;left:400px;top:385px;">${data[13]}</div>
            <div class="text" style="font-size:25px;color:blue;left:600px;top:385px;">${data[14]}/1.5k</div>`;
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, 'sw'));
    await sleep(1000);
    // Take a screenshot
    log(`Saving player ${name} bedwars image`);
    await page.screenshot({ path: `./src/temp/${name}_sw.png`, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} bedwars image generate`);
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
            res.end(`${__dirname}/temp/${name}_hyp.png`);
        }
    }
    if (path == '/bw') {
        let r = await bw(name);
        if (r == 404) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`${__dirname}/temp/${name}_bw.png`);
        }
    }
    if (path == '/sw') {
        let r = await sw(name);
        if (r == 404) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`${__dirname}/temp/${name}_sw.png`);
        }
    }
});

server.on('listening', () => log(`Server running on 127.0.0.1:${port}`));
server.listen(port);

log(`Starting Hypixel img backend server`);