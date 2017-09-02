import {Component, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subscriber} from 'rxjs/Subscriber';
import 'rxjs/add/operator/publishReplay';

export interface SensorPayload {
  id: string;
  data: { x: number, y: number, z: number };
  timestamp: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  payload$: Observable<SensorPayload>;
  constructor() {
    this.payload$ = Observable.create(($: Subscriber<SensorPayload>) => {
      const client = new WebSocket('ws://192.168.0.109:3000/api/v1/subscribe');
      client.onclose = () => $.complete();
      client.onmessage = event => {
        try {
          $.next(JSON.parse(event.data));
        } catch (e) {
          console.warn(e);
        }
      };

      return () => {
        client.close();
      };
    }).publishReplay(1).refCount();
  }
}
