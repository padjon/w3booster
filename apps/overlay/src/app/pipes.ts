import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'keys',
    pure: false
})
export class KeysPipe implements PipeTransform {
    public transform(object: object) {
        return Object.keys(object);
    }
}
