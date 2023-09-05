const {QueryEngine} = require('@comunica/query-sparql')
const {getSatelliteFromLdpResource, CONSOLID} = require('consolid-daapi')
const {DCAT} = require('@inrupt/vocab-common-rdf')

export async function findReferenceRegistry(projectUrl) {
    const engine = new QueryEngine()
    const sat = await getSatelliteFromLdpResource(projectUrl)

    const q = `
    SELECT ?refReg WHERE {
        <${projectUrl}> <${DCAT.dataset}> ?ds .
        ?ds a <${CONSOLID.ReferenceRegistry}> ;
            <${DCAT.distribution}>/<${DCAT.downloadURL}> ?refReg.
    } LIMIT 1`

    const results = await engine.queryBindings(q, { sources: [sat] })
    const bindings = await results.toArray()
    if (bindings.length) return bindings[0].get('refReg').value
    else throw new Error('could not find reference registry for this project')
}