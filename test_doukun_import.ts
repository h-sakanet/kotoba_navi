
import { HomonymImporter } from './src/utils/importers/HomonymImporter';

// Doukun CSV rows (header, then data)
const rows = [
    ["158", "1", "アウ", "合う", "彼とはなぜか馬が＿＿。", "彼とはなぜか馬が＿＿"],
    ["158", "1", "アウ", "会う", "街角で偶然知人に＿＿。", "まちかどでぐうぜん知人に＿＿。"],
    ["158", "2", "アケル", "空ける", "不要な本を処分し、本棚を＿＿。", "ふような本をしょぶんし、ほんだなを＿＿。"],
    ["158", "2", "アケル", "明ける", "じめじめした梅雨が＿＿。", "じめじめしたつゆが＿＿。"],
];

const homonym = new HomonymImporter();

console.log("Testing Doukun CSV rows with HomonymImporter:");
for (const row of rows) {
    console.log(`\nRow: ${row.join(", ")}`);
    console.log("canHandle:", homonym.canHandle(row));
    if (homonym.canHandle(row)) {
        console.log("parseRow:", homonym.parseRow(row));
    }
}
