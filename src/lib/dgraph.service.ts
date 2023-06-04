import {Inject, Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {DataPageConfig, FieldType} from "./model";
import {HStreamService} from "@solenopsys/fl-hyperstreams";
import {Store} from "@ngxs/store";
import {QueryGen} from "./query-gen";
import {Transport, WsDgraphTransport} from "./ws-dgraph-transport.service";




@Injectable({
    providedIn: "root"
})
export class DgraphService {

    dgraphTransport: Transport;

    // @ts-ignore
    constructor(@Inject("assets_dir") public baseDir: string, store: Store, hstream: HStreamService) {
        this.dgraphTransport = new WsDgraphTransport(hstream, store);
    }

    public query<T>(queryRes: string): Observable<T> {
        console.log("SUBS");
        return this.dgraphTransport
            .createQuery(queryRes)
            .pipe(map((x: any) => {
                var enc = new TextDecoder();
                console.log("DAYA1", enc.decode(x));
                return JSON.parse(enc.decode(x)).data;
            }));
    }

    public mutate<T>(queryRes: string): Observable<T> {
        return this.dgraphTransport
            .createMutate(queryRes)
            .pipe(map((x: any) => x.data));
    }

    public selectOne<T>(query: DataPageConfig, id: string): Observable<T> {
        const qGen = new QueryGen(query);
        return this.query(qGen.selectOne(id)).pipe(map((res: any) => res.results[0])).pipe(map(res => {
                console.log("RES", JSON.stringify(res));
                query.fields.forEach((field: any) => {
                    if (field.type === FieldType.EUID) {
                        const values: any[] = res[field.key];
                        if (values) {
                            res[field.key] = values.map(vl => {
                                vl.title = vl[field.link.titleField];
                                return vl;
                            });
                        }
                    }
                    if (field.type === FieldType.FILE) {
                        const values: any[] = res[field.key];
                        console.log("VALUES", values);
                        if (values) {
                            res[field.key] = values.map(vl => {
                                vl.title = vl[field.link.titleField];
                                return vl;
                            });
                        }
                    }
                });

                console.log("RES", res);
                return res;
            }
        ));
    }

    public find<T>(query: string, key: string, titleKey: any): Observable<T> {
        return this.query<T>(QueryGen.find(query, key, titleKey));
    }

    public update<T>(query: DataPageConfig, id: string, values: object, beforeValues: object): Observable<T> {
        const qGen = new QueryGen(query);
        console.log("VALUES", values);
        console.log("VALUES BEFORE", beforeValues);

        let updateQuery = qGen.update(id, values, beforeValues);
        console.log("UPDATE Q", updateQuery);
        return this.mutate<T>(updateQuery);
    }

    public selectList<T>(query: DataPageConfig): Observable<T> {
        const qGen = new QueryGen(query);
        return this.query<T>(qGen.selectAll());
    }

    public selectListLimit<T>(query: DataPageConfig, start: number, limit: number): Observable<T> {
        const qGen = new QueryGen(query);
        return this.query<T>(qGen.selectLimit(start, limit));
    }

    public selectOneTitleEntity(titleField: string, id: string): Observable<string> {
        return this.query<any>(QueryGen.getTitle(titleField, id)).pipe(map(res => res.results[0][titleField]));
    }


    getProcessInResources<T>(processId: number): Observable<T> {
        const query = `{res(func: uid(${processId}))  {uid   inResources {uid}}}`;
        return this.query<T>(query).pipe(map((data: any) => data.res[0].inResources));
    }

    getProcesses<T>(resourceId: number): Observable<T> {
        const query = `{res(func: has(rom.process)) @cascade {uid  rom.process  outResources @filter(uid(${resourceId})) {uid }}}`;
        return this.query(query).pipe(map((data: any) => data.res));
    }

    getGoalResources<T>(goalId: string): Observable<T> {
        const queryRes = `{res(func:  uid(${goalId})){resources {uid, rom.resource}}}`;
        return this.query<T>(queryRes).pipe(map((data: any) => data.res[0].resources));
    }
}
