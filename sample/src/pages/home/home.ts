import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {DeviceMotion} from '@ionic-native/device-motion';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';

export interface AccelerationPayload {
  x: number;
  y: number;
  z: number;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public currentAcceleration$: BehaviorSubject<AccelerationPayload> = new BehaviorSubject({x: 0, y: 0, z: 0});

  private subscription: Subscription | null = null;

  constructor(public navCtrl: NavController, private motion: DeviceMotion) {

  }

  public get isTransmitting(): boolean {
    return this.subscription != null;
  }

  public start(): void {
    if (this.subscription != null) return;

    this.subscription = this.motion.watchAcceleration().subscribe(payload => {
      this.currentAcceleration$.next(payload);
    });
  }

  public stop(): void {
    if (this.subscription == null) return;
    this.subscription.unsubscribe();
    this.subscription = null;
  }

}
