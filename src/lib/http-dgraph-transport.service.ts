import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Transport} from "./ws-dgraph-transport.service";


@Injectable({
    providedIn: 'root'
})
export class HttpDgraphTransportService implements Transport {
    host = "" //|| "http://10.23.92.86:8080"; //http:// environment.dgraphHost

    constructor(private client: HttpClient) {
    }

    createQuery(query: string): Observable<any> {
        return this.client.post(this.host + '/query?timeout=20s', {
            query: query,
            variables: {}
        }, {headers: {'Content-Type': 'application/json'}});
    }

    createMutate(query: string): Observable<any> {
        return this.client.post(this.host + '/mutate?commitNow=true', {
            query: query,
            variables: {}
        }, {headers: {'Content-Type': 'application/json'}});
    }
}
