import { Component } from '@angular/core';
import { StatsTable } from './stats-table/stats-table';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StatsTable],
  template: `<app-stats-table />`,
})
export class App {}