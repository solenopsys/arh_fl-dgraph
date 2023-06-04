

import {filter, map} from "rxjs/operators";
import {firstValueFrom, Observable, Subject} from "rxjs";
import {DataPageConfig, DataProvider, EntityTitle} from "./model";
import {DgraphService} from "./dgraph.service";


export class DgraphDataProvider implements DataProvider {
    private subject = new Subject<EntityTitle[]>();

    constructor(private dg: DgraphService, private key: string, private titleKey?: string) {
    }

    initObserver(input: Observable<string>): Observable<EntityTitle[]> {
        input.pipe(filter(text => text != null)).subscribe(text => {
            firstValueFrom(this.dg.find<any>(text, this.key, this.titleKey)).then(res => {
                if (res.errors) {
                    console.log('ERROR', res.errors);
                } else {

                    const transformed = res.results.map((item: any) => {
                            return {
                                uid: item.uid,
                                title: item[this.titleKey ? this.titleKey : this.key]
                            };
                        }
                    );
                    this.subject.next(transformed);
                }

            });
        });

        return this.subject.asObservable();
    }

    byId(id: string): Observable<string> {
        return this.dg.selectOneTitleEntity(this.key, id);
    }
}


export class DgraphDataProviderService  {

    constructor(private dg: DgraphService) {

    }

    getProvider(key: string, titleKey?: string): DataProvider {
        return new DgraphDataProvider(this.dg, key, titleKey);
    }

}


export interface DataListInterface {
    next(start: number, count: number, conf: DataPageConfig): Promise<any>;


    getMax(): number;
}

export interface DataItemInterface {
    loadOne(key: string, conf: DataPageConfig): Promise<any>;


    save(key: string, nowObjectState: any, beforeObjectState: any, conf: DataPageConfig): Observable<any>;
}


export class RomDgraphDataBuffered implements DataListInterface {

    query = '{\n' +
        'var(func: has(rom.object)) @groupby(   rom.object ) {  \n' +
        'a as count(uid)\n' +
        '}\n' +
        '\n' +
        'stat(func: uid(a), orderdesc: val(a)) {  \n' +
        'rom.resource\n' +
        'uid\n' +
        'count   : val(a)\n' +
        '}\n' +
        '}\n ';

    constructor(private draph: DgraphService) {
    }

    getMax() {
        return 0;
    }

    next(start: number, count: number): Promise<any> {
        return firstValueFrom(this.draph.query<any>(this.query).pipe(map(c => c.stat)));
    }
}
