import {AccessService, DataService, Catalog, CONSOLID, getRoot, getSatelliteFromLdpResource} from 'consolid-daapi'
import { QueryEngine } from '@comunica/query-sparql'
import { ACL, DCAT, DCTERMS, FOAF, RDFS, LDP, RDF } from "@inrupt/vocab-common-rdf";
import { Session as BrowserSession } from "@inrupt/solid-client-authn-browser";
import { Session as NodeSession } from "@inrupt/solid-client-authn-node";
import {v4} from 'uuid'
import Fetch from 'cross-fetch'

interface info {
  webId: string,
  isLoggedIn: boolean
}
interface TokenSession {
  fetch: typeof Fetch,
  info: info
}

export default class ReferenceRegistry {
  public fetch;
  public accessService: AccessService;
  public dataService: DataService;
  public projectId: string;
  public url: string;
  public datasetUrl: string;
  public session: BrowserSession | NodeSession | TokenSession
  public parent: Catalog;
  public queryEngine: any

  constructor(session: BrowserSession | NodeSession | TokenSession, url: string, parent?: Catalog) {
    this.session = session
    this.fetch = session.fetch;
    this.url = url
    this.accessService = new AccessService(session.fetch);
    this.dataService = new DataService(session.fetch);
    this.queryEngine = new QueryEngine()
    if (parent) {
      this.parent = parent
    }
  }

  /**
   * @description create this dataset within the active project
   * @param makePublic initial access rights for the dataset (boolean)
   */
  public async create(parent: Catalog, makePublic: boolean = true): Promise<void> {
    const root = getRoot(this.url)
    this.datasetUrl = root + v4()
    this.parent = parent
    const metadata = new Catalog(this.session, this.datasetUrl)
    await metadata.create(makePublic, [{predicate: RDF.type, object: CONSOLID.ReferenceRegistry}])
    await metadata.addDistribution(this.url)
    await parent.addDataset(this.datasetUrl)
    await metadata.dataService.writeFileToPod(Buffer.from(''), this.url, makePublic, "text/turtle")
  }

  // public async aggregate(concept) {
  //   const satellite = await getSatelliteFromLdpResource(this.url, this.queryEngine)

  //   const query = `PREFIX dcat: <http://www.w3.org/ns/dcat#>
  //   PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  //   PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  //   SELECT ?ref ?document ?ds ?value WHERE {
  //       <${concept}> <${CONSOLID.aggregates}> ?ref .
  //       OPTIONAL {
  //         ?ref <${CONSOLID.hasIdentifier}> ?id .
  //         ?id <${CONSOLID.inDocument}> ?document ;
  //           <https://schema.org/value> ?value .
  //         ?ds dcat:distribution/dcat:downloadURL ?document .
  //     }
  //   }`
  //   const checked:any = new Set()
  //   const all:any = new Set()
    
  //   const sources: any = await this.aggregateSparqlEndpoints()
  //   const data = await this.queryEngine.queryBindings(query, {sources, session: this.session})
  //   const bindings = await data.toArray().then(async (i) => {
  //     for (const v of i) {
  //     if (!v.get('id').value) { // the reference is external => an aggregated concept
  //       const externalReference = v.get('ref').value
  //       if (!checked.has(externalReference)) {
  //         const sat = await getSatelliteFromLdpResource(externalReference)
  //         const data = await this.queryEngine.queryBindings(query, {sources, session: this.session})
  //         checked.add(externalReference)
  //       }
  //     } else {
  //     }
  //   }})
  //   // const satellites = new Set()

  //   // for (const ds of bindings) {
  //   //   const sat = await getSatelliteFromLdpResource(ds, this.queryEngine)
  //   //   all.add(ds)
  //   //   satellites.add(sat)
  //   // }
    
  //   // const s = Array.from(satellites)
  //   // const d = await this.queryEngine.queryBindings(query, {sources: s, session: this.session})
  //   // const localDatasets = await d.toArray().then(i => i.map(v => v.get('ds').value))
  //   // localDatasets.forEach(ds => all.add(ds))

  //   // return Array.from(all)
  // }

  // public async findConceptByIdentifier(identifier, document) {

  // }

  public async createConcept(concept = this.url + "#" + v4()) {
    let query = `INSERT DATA {
      <${concept}> a <${CONSOLID.Concept}> .
    }`
    await this.update(query)
    return concept
  }

  public async registerAggregatedConcept(concept, aggregatedConcept) {
    let query = `INSERT DATA {
      <${concept}> <${CONSOLID.aggregates}> <${aggregatedConcept}> .
    }`
    await this.update(query)
  }

  public async createReference(concept, reference= getRoot(this.url) + v4(), document, identifier) {
    const id = getRoot(this.url) + v4() 

    const now = new Date()

    let query = `INSERT DATA {
      <${concept}> <${CONSOLID.aggregates}> <${reference}> .
      <${reference}> <${DCTERMS.created}> "${now}";
        <${CONSOLID.hasIdentifier}> <${id}> .
      <${id}> <https://schema.org/value> "${identifier}" ;
        <${CONSOLID.inDocument}> <${document}> .
    }`
   
    await this.update(query)
    return reference
  }

  public async deleteReference(reference) {
    const query = `DELETE WHERE {
    ?concept <${CONSOLID.aggregates}> <${reference}> .
      <${reference}> ?p ?o .
      ?o ?predicate ?object .
  }`
    await this.update(query)
  }

  public async deleteConcept(concept) {
    console.log('concept', concept)
    const query = `DELETE WHERE {
    <${concept}> a <${CONSOLID.Concept}> .
      ?concept ?b ?c .
      ?c ?p ?o .
      ?o ?predicate ?object .
}`
    await this.update(query)

    const orphanConcept = `DELETE WHERE {
      <${concept}> a <${CONSOLID.Concept}> .
    }`
      await this.update(orphanConcept)
  }

  public async findConceptByIdentifier(activeDocument, selectedElement) {
    const engine = this.queryEngine
    const endpoints = await this.parent.aggregateSparqlEndpoints()

    // find which of the satellites has a matching concept, and find its aggregations
    const obj:any = {references: []}
    const aliases:any = new Set()
    const included = new Set()
    const checked = new Set()
    for (const sat of endpoints) {
        const q = `SELECT * WHERE {
            <${sat.alias}> <${DCAT.dataset}> ?ds .
            ?ds a <${CONSOLID.ReferenceRegistry}> ;
            <${DCAT.distribution}>/<${DCAT.downloadURL}> ?ref .
                ?concept a <${CONSOLID.Concept}> ;
                    <${CONSOLID.aggregates}> ?reference, ?aggr .
                ?reference <${CONSOLID.hasIdentifier}> ?id .
                ?id <${CONSOLID.inDocument}> <${activeDocument}>;
                    <https://schema.org/value> "${selectedElement}".
            ?meta <${DCAT.distribution}>/<${DCAT.downloadURL}> <${activeDocument}> .
        }`
        const results = await engine.queryBindings(q, { sources: [sat.satellite] })
        const bindings = await results.toArray()
        for (const b of bindings) {
            if (!b.get('concept').value.includes('?graph')) {
              if (!included.has(b.get('reference').value)) {
                obj.references.push({
                  document: activeDocument,
                  identifier: selectedElement,
                  meta: b.get('meta').value,
                  reference: b.get('reference').value
              })
              included.add(b.get('reference').value)

            }

                checked.add(b.get('concept').value)
                aliases.add(b.get('aggr') && b.get('aggr').value)
            }
        }
    }

    for (const alias of aliases) {
        const sparql = await getSatelliteFromLdpResource(alias)
        const q = `SELECT * WHERE {
            <${alias}> a <${CONSOLID.Concept}> ;
                    <${CONSOLID.aggregates}> ?reference .
                ?reference <${CONSOLID.hasIdentifier}> ?id .
                ?id <${CONSOLID.inDocument}> ?doc;
                    <https://schema.org/value> ?identifier.
                
            ?meta <${DCAT.distribution}>/<${DCAT.downloadURL}> ?doc .
        }`
        const results = await engine.queryBindings(q, { sources: [sparql] })
        const aliasB = await results.toArray()
        for (const b of aliasB) {
          if (!included.has(b.get('reference').value))
                obj.references.push({
                    document: b.get('doc').value,
                    identifier: b.get('identifier').value,
                    meta: b.get('meta').value,
                    reference: b.get('reference').value
                })
                included.add(b.get('reference').value)
                checked.add(alias)
        }
    }

    obj.aliases = Array.from(checked)
    return obj

  }

  /**
   * @description Update the dataset with SPARQL (dangerous - watch out!)
   * @param query The SPARQL query with which to update the dataset
   */
  public async update(query) {
    await this.dataService.sparqlUpdate(this.url, query)
  }
}

