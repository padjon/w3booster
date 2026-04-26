import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  constructor(private router: Router, private route: ActivatedRoute, private titleService: Title) {
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        let childIterator = this.route.root;
        let title = "W3Booster | Next Level Warcraft III Streaming"

        do {
          if(childIterator.snapshot.data && childIterator.snapshot.data.title) {
            title = childIterator.snapshot.data.title
          }
          childIterator = childIterator.firstChild;
        } while(childIterator)

        this.titleService.setTitle(title);
        /*
          const title = this.getTitle(this.router.routerState, this.router.routerState.root).join(' | ');
          this.titleService.setTitle(title);*/
        }
      );
  }
}
