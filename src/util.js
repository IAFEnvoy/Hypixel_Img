const colorMap = Object.fromEntries([
    'black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray',
    'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'
].map((c, i) => [c, "§" + i.toString(16)]))
const formatColorFromString = name => colorMap[name.toLowerCase()];
//color parser
const colors = [
    '#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#FFAA00', '#AAAAAA',
    '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'
];
const formatColor = (data) => {
    if (data == null) return null;
    return data.replaceAll('§l', '').split('').reduce((ret, char, index, arr) =>
        ret += char == '§' ? '</span>' : arr[index - 1] == '§' ? '<span style="color:' + colors[parseInt(char, 16)] + '">' : char,
        '<span style="color:' + colors[0] + '">') + '</span>';
}

const toDefault = (v, u, d) => v == u ? d : v;

const formatDateTime = (date) => {
    if (date == null) return null;
    date = new Date(date);
    let y = date.getFullYear();
    let m = date.getMonth() + 1; //注意这个“+1”
    m = m < 10 ? ('0' + m) : m;
    let d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    let h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    let minute = date.getMinutes();
    minute = minute < 10 ? ('0' + minute) : minute;
    let second = date.getSeconds();
    second = second < 10 ? ('0' + second) : second;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
};

const formatNameString = name => name.toLowerCase().split('_').reduce((ret, word) => ret + word[0].toUpperCase() + word.slice(1) + ' ', '');

const formatTime = time => {
    let second = time % 60; time = Math.floor(time / 60);
    let minute = time % 60; time = Math.floor(time / 60);
    let hour = time % 24, day = Math.floor(time / 24);
    if (day > 0) return `${day}d${hour}h${minute}m${second}s`;
    if (hour > 0) return `${hour}h${minute}m${second}s`;
    if (minute > 0) return `${minute}m${second}s`;
    if (second > 0) return `${second}s`;
    return `0s`;
}

module.exports = { formatColor, formatColorFromString, formatDateTime, formatNameString, formatTime, toDefault };