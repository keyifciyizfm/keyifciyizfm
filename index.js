// index.js içindeki parseEmojis fonksiyonunu bununla değiştir:
function parseEmojis(text) {
    const emojiMap = {
        ":smile:": "😊",
        ":joy:": "😂",
        ":heart:": "❤️",
        ":fire:": "🔥",
        ":microphone:": "🎙️",
        ":cool:": "😎",
        ":thumbsup:": "👍",
        ":rose:": "🌹"
    };

    let newText = text;
    for (const [code, emoji] of Object.entries(emojiMap)) {
        newText = newText.replace(new RegExp(code, 'g'), emoji);
    }
    return newText;
}
