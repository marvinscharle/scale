import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {DeviceMotion} from '@ionic-native/device-motion';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Gyroscope} from '@ionic-native/gyroscope';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/do';

export interface GyroPayload {
  x: number;
  y: number;
  z: number;
}

interface SensorPayload {
  id: string;
  data: {x: number, y: number, z: number};
  timestamp: number;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public currentAcceleration$: BehaviorSubject<GyroPayload> = new BehaviorSubject({x: 0, y: 0, z: 0});

  private subscription: Subscription | null = null;

  constructor(public navCtrl: NavController, private motion: Gyroscope) {
  }

  private socketConnection$(): Observable<WebSocket> {
    return Observable.create(($: Observer<WebSocket>) => {
      const client = new WebSocket('ws://192.168.0.109:3000/api/v1/emit');
      client.onclose = () => $.complete();
      client.onopen = () => $.next(client);

      return () => {
        client.close();
      };
    }).do(a => console.log('a', a)).retry(10);
  }

  public get isTransmitting(): boolean {
    return this.subscription != null;
  }

  public start(): void {
    if (this.subscription != null) return;

    this.subscription = Observable.combineLatest(
      this.motion.watch({frequency: 500}).do(a => console.log('b', a)),
      this.socketConnection$().do(a => console.log('c', a)),
      (motion, connection) => ({motion: motion, connection: connection})
    ).do(a => console.log('d', a)).subscribe(
      payload => {
        this.currentAcceleration$.next(payload.motion);
        payload.connection.send(JSON.stringify(<SensorPayload>{
          id: 'temp',
          data: payload.motion,
          timestamp: Date.now()
        }));
      },
      err => {
        this.stop();
      }
    );
  }

  public stop(): void {
    if (this.subscription == null) return;
    this.subscription.unsubscribe();
    this.subscription = null;
  }

}
