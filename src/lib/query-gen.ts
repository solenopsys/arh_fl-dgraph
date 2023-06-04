import { DataPageConfig, FieldType, FormField} from './model';


export class QueryGen {

    constructor(private query: DataPageConfig) {
    }

    static getTitle(titleField: string, id: string): string {
        const params = [titleField].join(' ');
        return `{ results(func: uid(${id})) {${params}}}`;
    }


    static find(query: string, key: string, keyTitle: string = ''): string {
        if (query.length > 2) {
            return `{ results(func:  regexp(${key},/^.*${query}.*$/i)) {${key} uid ${keyTitle}}}`;
        } else {
            return `{ results(func:  has(${key})) {${key} uid ${keyTitle}}}`;
        }

    }

    static wrapTriples(config: { triples: string[], command: string }[]): string {
        const endString = ' . \n';
        let res = ""
        config.forEach((config: { triples: string[], command: string }) => {
            const triplesConcat = config.triples.join(endString) + endString;
            res = res + `${config.command} { ${triplesConcat} }  \n`;
        })
        return `{ ${res} }`;
    }

    public static multiLinkUpdate(fromIds: string[], pedicate: string, toId: string): string {
        const triples: string[] = [];
        fromIds.forEach(fromId => {
            triples.push(`<${fromId}>  <${pedicate}> <${toId}>`);
        });

        return this.wrapTriples([{triples, command: "set"}]);
    }



    static escape(value: string): string {
        return value.replace(/(?:\r\n|\r|\n)/g, '\\n')
            .replace(/\"/g, '\\"')
            ;
        // escapingValue
    }

    update(id: string, values: any, valuesBefore?: any): string { //todo need refactor for this trash
        const keys = Object.keys(values);

        const triples: string[] = [];
        const triplesDelete: string[] = [];
        for (const key of keys) {
            const value = values[key];

            if (key !== 'uid') {

                const ff: FormField | undefined = this.query.fields.find(val => key === val.key);
                const prefix = id === 'new' ? '_:x ' : `<${id}>`;
                if (ff?.type === FieldType.EUID) {
                    console.log('VALUE', value);
                    value.forEach((valItem: any) => {
                        if (valItem.uid) {
                            let tv = `${prefix} <${key}> <${valItem.uid}>`;

                            Object.keys(valItem).forEach(keyF => {
                                if (keyF.startsWith(key + '|')) {
                                    tv = tv + ' (' + keyF.split('|')[1] + '=' + valItem[keyF] + ') ';
                                }
                            });

                            triples.push(tv);
                        }
                    });


                    if (valuesBefore) {
                        const valueBefore = valuesBefore[key];
                        valueBefore?.forEach((valItem: any) => {
                            if (valItem.uid && value.find((i: any) => valItem.uid === i.uid) === undefined) {
                                let tv = `${prefix} <${key}> <${valItem.uid}>`;
                                triplesDelete.push(tv);
                            }
                        });
                    }
                } else if (ff?.type === FieldType.FILE) {
                    triples.push(`${prefix} <${key}> <${value.uid}>`);
                } else {
                    let escapingValue = value;
                    if (value && (ff?.type === FieldType.STRING_MULTILINE || ff?.type === FieldType.CODE)) {

                        escapingValue = QueryGen.escape(escapingValue);
                        console.log('ESCAPE OK', escapingValue);
                    }
                    triples.push(`${prefix} <${key}> "${escapingValue}"`);
                }

            }
        }
        const res = []
        if (triples.length > 0) {
            res.push({triples, command: "set"})
        }
        if (triplesDelete.length > 0) {
            res.push({triples: triplesDelete, command: "delete"})
        }
        return QueryGen.wrapTriples(res);
    }

    selectOne(id: string): string {
        const params = this.getKeys(this.query.fields);
        return `{ results(func: uid(${id})) {${params}}}`;
    }

    selectAll(): string {
        const params = this.getKeys(this.query.fields);
        return `{ results(func: ${this.query.listQ}) {${params}}}`;
    }

    selectLimit(start: number, limit: number): string {
        const params = this.getKeys(this.query.fields);
        return `{ results(func: ${this.query.listQ}, offset: ${start}, first:  ${limit} ) {${params}}}`;
    }

    private getKeys(fields: FormField[]): string {

        const vars: any = [];

        fields.forEach((field: any) => {
            if (field.type === FieldType.EUID) {
                const facets = field.link.facets?.map((f: any) => f.name).join(' ');
                vars.push(`${field.key} @facets(${facets}) {uid ${field.link.titleField}}`);
            } else if (field.type === FieldType.FILE) {
                vars.push(`${field.key}   {uid ${field.link.titleField}}`);
            } else {
                vars.push(field.key);
            }

        });

        return vars.join(' ');
    }

}