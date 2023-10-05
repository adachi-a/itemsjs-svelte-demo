export function toKatakana(hiragana) {
    return hiragana.split('').map(char => {
        const code = char.charCodeAt(0);
        // Check if the char is hiragana
        if (code >= 0x3041 && code <= 0x3096) {
            // Convert hiragana to katakana
            return String.fromCharCode(code + 0x60);
        }
        return char;
    }).join('');
}

export function toHiragana(katakana) {
    return katakana.split('').map(char => {
        const code = char.charCodeAt(0);
        // Check if the char is katakana
        if (code >= 0x30a1 && code <= 0x30f6) {
            // Convert katakana to hiragana
            return String.fromCharCode(code - 0x60);
        }
        return char;
    }).join('');
}