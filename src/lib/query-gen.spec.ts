import {QueryGen} from './query-gen';
import {ArticleVersion, DataPageConfig, FacetType, FieldType, TextNodeType} from './model';



export const TEST_CONFIG: DataPageConfig = {
    title: 'Time',
    fields: [
        {key: 'uid', title: 'UID', type: FieldType.UID},
        {key: 'rom.time', title: 'Time', type: FieldType.NUMBER},
        {key: 'description', title: 'Description', type: FieldType.STRING},
        {
            key: 'processLink',
            title: 'Process',
            type: FieldType.EUID,
            link: {titleField: 'rom.process', multiple: false, facets: [{name: 'count', type: FacetType.NUMBER}]}
        },
        {key: 'date', title: 'Date', type: FieldType.DATE},
    ],
    commands: ['edit'],
    listQ: 'has(rom.time)'
};

describe('QueryGen', () => {
        it('should create an instance', () => {
            expect(new QueryGen(TEST_CONFIG)).toBeTruthy();
        });


        it('find query correct', () => {
            expect(QueryGen.find('bla', 'rom.time')).toEqual('{ results(func:  regexp(rom.time,/^.*bla.*$/i)) {rom.time uid }}');
        });

        it('any', () => {
            expect(QueryGen.find('bl', 'rom.time')).toEqual('{ results(func:  has(rom.time)) {rom.time uid }}');
        });


        it('update correct', () => {
            const qGen = new QueryGen(TEST_CONFIG);
            const values = {
                'rom.time': 10,
                description: 'test description',
                processLink: [{uid: '0xc38b', 'processLink|count': 10}],
                date: '2021-03-24',
            };
            expect(qGen.update('0xc36b', values)).toEqual(
                '{ set { <0xc36b> <rom.time> "10" . \n' +
                '<0xc36b> <description> "test description" . \n' +
                '<0xc36b> <processLink> <0xc38b> (count=10)  . \n' +
                '<0xc36b> <date> "2021-03-24" . \n' +
                ' }  }');
        });

        it('update correct empty', () => {
            const qGen = new QueryGen(TEST_CONFIG);
            const values = {
                'rom.time': 10,
                description: 'test description',
                processLink: [{uid: ''}],
                date: '2021-03-24',
            };
            expect(qGen.update('0xc36b', values)).toEqual(
                '{ set { <0xc36b> <rom.time> "10" . \n' +
                '<0xc36b> <description> "test description" . \n' +
                '<0xc36b> <date> "2021-03-24" . \n' +
                ' }  }');
        });

        it('new text version correct', () => {
            const values: ArticleVersion = {
                articleId: '32423',
                blocks: [
                    {type: TextNodeType.PARAGRAPH, value: 'first', uid: 'bla'},
                    {type: TextNodeType.PARAGRAPH, value: 'second', before: 'before'}
                ],
            };
            const s = '{ set { _:art <fragment> <32423> . \n' +
                '_:textVersion <version_date>  "2021-09-03T13:22:38.296Z" .\n' +
                '_:art <blocks> <bla> (ord=0) . \n' +
                '_:block1 <type> "PARAGRAPH" . \n' +
                '_:block1 <before> <before> . \n' +
                '_:block1 <data> "second" . \n' +
                '_:art <blocks> _:block1 (ord=1) . \n' +
                ' }  }';
            expect(QueryGen.newTextVersion(values)).toEqual(s);

        });


        it('escape correct', () => {

            const s = '{"pins":[{"name":"pin1","x":20,"y":0}]}';
            const escapeOk = QueryGen.escape(s);
            console.log('ESCAPE OK', escapeOk);
            expect(escapeOk).toEqual('{\\"pins\\":[{\\"name\\":\\"pin1\\",\\"x\\":20,\\"y\\":0}]}');

        });


    }
);
