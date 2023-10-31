import { AccessService, DataService, Catalog } from 'consolid-daapi';
import { Session as BrowserSession } from "@inrupt/solid-client-authn-browser";
import { Session as NodeSession } from "@inrupt/solid-client-authn-node";
import Fetch from 'cross-fetch';
interface info {
    webId: string;
    isLoggedIn: boolean;
}
interface TokenSession {
    fetch: typeof Fetch;
    info: info;
}
export default class ReferenceRegistry {
    fetch: any;
    accessService: AccessService;
    dataService: DataService;
    projectId: string;
    url: string;
    datasetUrl: string;
    session: BrowserSession | NodeSession | TokenSession;
    parent: Catalog;
    queryEngine: any;
    constructor(session: BrowserSession | NodeSession | TokenSession, url: string, parent?: Catalog);
    /**
     * @description create this dataset within the active project
     * @param makePublic initial access rights for the dataset (boolean)
     */
    create(parent: Catalog, makePublic?: boolean): Promise<void>;
    createConcept(concept?: string): Promise<string>;
    registerAggregatedConcept(concept: any, aggregatedConcept: any): Promise<void>;
    createReference(concept: any, reference: string, document: any, identifier: any, conformance: any): Promise<string>;
    deleteReference(reference: any): Promise<void>;
    deleteConcept(concept: any): Promise<void>;
    findConceptByIdentifier(activeDocument: any, selectedElement: any): Promise<any>;
    /**
     * @description Update the dataset with SPARQL (dangerous - watch out!)
     * @param query The SPARQL query with which to update the dataset
     */
    update(query: any): Promise<void>;
}
export {};
//# sourceMappingURL=ReferenceRegistry.d.ts.map