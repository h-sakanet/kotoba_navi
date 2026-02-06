export const PLACEHOLDER_TOKEN = '＿＿';

export const splitByPlaceholder = (text: string): string[] | null => {
    if (!text.includes(PLACEHOLDER_TOKEN)) return null;
    return text.split(PLACEHOLDER_TOKEN);
};

