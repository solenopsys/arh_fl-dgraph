import {State} from "@ngxs/store";
import {Injectable} from "@angular/core";
import {DgraphService} from "./dgraph.service";


export class TableData {
    rows!: any[];
    position!: number;
    //fullSize!: number;
}

export class TableStateModel {
    tablesData!: { [key: string]: TableData };
    current: string | undefined;
}


export class SelectTable {
    static readonly type = '[Tables] Select';

    constructor(public name: string) {
    }
}

export class LoadTableData {
    static readonly type = '[Tables] Load Data Frame';

    constructor(tableName: string, start: number, count: number) {
    }
}

export class AddRow {
    static readonly type = '[Tables] Add Row';

    constructor(public tableName: string, data: any) {
    }
}

export class DeleteRow {
    static readonly type = '[Tables] Delete Row';

    constructor(public tableName: string, public uid: number) {
    }
}

export class ChangeRow {
    static readonly type = '[Tables] Change Row';

    constructor(public tableName: string, public uid: number) {
    }
}

export class EditRow {
    static readonly type = '[Tables] Delete Row';

    constructor(public tableName: string, public nuid: number) {
    }
}


@State<TableStateModel>({
        name: 'tables',
        defaults: {
            tablesData: {},
            current: undefined
        }
    }
)
@Injectable()
export class ClusterState {
    constructor(private draph: DgraphService) {
    }
}
