import { Component, OnInit, Injector, NgZone, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { View } from '@app/views/view';
import { UserService, ShopOrderService } from '@app/data/modelservices';
import { Router } from '@angular/router';


@Component({
    selector: 'app-payment',
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent extends View implements OnInit {

    public processing = true;
    public error = '';
    public newDate = '';

    public constructor(protected injector: Injector, private userService: UserService, private router: Router, private shopOrderService: ShopOrderService, private zone: NgZone) {
        super(injector);
    }

    public async ngOnInit() {
    }
}
