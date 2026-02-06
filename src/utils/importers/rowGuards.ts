const READING_PATTERN = /^[\p{Script=Hiragana}\p{Script=Katakana}ー・＿_\u3000\s、。!?？！「」『』（）()…]+$/u;

export const hasPageAndNumber = (row: string[]): boolean => {
    return !isNaN(parseInt(row[0])) && !isNaN(parseInt(row[1]));
};

export const isPositionLabel = (value: string): boolean => value === '上' || value === '下';

export const isLikelyReading = (value: string): boolean => {
    const text = (value || '').trim();
    if (!text) return false;
    if (text.length > 30) return false;
    return READING_PATTERN.test(text);
};

export const isLikelySentence = (value: string): boolean => {
    const text = (value || '').trim();
    if (!text) return false;
    if (text.includes('＿＿')) return true;
    if (text.length >= 8) return true;

    return /[。、！？]/.test(text);
};

export const isLikelyWord = (value: string): boolean => {
    const text = (value || '').trim();
    if (!text) return false;
    return !isLikelySentence(text);
};
