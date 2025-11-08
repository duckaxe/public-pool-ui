import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  private PARTICLES = 'PARTICLES';
  private IS_MENU_INACTIVE = 'IS_MENU_INACTIVE';

  private _particles$: BehaviorSubject<boolean>;
  public particles$: Observable<boolean>;

  constructor() {
    this._particles$ = new BehaviorSubject<boolean>(this.getParticles());
    this.particles$ = this._particles$.asObservable().pipe(shareReplay({ refCount: true, bufferSize: 1 }));
  }

  private get(key: string): string | null {
    return localStorage.getItem(key);
  }

  private set(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  private remove(key: string): void {
    localStorage.removeItem(key);
  }


  public getParticles(): boolean {
    const result = this.get(this.PARTICLES);
    return result == null || JSON.parse(result)?.particles === true;
  }

  public setParticles(particles: boolean) {
    this.set(this.PARTICLES, JSON.stringify({ particles }));
    this._particles$.next(particles);
  }

  get isMenuInactive(): boolean {
    return this.get(this.IS_MENU_INACTIVE) === 'true';
  }

  set isMenuInactive(value: boolean) {
    this.set(this.IS_MENU_INACTIVE, value.toString());
  }
}
