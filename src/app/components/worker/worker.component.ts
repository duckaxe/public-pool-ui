import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, shareReplay, switchMap, timer } from 'rxjs';

import { HashSuffixPipe } from '../../pipes/hash-suffix.pipe';
import { WorkerService } from '../../services/worker.service';
import { AppService } from 'src/app/services/app.service';

@Component({
  selector: 'app-worker',
  templateUrl: './worker.component.html',
  styleUrls: ['./worker.component.scss']
})
export class WorkerComponent {

  public chartOptions: any;

  public workerInfo$: Observable<any>;
  public chartData$: Observable<any>;
  public networkInfo$: Observable<any>;

  constructor(
    private workerService: WorkerService,
    private route: ActivatedRoute,
    private appService: AppService
  ) {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const primaryColor = documentStyle.getPropertyValue('--primary-color');

    this.workerInfo$ = timer(0, 60000).pipe(
      switchMap(() => this.workerService.getWorkerInfo(
        this.route.snapshot.params['address'],
        this.route.snapshot.params['workerName'],
        this.route.snapshot.params['workerId']
      )),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.networkInfo$ = timer(0, 60000).pipe(
      switchMap(() => this.appService.getNetworkInfo()),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.chartData$ = this.workerInfo$.pipe(
      map((workerInfo: any) => {
        return {
          labels: workerInfo.chartData.map((d: any) => d.label),
          datasets: [
            {
              label: workerInfo.name,
              data: workerInfo.chartData.map((d: any) => d.data),
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
            unit: 'day'
          },
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
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
          }
        }
      }
    };
  }

}
