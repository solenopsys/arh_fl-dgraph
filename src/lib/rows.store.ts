import {Action, createSelector, State, StateContext, Store} from "@ngxs/store";
import {Injectable, Injector, ProviderToken} from "@angular/core";
import {firstValueFrom, Observable, tap} from "rxjs";
import {map} from "rxjs/operators";
import {append, patch, removeItem} from "@ngxs/store/operators";
import {DataItemInterface, DataListInterface} from "./dataprovider";
import {DgraphService} from "./dgraph.service";
import {DataPageConfig} from "./model";

const BATCH_SIZE = 100; //todo в конфиг

//todo remove this think needed refactoring
export const COMMANDS_MAP: { [key: string]: any } = {};

@Injectable({
    providedIn: 'root'
})
export class DgraphDataBuffered implements DataListInterface, DataItemInterface {

    constructor(private draph: DgraphService) {
    }

    getMax() {
        return 0;
    }

    next(start: number, count: number, conf: DataPageConfig): Promise<any> {
        return firstValueFrom(this.draph.selectListLimit(conf, start, count).pipe(map((c: any) => c.results)).pipe(tap(k => console.log("DATA", k))));
    }

    loadOne(key: string, conf: DataPageConfig): Promise<any> {
        return firstValueFrom(this.draph.selectOne(conf, key));
    }

    save(key: string, nowObjectState: any, beforeObjectState: any, conf: DataPageConfig): Observable<any> {
        return this.draph.update(conf, key, nowObjectState, beforeObjectState);
    }
}

export class RowsGroup {
    dataInterface!: ProviderToken<DataListInterface | DataItemInterface>;
    dataConf!: DataPageConfig;
    commands!: { type: string, title: string, icon: string }[];
    rows!: any[];
    checked!: { [key: string]: any };
    tableKey!: string;
    module!: string;
    columnsWidths!: { [key: string]: number };
}

export class RowsStateModel {

    constructor(public groups: { [key: string]: RowsGroup }) {
    }

}


export class InitGroup {
    static readonly type = '[Rows] Init Group';

    constructor(public key: string, public conf: RowsGroup) {
    }
}

export class ChangeTableWidth {
    static readonly type = '[Rows] Change Width';

    constructor(public key: string, public width: number) {
    }
}

export class Command {
    static readonly type = '[Rows] Command';

    constructor(public module: string, public table: string, public key: string, public type: string, public uid: string) {
    }
}


export class Check {
    static readonly type = '[Rows] Check';

    constructor(public key: string, public row: any, public checked: boolean) {
    }
}


export class LoadNextBatch {
    static readonly type = '[Rows] Load Batch';

    constructor(public key: string) {
    }
}

export class DeleteRow {
    static readonly type = '[Rows] Delete Row';

    constructor(public key: string, public uid: string) {
    }
}


// @ts-ignore
@State<RowsStateModel>({
    name: 'rows',
    defaults: {
        groups: {},
    }
})
@Injectable()
export class RowsState {


    constructor(private store: Store, private injector: Injector, private dgraph: DgraphService) {
    }


    static getByKey(key: string) {
        return createSelector([RowsState], (state: RowsStateModel) => {
            return state.groups[key];
        });
    }


    @Action(InitGroup)
    initGroup({getState, setState}: StateContext<RowsStateModel>, {key, conf}: InitGroup) {
        setState(patch({groups: patch({[key]: conf})}))
    }

    @Action(LoadNextBatch)
    async loadNextBatch({getState, setState}: StateContext<RowsStateModel>, {key}: LoadNextBatch) {
        let conf = getState().groups[key];
        if (conf) {
            let rows = conf.rows;
            const startPos = rows ? rows.length : 0;

            const di = this.injector.get(conf.dataInterface) as DataListInterface;
            const res = await di.next(startPos, BATCH_SIZE, conf.dataConf)
            setState(patch({groups: patch({[key]: patch({rows: append(res)})})}));

        }

    }

    @Action(Check)
    check({getState, setState}: StateContext<RowsStateModel>, {key, row, checked}: Check) {
        if (checked) {
            setState(patch({
                groups: patch({[key]: patch({checked: patch({[row.uid]: row})})})
            }));
        } else {
            setState(patch({
                groups: patch({[key]: patch({checked: patch({[row.uid]: undefined})})})
            }));
        }
    }

    @Action(Command)
    command({getState, setState}: StateContext<RowsStateModel>, {table, module, type, uid}: Command) {
        const event = COMMANDS_MAP[type].process(module, table, uid);
        this.store.dispatch(event);
    }


    @Action(DeleteRow)
    async delete({getState, setState}: StateContext<RowsStateModel>, {key, uid}: DeleteRow) {
        let conf = getState().groups[key];
        if (conf) {
            const res = await firstValueFrom(this.dgraph.mutate(`{delete { <${uid}> <${conf.dataConf.deleteQ}> * . }}`))

            setState(patch({
                groups: patch({[key]: patch({rows: removeItem<any>(r => r.uid === uid)})})
            }));
        }
    }


    @Action(ChangeTableWidth)
    async changeColumnsWidth({getState, setState}: StateContext<RowsStateModel>, {key, width}: ChangeTableWidth) {
        let conf = getState().groups[key];
        let formFields = conf.dataConf.fields;
        let count = formFields.length;
        const itemSIze = ((width - 100 - 40) / count) - 30; //todo вынести доп колонку и паддинг в параметр, и боковую панель
        const columnsWidthDefault: any = {}
        formFields.forEach(field => columnsWidthDefault[field.key] = itemSIze)
        if (conf) {

            setState(patch({
                groups: patch({[key]: patch({columnsWidths: columnsWidthDefault})})
            }));
        }
    }

}
