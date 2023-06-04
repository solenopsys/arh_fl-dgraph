import {Observable} from "rxjs";
import {HStreamService} from "@solenopsys/fl-hyperstreams";
import {Store} from "@ngxs/store";

export interface Transport {
    createQuery(query: string): Observable<any>

    createMutate(query: string): Observable<any>
}


export class WsDgraphTransport implements Transport {

    constructor(private hStreamService: HStreamService, private store: Store) {
    }

    createMutate(query: string): Observable<any> {
        //@ts-ignore
        return this.hStreamService.createStringQuery("richteri-hsm-dgraph", query, 2);
    }

    createQuery(query: string): Observable<any> {
        return this.hStreamService.createStringQuery("richteri-hsm-dgraph", query, 1)
    }

}