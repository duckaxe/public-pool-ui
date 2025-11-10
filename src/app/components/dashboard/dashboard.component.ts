import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Table } from 'primeng/table';
import { map, Observable, shareReplay, switchMap, timer } from 'rxjs';

import { HashSuffixPipe } from '../../pipes/hash-suffix.pipe';
import { AppService } from '../../services/app.service';
import { ClientService } from '../../services/client.service';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  public address: string;
  public chartOptions: any;

  public networkInfo$: Observable<any>;
  public clientInfo$: Observable<any>;
  public chartData$: Observable<any>;
  public expandedRows$: Observable<any>;

  @ViewChild('dataTable') dataTable!: Table;

  constructor(
    private clientService: ClientService,
    private route: ActivatedRoute,
    private appService: AppService
  ) {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    const yellow600 = documentStyle.getPropertyValue('--yellow-600');
    const primaryColor = documentStyle.getPropertyValue('--primary-color');

    this.address = this.route.snapshot.params['address'];

    this.networkInfo$ = timer(0, 60000).pipe(
      switchMap(() => this.appService.getNetworkInfo()),
      shareReplay({ refCount: true, bufferSize: 1 })
    );

    this.clientInfo$ = timer(0, 60000).pipe(
      switchMap(() => this.clientService.getClientInfo(this.address)),
      shareReplay({ refCount: true, bufferSize: 1 })
    );

    this.expandedRows$ = this.clientInfo$.pipe(map((info: any) => {
      return info.workers.reduce((pre: any, cur: any) => { pre[cur.name] = true; return pre; }, {});
    }));

    this.chartData$ = timer(0, 600000).pipe(
      switchMap(() => this.clientService.getClientInfoChart(this.address)),
      map((chartData: any[]) => {
        const GROUP_SIZE = 12; //6 = 1 hour

        let hourlyData = [];
        for (let i = GROUP_SIZE; i < chartData.length; i += GROUP_SIZE) {
          let sum = 0;
          for (let j = GROUP_SIZE - 1; j >= 0; j--) {
            sum += parseInt(chartData[i - j].data);
          }
          sum = sum / GROUP_SIZE;
          hourlyData.push({ y: sum, x: chartData[i].label });
        }

        const data = chartData.map((d: any) => { return { y: d.data, x: d.label } });

        return {
          labels: chartData.map((d: any) => d.label),
          datasets: [
            {
              type: 'line',
              label: '2 Hour',
              data: hourlyData,
              fill: false,
              backgroundColor: yellow600,
              borderColor: yellow600,
              tension: .4,
              pointRadius: 1,
              borderWidth: 1
            },
            {
              type: 'line',
              label: '10 Minute',
              data: data,
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
            unit: 'hour', // Set the unit to 'minute'
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
          }
        }
      }
    };

  }

  public getSessionCount(name: string, workers: any[]) {
    const workersByName = workers.filter(w => w.name == name);
    return workersByName.length;
  }

  public getTotalHashRate(name: string, workers: any[]) {
    const workersByName = workers.filter(w => w.name == name);
    const sum = workersByName.reduce((pre, cur, idx, arr) => {
      return pre += Math.floor(cur.hashRate);
    }, 0);
    return Math.floor(sum);
  }

  public getBestDifficulty(name: string, workers: any[]) {
    const workersByName = workers.filter(w => w.name == name);
    const best = workersByName.reduce((pre, cur, idx, arr) => {
      if (cur.bestDifficulty > pre) {
        return cur.bestDifficulty;
      }
      return pre;
    }, 0);

    return best;
  }

  public getTotalUptime(name: string, workers: any[]) {
    const now = new Date().getTime();
    const workersByName = workers.filter(w => w.name == name);
    const sum = workersByName.reduce((pre, cur, idx, arr) => {
      return pre += now - new Date(cur.startTime).getTime();
    }, 0);
    return new Date(now - sum);
  }
}
