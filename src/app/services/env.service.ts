import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  constructor() { }

  private getHost(): string {
    return window.location.hostname;
  }

  private getProtocol(): string {
    return window.location.protocol + '//';
  }

  get apiUrl(): string {
    if (environment.API_URL.startsWith(':')) {
      return this.getProtocol() + this.getHost() + environment.API_URL;
    }

    return environment.API_URL;
  }

  get stratumUrl(): string {
    if (environment.STRATUM_URL.startsWith(':')) {
      return this.getHost() + environment.STRATUM_URL;
    }

    return environment.STRATUM_URL;
  }
}
