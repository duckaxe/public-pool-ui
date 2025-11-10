import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, shareReplay, switchMap, timer } from 'rxjs';
import { HashSuffixPipe } from '../../pipes/hash-suffix.pipe';
import { AppService } from '../../services/app.service';
import { EnvService } from 'src/app/services/env.service';
import { bitcoinAddressValidator } from '../../validators/bitcoin-address.validator';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss']
})
export class SplashComponent {

  public address: FormControl;

  public chartOptions: any;
  public stratumURL = '';

  private info$: Observable<any>;
  public chartData$: Observable<any>;
  public blockData$: Observable<any>;
  public userAgents$: Observable<any>;
  public highScores$: Observable<any>;
  public uptime$: Observable<string>;

  constructor(
    private appService: AppService,
    private envService: EnvService,
    private router: Router,
  ) {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const primaryColor = documentStyle.getPropertyValue('--primary-color');

    this.stratumURL = this.envService.stratumUrl;

    this.address = new FormControl(null, bitcoinAddressValidator());

    this.info$ = timer(0, 60000).pipe(
      switchMap(() => this.appService.getInfo()),
      shareReplay({ refCount: true, bufferSize: 1 })
    );

    this.blockData$ = this.info$.pipe(map(info => info.blockData));
    this.userAgents$ = this.info$.pipe(map(info => info.userAgents));
    this.highScores$ = this.info$.pipe(map(info => info.highScores));
    this.uptime$ = this.info$.pipe(map(info => info.uptime))

    this.chartData$ = timer(0, 600000).pipe(
      switchMap(() => this.appService.getInfoChart()),
      map((chartData: any[]) => {
        return {
          labels: chartData.map((d: any) => d.label),
          datasets: [
            {
              label: 'Hashrate',
              data: chartData.map((d: any) => d.data),
              fill: false,
              backgroundColor: primaryColor,
              borderColor: primaryColor,
              tension: .4,
              pointRadius: 1,
              borderWidth: 1
            }
          ]
        };
      })
    );

    this.chartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day', // Set the unit to 'minute'
          },
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
            display: true
          }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            callback: (value: number) => {
              return HashSuffixPipe.transform(value);
            }
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          },
          type: 'logarithmic',
        }
      }
    };
  }

  onSubmit() {
    if (!this.address.invalid) {
      this.router.navigate(['app', this.address.value]);
    }
  }
}
