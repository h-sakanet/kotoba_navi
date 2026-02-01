
import { HomonymImporter } from './src/utils/importers/HomonymImporter';
import { StandardImporter } from './src/utils/importers/StandardImporter';
import { IdiomImporter } from './src/utils/importers/IdiomImporter';

const row = ["144", "1", "イイン", "委員", "学級＿＿になるように推薦された", "学級＿＿になるようにすいせんされた"];

const homonym = new HomonymImporter();
const standard = new StandardImporter();
const idiom = new IdiomImporter();

console.log("Homonym canHandle:", homonym.canHandle(row));
if (homonym.canHandle(row)) {
    console.log("Homonym parse:", homonym.parseRow(row));
}

console.log("Standard canHandle:", standard.canHandle(row));
if (standard.canHandle(row)) {
    console.log("Standard parse:", standard.parseRow(row));
}

console.log("Idiom canHandle:", idiom.canHandle(row));
if (idiom.canHandle(row)) {
    console.log("Idiom parse:", idiom.parseRow(row));
}
