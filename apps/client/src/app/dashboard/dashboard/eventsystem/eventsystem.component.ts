import { Component, OnInit, Injector } from '@angular/core';
import { View } from '@app/views/view';


@Component({
    selector: 'app-eventsystem',
    templateUrl: './eventsystem.component.html',
    styleUrls: ['./eventsystem.component.css']
})
export class EventsystemComponent extends View implements OnInit {

    constructor( protected injector: Injector) {
        super(injector);
    }

    public ngOnInit() {

    }


}
