import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { GridQuery, GridResult } from '@query-grid/core';
import { Observable } from 'rxjs';
import { ShowcaseRow } from '../models/showcase-row.model';
import { SHOWCASE_GRID_QUERY_PARAM } from '../showcase-grid.config';

@Injectable({ providedIn: 'root' })
export class ShowcaseApiService {
  private readonly http = inject(HttpClient);

  getRows(query: GridQuery): Observable<GridResult<ShowcaseRow>> {
    const params = new HttpParams().set(SHOWCASE_GRID_QUERY_PARAM, JSON.stringify(query));
    return this.http.get<GridResult<ShowcaseRow>>('/rows', { params });
  }
}
