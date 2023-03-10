const { formatColor, formatColorFromString, formatTime, formatNameString, formatDateTime, toDefault } = require('./util');

//this file contains api to hypixel
class Hypixel {
    constructor(apiKey, callback) {
        this.apiKey = apiKey;
        this.data = {};
        this.verifying = true;
        this.verifyKey(callback);
        this.uuids = [];
        this.mention_guild = [];
        this.download_count = 0;
    }
    verifyKey = async (callback) => {
        try {
            this.verified = false;
            this.owner = null;//uuid
            let a = await fetch(`https://api.hypixel.net/key?key=${this.apiKey}`)
                .catch(err => { throw err })
                .then(res => res.json());
            if (a.success == false) throw null;
            this.owner = a.record.owner;
            this.verified = true;
            this.verifying = false;
            let ownerGuild = await this.getGuildData(this.owner);
            this.owner_guild_id = ownerGuild?.guild._id ?? '';
        } catch (err) {
            this.verified = false;
            this.verifying = false;
        }
        if (callback != null) callback();
    }
    getPlayerUuid = async (name) => {//null when the player not found
        if (this.uuids[name] != null) return this.uuids[name];
        try {
            let a = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`)
                .catch(_ => { throw 'ERROR 11 : Mojang API Error' })
                .then(res => res.json());
            return this.uuids[name] = a.id;
        } catch (err) {
            console.log(err);
            console.log('This error probably caused by a nicked player.');
            return null;
        }
    }
    getPlayerData = async (uuid) => {
        let res = await fetch(`https://api.hypixel.net/player?key=${this.apiKey}&uuid=${uuid}`)
            .catch(_ => { throw 'ERROR 12 : Hypixel API Error' })
            .then(res => res.json());
        return res;
    }
    getGuildData = async (uuid) => {
        let res = await fetch(`https://api.hypixel.net/guild?key=${this.apiKey}&player=${uuid}`)
            .catch(_ => { throw 'ERROR 12 : Hypixel API Error' })
            .then(res => res.json());
        return res;
    }
    download = async (name, callback) => {//true if success, false if player not found, null if api error
        try {
            if (this.data[name] != null && this.data[name].success == true && this.data[name].nick == false && this.data[name].time + 120 * 1000 > new Date().getTime())
                return null;
            this.data[name] = { success: false };
            let uuid = await this.getPlayerUuid(name);
            if (uuid == null) {
                this.data[name] = { success: true, time: new Date().getTime(), nick: true };
                if (callback != null) callback();
                return 'ERROR 00 : Player not found';
            }
            let playerData = await this.getPlayerData(uuid);
            let guildData = await this.getGuildData(uuid);
            if (!playerData.success || !guildData.success) return null;
            if (playerData.player == null) {
                this.data[name] = { success: true, time: new Date().getTime(), nick: true };
                return 'ERROR 01 : Player haven\'t join Hypixel';
            }
            this.data[name] = { success: true, time: new Date().getTime(), nick: false, player: playerData.player, guild: guildData.guild };
            if (callback != null) callback();
            return null;
        } catch (err) {
            this.data[name] = { success: true, time: new Date().getTime(), nick: true };
            return err;
        }
    }
    getRank = (name) => {
        if (this.data[name] == null || this.data[name].player == null) return '§7';
        let playerDataJson = this.data[name].player;
        let rank = playerDataJson.packageRank;
        if (rank == null)
            rank = playerDataJson.newPackageRank;
        let plus = playerDataJson.rankPlusColor;
        if (plus != null) plus = formatColorFromString(plus);
        else plus = '§c';
        if (playerDataJson.rank != null)
            if (playerDataJson.rank == 'YOUTUBER') return `§c[§fYT§c]`;
            else if (playerDataJson.rank == 'ADMIN') return `§4[ADMIN]`;
            else if (playerDataJson.rank == 'MODERATOR') return `§2[MOD]`;
            else if (playerDataJson.rank == 'HELPER') return `§9[HELP]`;
        if (rank == 'MVP_PLUS') {
            if (playerDataJson.monthlyPackageRank == 'NONE' || !playerDataJson.hasOwnProperty('monthlyPackageRank')) return `§b[MVP${plus}+§b]`;
            else return `§6[MVP${plus}++§6]`;
        } else if (rank == 'MVP') return `§b[MVP]`;
        else if (rank == 'VIP_PLUS') return `§a[VIP§6+§a]`;
        else if (rank == 'VIP') return `§a[VIP]`;
        else return `§7`;
    }
    getGuildTag = (name) => {
        if (this.data[name] == null || this.data[name].guild == null) return ``;
        let guildJson = this.data[name].guild;
        if (guildJson.tag != null && guildJson.tagColor != null)
            return `${formatColorFromString(guildJson.tagColor)}[${guildJson.tag}]`;
        return ``;
    }
    formatName = (name) => `${this.getRank(name)}${this.data[name].player.displayname}${this.getGuildTag(name)}`;
    getLevel = (exp) => exp < 0 ? 1 : (1 - 3.5 + Math.sqrt(12.25 + 0.0008 * (exp ?? 0))).toFixed(2);
    getTag = (name) => {
        let api = this.data[name].player;
        let guild_id = this.data[name]?.guild?._id ?? '';
        let uuid = this.uuids[name];
        let tags = { value: 0, data: [] };
        if (uuid == '40dff9cbb87b473f946b4dc9776949cc' || uuid == 'f1f464287e894024a5554610d635fa55') {
            tags.value = Math.max(tags.value, 100);
            tags.data.push({ text: 'D', color: '#FFAA00' });//Developer
        }
        if (((api?.achievements?.bedwars_level ?? 0) < 15 && (api?.stats?.Bedwars?.final_kills_bedwars ?? 0) / (api?.stats?.Bedwars?.final_deaths_bedwars ?? 0) > 5)
            || ((api?.achievements?.bedwars_level ?? 0) > 15 && (api?.achievements?.bedwars_level ?? 0) < 100 && (api?.achievements?.bedwars_level ?? 0) / ((api?.stats?.Bedwars?.final_kills_bedwars ?? 0) / (api?.stats?.Bedwars?.final_deaths_bedwars ?? 0)) <= 5)) {
            tags.value = Math.max(tags.value, 50);
            tags.data.push({ text: 'A', color: '#FF5555' });//Alt
        }
        if ((api?.achievements?.bedwars_level ?? 0) < 150 && (api?.stats?.Bedwars?.final_deaths_bedwars ?? 0) / (api?.stats?.Bedwars?.losses_bedwars ?? 0) < 0.75 && (api?.stats?.Bedwars?.final_kills_bedwars ?? 0) / (api?.stats?.Bedwars?.final_deaths_bedwars ?? 0) < 1.5) {
            tags.value = Math.max(tags.value, 30);
            tags.data.push({ text: 'S', color: '#55FF55' });//Sniper
        }
        if (api.channel == 'PARTY') {
            tags.value = Math.max(tags.value, 10);
            tags.data.push({ text: 'P', color: '#5555FF' });//Potential Party
        }
        if (guild_id != '' && guild_id == this.owner_guild_id) {
            tags.value = Math.max(tags.value, 90);
            tags.data.push({ text: 'G', color: '#FF5555' });//Same Guild
        }
        if (guild_id != '' && this.mention_guild.indexOf(guild_id) != -1) {
            tags.value = Math.max(tags.value, 60);
            tags.data.push({ text: 'G', color: '#55FF55' });//Mention Guild
        }
        return tags;
    }
    getMiniData = (name, type, sub) => {
        if (this.data[name].nick) return [{ format: name, value: name }, 'NICK'];
        let api = this.data[name]?.player ?? {};
        let lvl = this.getLevel(api?.networkExp ?? 0);
        let achievements = api.achievements ?? {};
        let bedwar = api.stats?.Bedwars ?? {};
        let skywar = api.stats?.SkyWars ?? {};
        if (type == 'hyp')
            return [lvl, api.karma ?? 0, api?.giftingMeta?.ranksGiven ?? 0,
                api.achievementPoints ?? 0, achievements.general_quest_master ?? 0, achievements.general_challenger ?? 0,
                formatNameString(api.userLanguage ?? 'ENGLISH'), formatColor(formatColorFromString(this.data[name]?.guild?.tagColor ?? 'gray') + this.data[name]?.guild?.name ?? '无公会'),
                formatDateTime(api.firstLogin), formatDateTime(api.lastLogin) ?? '玩家阻止获取', formatDateTime(api.lastLogout) ?? '玩家阻止获取',
                formatNameString(api.mostRecentGameType ?? '玩家阻止获取或无数据'), api.achievements?.general_wins ?? 0, api.achievements?.general_coins ?? 0, api.tourney?.total_tributes ?? 0];
        if (type == 'bw')
            return [formatBwLevel(api.achievements?.bedwars_level ?? 1), bedwar?.[`${sub}winstreak`] ?? '玩家阻止获取', bedwar.coins ?? 0,
            bedwar?.[`${sub}wins_bedwars`] ?? 0, ((bedwar?.[`${sub}wins_bedwars`] ?? 0) / (bedwar?.[`${sub}losses_bedwars`] ?? 0)).toFixed(2), bedwar?.[`${sub}losses_bedwars`] ?? 0,
            bedwar?.[`${sub}kills_bedwars`] ?? 0, ((bedwar?.[`${sub}kills_bedwars`] ?? 0) / (bedwar?.[`${sub}deaths_bedwars`] ?? 0)).toFixed(2), bedwar?.[`${sub}deaths_bedwars`] ?? 0,
            bedwar?.[`${sub}final_kills_bedwars`] ?? 0, ((bedwar?.[`${sub}final_kills_bedwars`] ?? 0) / (bedwar?.[`${sub}final_deaths_bedwars`] ?? 0)).toFixed(2), bedwar?.[`${sub}final_deaths_bedwars`] ?? 0,
            bedwar?.[`${sub}beds_broken_bedwars`] ?? 0, ((bedwar?.[`${sub}beds_broken_bedwars`] ?? 0) / (bedwar?.[`${sub}beds_lost_bedwars`] ?? 0)).toFixed(2), bedwar?.[`${sub}beds_lost_bedwars`] ?? 0,
            bedwar?.[`${sub}iron_resources_collected_bedwars`] ?? 0, bedwar?.[`${sub}gold_resources_collected_bedwars`] ?? 0,
            bedwar?.[`${sub}diamond_resources_collected_bedwars`] ?? 0, bedwar?.[`${sub}emerald_resources_collected_bedwars`] ?? 0];
        if (type == 'sw')
            return [formatColor(skywar.levelFormatted ?? '§71⋆'), skywar.coins ?? 0, skywar.cosmetic_tokens ?? 0,
            skywar?.[`wins${sub}`] ?? 0, ((skywar?.[`wins${sub}`] ?? 0) / (skywar?.[`losses${sub}`] ?? 0)).toFixed(2), skywar?.[`losses${sub}`] ?? 0,
            skywar?.[`kills${sub}`] ?? 0, ((skywar?.[`kills${sub}`] ?? 0) / (skywar?.[`deaths${sub}`] ?? 0)).toFixed(2), skywar?.[`deaths${sub}`] ?? 0,
            skywar.souls ?? 0, skywar?.[`heads${sub}`] ?? 0, skywar?.[`assists${sub}`] ?? 0,
            skywar.opals ?? 0, formatTime(skywar?.[`time_played${sub}`]), skywar.shard ?? 0];
    }
    getLevelProgress = (name, type) => {
        let api = this.data[name]?.player ?? {};
        if (type == 'hyp') {
            let lvl = this.getLevel(api?.networkExp ?? 0);
            let now = Math.floor(lvl);
            let block = Math.floor((lvl - now) * 10);
            return `<span class="progress">${now}</span><br>
            <span class="progress" style="color:aqua;">${Array.from({ length: block }).reduce(p => p + '▉', '')}</span>
            <span class="progress" style="color:grey">${Array.from({ length: 10 - block }).reduce(p => p + '▉', '')}</span>`;
        }
        if (type == 'bw') {
            let exp = api?.stats?.Bedwars?.Experience ?? 0;
            let lvl = api?.achievements?.bedwars_level ?? 1;
            exp %= 487000;
            let max, block;
            let remains = [{ val: 500, text: '500' }, { val: 1000, text: '1k' }, { val: 2000, text: '2k' }, { val: 3500, text: '3.5k' }].reduce((p, c) => {
                if (p == null) return null;
                if (p < c.val) {
                    max = c.text;
                    block = Math.floor(exp * 10 / c.val);
                    exp = p;
                    return null;
                }
                return p - c.val;
            }, exp);
            if (remains != null) {
                max = '5k';
                remains %= 5000;
                block = Math.floor(remains / 500);
                exp = remains;
            }
            return `<span class="progress">${formatBwLevel(lvl)} ${exp}/${max}</span><br>
            <span class="progress" style="color:aqua;">${Array.from({ length: block }).reduce(p => p + '▉', '')}</span>
            <span class="progress" style="color:grey">${Array.from({ length: 10 - block }).reduce(p => p + '▉', '')}</span>`;
        }
        if (type == 'sw') {
            let exp = Math.round(api?.stats?.SkyWars?.skywars_experience ?? 0);
            let max, block, lvl;
            let remains = [{ val: 20, text: '20' }, { val: 50, text: '50' }, { val: 80, text: '80' }, { val: 100, text: '100' },
            { val: 250, text: '250' }, { val: 500, text: '500' }, { val: 1000, text: '1k' }, { val: 1500, text: '1.5k' },
            { val: 2500, text: '2.5k' }, { val: 4000, text: '4k' }, { val: 5000, text: '5k' }].reduce((p, c, i) => {
                if (p == null) return null;
                if (p < c.val) {
                    max = c.text;
                    block = Math.floor(exp * 10 / c.val);
                    lvl = i;
                    exp = p;
                    return null;
                }
                return p - c.val;
            }, exp);
            if (remains != null) {
                max = '10k';
                lvl = Math.floor(12 + remains / 10000);
                remains %= 10000;
                block = Math.floor(remains / 1000);
            } else remains = exp;
            return `<span class="progress">${formatColor(api?.stats?.SkyWars?.levelFormatted ?? '§71⋆')} ${remains}/${max}</span><br>
            <span class="progress" style="color:aqua;">${Array.from({ length: block }).reduce(p => p + '▉', '')}</span>
            <span class="progress" style="color:grey">${Array.from({ length: 10 - block }).reduce(p => p + '▉', '')}</span>`;
        }
    }
    getGuild = (name) => getGuild[config.get('lang')](this.data[name].guild, this.uuids[name]);
    getStatus = async (name) => {
        const b = await fetch(`https://api.hypixel.net/status?key=${this.apiKey}&uuid=${await this.getPlayerUuid(name)}`)
            .catch(reason => console.log(reason))
            .then(res => res.json());
        if (!b.success)
            return document.getElementById('status').innerHTML = b.cause;
        return getStatus[config.get('lang')](b.session);
    }
    getGameType = () => gameType;
}

const gameType = {
    'hyp': {},
    'bw': {
        '4v4': { key: 'two_four_', display: '4v4' },
        '4v4v4v4': { key: 'four_four_', display: '4v4v4v4' },
        '3v3v3v3': { key: 'four_three_', display: '3v3v3v3' },
        'double': { key: 'eight_two_', display: '双人' },
        'solo': { key: 'eight_one_', display: '单挑' }
    },
    'sw': {
        'solo': { key: '_solo', display: '单人' },
        'solo_normal': { key: '_solo_normal', display: '单人普通' },
        'solo_insane': { key: '_solo_insane', display: '单人疯狂' },
        'team': { key: '_team', display: '团队' },
        'team_normal': { key: '_team_normal', display: '团队普通' },
        'team_insane': { key: '_team_insane', display: '团队疯狂' },
        'lab': { key: '_lab', display: '实验室' }
    }
}

const getGuildLevel = (exp) => {
    let guildLevelTables = [100000, 150000, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 2500000, 2500000, 2500000, 2500000, 3000000];
    let level = 0;
    for (let i = 0; ; i++) {
        let need = i >= guildLevelTables.length ? guildLevelTables[guildLevelTables.length - 1] : guildLevelTables[i];
        exp -= need;
        if (exp < 0) return level + 1 + exp / need;
        else level++;
    }
}

const colorList = ['7', 'f', 'a', 'b', 'c', '6'];
const lvlList = {
    lvl: [50, 100, 150, 200, 250]
}, wsColorList = {
    bw: [4, 10, 25, 50, 100],
    sw: [50, 100, 150, 200, 250],
    duel: [4, 10, 25, 50, 100]
}, kdrColorList = {
    bw: [1, 3, 5, 10, 25],
    sw: [1, 2, 3, 4, 5],
    duel: [1, 2, 3, 5, 7.5],
    uhc: [1, 2, 3, 5, 7.5],
    mw: [1, 2, 3, 5, 7.5],
    ww: [1, 2, 3, 5, 7.5]
}, wlrColorList = {
    bw: [1, 2, 5, 7, 10],
    sw: [0.1, 0.25, 0.5, 0.75, 1],
    mm: [70, 80, 85, 90, 95, 100],
    duel: [1, 2, 3, 5, 7.5],
    uhc: [1, 2, 3, 5, 7.5],
    mw: [1, 2, 3, 5, 7.5],
    ww: [1, 2, 3, 5, 7.5]
}, bblrColorList = {
    bw: [1, 2, 3, 5, 7.5]
}, finalsColorList = {
    bw: [1000, 5000, 10000, 20000, 30000],
    sw: [1000, 5000, 15000, 30000, 75000],
    mm: [500, 1000, 4000, 10000, 20000],
    duel: [500, 1500, 4000, 10000, 17500],
    uhc: [100, 200, 400, 800, 1600],
    mw: [100, 200, 400, 800, 1600],
    ww: [100, 200, 400, 800, 1600]
}, winsColorList = {
    bw: [500, 1000, 3000, 5000, 10000],
    sw: [100, 750, 4000, 10000, 25000],
    duel: [500, 1500, 4000, 10000, 17500],
    uhc: [100, 200, 400, 800, 1600],
    mw: [100, 200, 400, 800, 1600],
    ww: [100, 200, 400, 800, 1600]
}, probabilityList = {
    murderer_chance: [1, 3, 5, 10, 15],
    detective_chance: [1, 3, 5, 10, 15],
    alpha_chance: [1, 3, 5, 10, 15],
}, specialList = {
    ww_wool_placed: [100, 200, 400, 800, 1600],
    mw_wither_damage: [1000, 2000, 4000, 8000, 16000],
    uhc_score: [100, 200, 400, 800, 1600]
}
const pickColor = (list, value) => colorList[toDefault(list.indexOf(list.find(v => v >= value)), -1, 5)];
const buildSpan = (list, value, prefix, suffix) => {
    return { format: formatColor(`§${pickColor(list, value)}${prefix ?? ''}${value}${suffix ?? ''}`), value: value }
};

const duelLvlList = [
    { lvl: 100, text: '' },
    { lvl: 120, text: '§7[I]' }, { lvl: 140, text: '§7[II]' }, { lvl: 160, text: '§7[III]' }, { lvl: 180, text: '§7[IV]' }, { lvl: 200, text: '§7[V]' },
    { lvl: 260, text: '§f[I]' }, { lvl: 320, text: '§f[II]' }, { lvl: 380, text: '§f[III]' }, { lvl: 440, text: '§f[IV]' }, { lvl: 500, text: '§f[V]' },
    { lvl: 600, text: '§6[I]' }, { lvl: 700, text: '§6[II]' }, { lvl: 800, text: '§6[III]' }, { lvl: 900, text: '§6[IV]' }, { lvl: 1000, text: '§6[V]' },
    { lvl: 1200, text: '§3[I]' }, { lvl: 1400, text: '§3[II]' }, { lvl: 1600, text: '§3[III]' }, { lvl: 1800, text: '§3[IV]' }, { lvl: 2000, text: '§3[V]' },
    { lvl: 2400, text: '§2[I]' }, { lvl: 2800, text: '§2[II]' }, { lvl: 3200, text: '§2[III]' }, { lvl: 3600, text: '§2[IV]' }, { lvl: 4000, text: '§2[V]' },
    { lvl: 5200, text: '§4[I]' }, { lvl: 6400, text: '§4[II]' }, { lvl: 7600, text: '§4[III]' }, { lvl: 8800, text: '§4[IV]' }, { lvl: 10000, text: '§4[V]' },
    { lvl: 12000, text: '§e[I]' }, { lvl: 14000, text: '§e[II]' }, { lvl: 16000, text: '§e[III]' }, { lvl: 18000, text: '§e[IV]' }, { lvl: 20000, text: '§e[V]' },
    { lvl: 24000, text: '§5[I]' }, { lvl: 28000, text: '§5[II]' }, { lvl: 32000, text: '§5[III]' }, { lvl: 36000, text: '§5[IV]' }, { lvl: 40000, text: '§5[V]' },
    { lvl: 44000, text: '§5[VI]' }, { lvl: 48000, text: '§5[VII]' }, { lvl: 52000, text: '§5[VII]' }, { lvl: 56000, text: '§5[IX]' }, { lvl: Infinity, text: '§5[X]' },
], pickDuelLvl = (wins) => formatColor(duelLvlList.find(x => x.lvl >= wins).text);

const bwLvlProvider = [
    (lvl) => `§7[${lvl}✪]`,
    (lvl) => `§f[${lvl}✪]`,
    (lvl) => `§6[${lvl}✪]`,
    (lvl) => `§b[${lvl}✪]`,
    (lvl) => `§2[${lvl}✪]`,
    (lvl) => `§3[${lvl}✪]`,
    (lvl) => `§4[${lvl}✪]`,
    (lvl) => `§d[${lvl}✪]`,
    (lvl) => `§9[${lvl}✪]`,
    (lvl) => `§5[${lvl}✪]`,
    (lvl) => `§c[§61§e${Math.floor((lvl % 1000) / 100)}§a${Math.floor((lvl % 100) / 10)}§b${lvl % 10}§d✫§5]`,
    (lvl) => `§7[§f${lvl}§7✪§7]`,
    (lvl) => `§7[§e${lvl}§6✪§7]`,
    (lvl) => `§7[§e${lvl}§6✪§7]`,
    (lvl) => `§7[§b${lvl}§3✪§7]`,
    (lvl) => `§7[§a${lvl}§2✪§7]`,
    (lvl) => `§7[§3${lvl}§9✪§7]`,
    (lvl) => `§7[§c${lvl}§4✪§7]`,
    (lvl) => `§7[§d${lvl}§5✪§7]`,
    (lvl) => `§7[§9${lvl}§1✪§7]`,
    (lvl) => `§7[§5${lvl}§8✪§7]`,
    (lvl) => `§8[§72§f${Math.floor(lvl / 10 % 100)}§7${lvl % 10}✪§8]`,
    (lvl) => `§f[2§e${Math.floor(lvl / 10 % 100)}§6${lvl % 10}⚝]`,
    (lvl) => `§6[2§f${Math.floor(lvl / 10 % 100)}§b${lvl % 10}§3⚝]`,
    (lvl) => `§5[2§d${Math.floor(lvl / 10 % 100)}§6${lvl % 10}§e⚝]`,
    (lvl) => `§b[2§f${Math.floor(lvl / 10 % 100)}§7${lvl % 10}⚝§8]`,
    (lvl) => `§f[2§a${Math.floor(lvl / 10 % 100)}§2${lvl % 10}⚝]`,
    (lvl) => `§4[2§c${Math.floor(lvl / 10 % 100)}§d${lvl % 10}⚝§5]`,
    (lvl) => `§e[2§f${Math.floor(lvl / 10 % 100)}§8${lvl % 10}⚝]`,
    (lvl) => `§a[${Math.floor(lvl / 1000)}§2${Math.floor(lvl / 100 % 10)}${Math.floor(lvl / 10 % 10)}§6${lvl % 10}⚝§c]`,
    (lvl) => `§b[${Math.floor(lvl / 1000)}§3${Math.floor(lvl / 100 % 10)}${Math.floor(lvl / 10 % 10)}§9${lvl % 10}⚝§1]`
], bwLvlProviderMax = (lvl) => `§e[3§6${Math.floor(lvl / 10 % 100)}§c${lvl % 10}⚝§4]`;
const formatBwLevel = (lvl) => {
    let i = Math.floor(lvl / 100);
    let ret = bwLvlProvider[i];
    if (ret == null) ret = bwLvlProviderMax;
    return formatColor(ret(lvl));
}

//searcher
const modeList = ['bw', 'sw', 'mm', 'duel', 'uhc', 'mw', 'bb', 'pit', 'bsg', 'arcade'];

// 在等级 10 * k 至 10 * (k + 1) 时, 升一级所需经验
const expReqPhased = [15, 30, 50, 75, 125, 300, 600, 800, 900, 1000, 1200, 1500];
// 在精通 k 时, 升一级所需经验需要乘以的倍数
const presMultipl = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 45, 50, 75, 100, 101, 101, 101, 101, 101];
const getThePitLevel = (pitProfile) => {
    level = 0;
    let xp = pitProfile.xp ?? 0;
    for (let i = 0; i < presMultipl.length; i++)
        for (let j = 0; j < expReqPhased.length; j++)
            for (let k = 0; k < 10; k++) {
                if (xp < expReqPhased[j] * presMultipl[i]) return level % 120;
                xp -= expReqPhased[j] * presMultipl[i];
                level++;
            }
}

const socialMediaList = ['DISCORD', 'HYPIXEL', 'TWITCH', 'TWITTER', 'YOUTUBE'];
const getSocialMedia = (platform, api) => api?.socialMedia?.links[platform] ?? null;

let gameTitle, subGame;

const readDisplayData = async () => {
    let title_mode = await fetch(`./json/title_mode_${config.get('lang')}.json`).then(res => res.json());
    gameTitle = title_mode.title;
    subGame = title_mode.mode;
}

module.exports = Hypixel;