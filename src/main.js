const puppeteer = require('puppeteer');
const fs = require('fs');
const url = require('url');
const Fastify = require('fastify');
const { resolve } = require('path');

const Config = require('./config');
const Hypixel = require('./hypixel');
const { formatColor } = require('./util');

const log = (text) => console.log(`[${new Date().toLocaleString()}] ${text}`);

const config = new Config('./config.json', {
    apikey: '',
    port: 23168
});
const port = config.get('port');

const hypixel = new Hypixel(config.get('apikey'));

let browser = null;
(async () => browser = await puppeteer.launch({
    defaultViewport: { width: 1600, height: 900 }
}))();

const buildImg = async (name, type, mode) => {
    let sub = null;
    if (mode == null) sub = '';
    else sub = hypixel.getGameType()[type][mode]?.key ?? null;
    if (sub == null) return { success: false, reason: 'Unknown sub game mode' };

    log(`Fetching player ${name} ${type} ${mode} data`);
    let stats = await hypixel.download(name);
    if (stats != null)
        return { success: false, reason: stats };

    log(`Rendering player ${name} ${type} ${mode} image`);
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/template/${type}.html`);
    await page.evaluate((nameFormat, uuid, data, sub) => {
        document.body.innerHTML = document.body.innerHTML.replace('${nameFormat}', nameFormat).replace('${uuid}', uuid);
        if (sub != null) document.body.innerHTML = document.body.innerHTML.replace('全局', sub);
        document.body.innerHTML = data.reduce((p, c, i) => p.replace(`\${data[${i}]}`, c), document.body.innerHTML);
    }, formatColor(hypixel.formatName(name)), await hypixel.getPlayerUuid(name), hypixel.getMiniData(name, type, sub), hypixel.getGameType()[type][mode]?.display ?? null);
    let renderdoneHandle = await page.waitForFunction('loaded==true', {
        polling: 120
    });
    const renderdone = await renderdoneHandle.jsonValue();
    if (typeof renderdone == 'object')
        console.log(`Failed to load ${renderdone.componentId} : ${renderdone.message}`);
    // Take a screenshot
    log(`Saving player ${name} ${type} ${mode} image`);
    if (!fs.existsSync('./src/temp')) fs.mkdirSync('./src/temp');
    const path = `./src/temp/${name}@${type}${mode == null ? '' : `@${mode}`}.png`;
    await page.screenshot({ path: path, type: 'png' });
    await page.close();
    delete page;
    log(`Complete player ${name} ${type} ${mode} image generate`);
    return { success: true, path: resolve(path) };
}

const fastify = Fastify({});

fastify.get('/', (req, res) => {
    log(`${req.socket.remoteAddress}:${req.socket.remotePort}-> GET ${req.url}`);
    res.type('text/plain').code(200);
    res.send('200 OK');
});

fastify.get('/type', (req, res) => {
    log(`${req.socket.remoteAddress}:${req.socket.remotePort}-> GET ${req.url}`);
    res.type('application/json').code(200);
    res.send(JSON.stringify(hypixel.getGameType()));
});

Object.keys(hypixel.getGameType()).forEach(x => fastify.get(`/${x}`, async (req, res) => {
    log(`${req.socket.remoteAddress}:${req.socket.remotePort}-> GET ${req.url}`);
    let data = url.parse(req.url, true);
    let name = data.query.name, mode = data.query.mode;
    res.type('application/json');
    if (name == null) {
        res.code(400);
        return { statusCode: 400, reason: 'Missing Field' };
    }
    let r = await buildImg(name, x, mode);
    if (r.success == false) {
        res.code(400);
        return { statusCode: 406, reason: r.reason };
    }
    res.code(200);
    return { statusCode: 200, data: r.path };
}));

fastify.listen({ port: port }, (err, address) => {
    if (err) {
        log(err);
        process.exit(1);
    }
    log(`Server running on ${address}`);
});

log(`Starting Hypixel img backend server`);