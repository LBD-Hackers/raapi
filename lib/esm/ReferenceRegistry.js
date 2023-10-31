"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _consolidDaapi = require("consolid-daapi");

var _querySparql = require("@comunica/query-sparql");

var _vocabCommonRdf = require("@inrupt/vocab-common-rdf");

var _uuid = require("uuid");

var _consolidVocabulary = _interopRequireDefault(require("consolid-vocabulary"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ReferenceRegistry {
  constructor(session, url, parent) {
    this.session = session;
    this.fetch = session.fetch;
    this.url = url;
    this.accessService = new _consolidDaapi.AccessService(session.fetch);
    this.dataService = new _consolidDaapi.DataService(session.fetch);
    this.queryEngine = new _querySparql.QueryEngine();

    if (parent) {
      this.parent = parent;
    }
  }
  /**
   * @description create this dataset within the active project
   * @param makePublic initial access rights for the dataset (boolean)
   */


  async create(parent, makePublic = true) {
    const root = (0, _consolidDaapi.getRoot)(this.url);
    this.datasetUrl = root + (0, _uuid.v4)();
    this.parent = parent;
    const metadata = new _consolidDaapi.Catalog(this.session, this.datasetUrl);
    await metadata.create(makePublic, [{
      predicate: _vocabCommonRdf.RDF.type,
      object: _consolidVocabulary.default.ReferenceRegistry
    }]);
    await metadata.addDistribution(this.url);
    await parent.addDataset(this.datasetUrl);
    await metadata.dataService.writeFileToPod(Buffer.from(''), this.url, makePublic, "text/turtle");
  } // public async aggregate(concept) {
  //   const satellite = await getSatelliteFromLdpResource(this.url, this.queryEngine)
  //   const query = `PREFIX dcat: <http://www.w3.org/ns/dcat#>
  //   PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  //   PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  //   SELECT ?ref ?document ?ds ?value WHERE {
  //       <${concept}> <${CONSOLID.aggregates}> ?ref .
  //       OPTIONAL {
  //         ?ref <${CONSOLID.hasIdentifier}> ?id .
  //         ?id <${CONSOLID.inDocument}> ?document ;
  //           rdf:value ?value .
  //         ?ds dcat:distribution/dcat:accessURL ?document .
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


  async createConcept(concept = this.url + "#" + (0, _uuid.v4)()) {
    let query = `INSERT DATA {
      <${concept}> a <${_consolidVocabulary.default.ReferenceCollection}> .
    }`;
    await this.update(query);
    return concept;
  }

  async registerAggregatedConcept(concept, aggregatedConcept) {
    let query = `INSERT DATA {
      <${concept}> <${_consolidVocabulary.default.aggregates}> <${aggregatedConcept}> .
    }`;
    await this.update(query);
  }

  async createReference(concept, reference = (0, _consolidDaapi.getRoot)(this.url) + (0, _uuid.v4)(), document, identifier, conformance) {
    const id = (0, _consolidDaapi.getRoot)(this.url) + (0, _uuid.v4)();
    const now = new Date();
    let query = `
    PREFIX oa: <http://www.w3.org/ns/oa#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dct: <http://purl.org/dc/terms/>
    INSERT DATA {
      <${concept}> <${_consolidVocabulary.default.aggregates}> <${reference}> .
      <${reference}> <${_vocabCommonRdf.DCTERMS.created}> "${now}";
        oa:hasSelector <${id}> ;
        oa:hasSource <${document}> .
      <${id}> rdf:value "${identifier}" ;
        dct:conformsTo "${conformance}" .
    }`;
    await this.update(query);
    return reference;
  }

  async deleteReference(reference) {
    const query = `DELETE WHERE {
    ?concept <${_consolidVocabulary.default.aggregates}> <${reference}> .
      <${reference}> ?p ?o .
      ?o ?predicate ?object .
  }`;
    await this.update(query);
  }

  async deleteConcept(concept) {
    console.log('concept', concept);
    const query = `DELETE WHERE {
    <${concept}> a <${_consolidVocabulary.default.ReferenceCollection}> .
      ?concept ?b ?c .
      ?c ?p ?o .
      ?o ?predicate ?object .
}`;
    await this.update(query);
    const orphanConcept = `DELETE WHERE {
      <${concept}> a <${_consolidVocabulary.default.ReferenceCollection}> .
    }`;
    await this.update(orphanConcept);
  }

  async findConceptByIdentifier(activeDocument, selectedElement) {
    const engine = this.queryEngine;
    const endpoints = await this.parent.aggregateSparqlEndpoints(); // find which of the satellites has a matching concept, and find its aggregations

    const obj = {
      references: []
    };
    const aliases = new Set();
    const included = new Set();
    const checked = new Set();

    for (const sat of endpoints) {
      const q = `
        PREFIX oa: <http://www.w3.org/ns/oa#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT * WHERE {
            <${sat.alias}> <${_vocabCommonRdf.DCAT.dataset}> ?ds .
            ?ds a <${_consolidVocabulary.default.ReferenceRegistry}> ;
            <${_vocabCommonRdf.DCAT.distribution}>/<${_vocabCommonRdf.DCAT.accessURL}> ?ref .
                ?concept a <${_consolidVocabulary.default.ReferenceCollection}> ;
                    <${_consolidVocabulary.default.aggregates}> ?reference, ?aggr .
                ?reference oa:hasSelector ?id ;
                  oa:hasSource <${activeDocument}> .
                ?id rdf:value "${selectedElement}".
            ?meta <${_vocabCommonRdf.DCAT.distribution}>/<${_vocabCommonRdf.DCAT.accessURL}> <${activeDocument}> .
        }`;
      const results = await engine.queryBindings(q, {
        sources: [sat.satellite]
      });
      const bindings = await results.toArray();

      for (const b of bindings) {
        if (!b.get('concept').value.includes('?graph')) {
          if (!included.has(b.get('reference').value)) {
            obj.references.push({
              document: activeDocument,
              identifier: selectedElement,
              meta: b.get('meta').value,
              reference: b.get('reference').value
            });
            included.add(b.get('reference').value);
          }

          checked.add(b.get('concept').value);
          aliases.add(b.get('aggr') && b.get('aggr').value);
        }
      }
    }

    for (const alias of aliases) {
      const sparql = await (0, _consolidDaapi.getSatelliteFromLdpResource)(alias);
      const q = `
        PREFIX oa: <http://www.w3.org/ns/oa#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT * WHERE {
            <${alias}> a <${_consolidVocabulary.default.ReferenceCollection}> ;
                    <${_consolidVocabulary.default.aggregates}> ?reference .
                ?reference oa:hasSelector ?id ;
                  oa:hasSource ?doc;
                ?id rdf:value ?identifier.
                
            ?meta <${_vocabCommonRdf.DCAT.distribution}>/<${_vocabCommonRdf.DCAT.accessURL}> ?doc .
        }`;
      const results = await engine.queryBindings(q, {
        sources: [sparql]
      });
      const aliasB = await results.toArray();

      for (const b of aliasB) {
        if (!included.has(b.get('reference').value)) obj.references.push({
          document: b.get('doc').value,
          identifier: b.get('identifier').value,
          meta: b.get('meta').value,
          reference: b.get('reference').value
        });
        included.add(b.get('reference').value);
        checked.add(alias);
      }
    }

    obj.aliases = Array.from(checked);
    return obj;
  }
  /**
   * @description Update the dataset with SPARQL (dangerous - watch out!)
   * @param query The SPARQL query with which to update the dataset
   */


  async update(query) {
    await this.dataService.sparqlUpdate(this.url, query);
  }

}

exports.default = ReferenceRegistry;
//# sourceMappingURL=ReferenceRegistry.js.map