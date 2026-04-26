import * as fs from 'fs';
import { iconMap } from './iconMap';

const w3data = JSON.parse(fs.readFileSync('./w3data.json').toString());
// all icons
const collection = {};
for (const object of w3data.objects) {
    if (object.data.Art) {
        const obj = {} as any; // 'icon': object.data.Art.split(',')[0].replace('.blp', '.png') };
        obj.icon = iconMap[object.id];
        for (const key of ['Cool1', 'Cool2', 'Cool3', 'Cool4']) {
            if (object.data[key]) {
                obj[key] = object.data[key];
            }
        }
        collection[object.id] = obj;
    }
}

fs.writeFileSync('../w3collection.json', JSON.stringify(collection));

