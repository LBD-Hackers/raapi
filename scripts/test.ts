import { generateSession, Catalog, LBDS } from "consolid-daapi"
import {ReferenceRegistry} from '../src'
import {v4} from 'uuid'
import { RDF } from "@inrupt/vocab-common-rdf";
import fs from 'fs'

let session: any;

const stakeholder = {
  webId: "http://localhost:3000/jeroen/profile/card#me",
  options: {
    name: "jwtoken",
    email: "jeroen.werbrouck@ugent.be",
    password: "test123",
    idp: "http://localhost:3000",
  }
}

const root = stakeholder.webId.replace("profile/card#me", "")
async function run() {
    session = await generateSession(stakeholder.options, stakeholder.webId)
    const refRegUrl = "http://localhost:3000/jeroen/14ed5783-09c1-4bcb-b468-afef4bda73a5"
    const refReg = new ReferenceRegistry(session, refRegUrl)

    const document = root + "85573c20-c055-4527-92f5-2bfbbf93c223"
    const concept = "http://localhost:3000/jeroen/b728ebfe-108d-4790-b7a6-e14c9db23a27"
    const identifier = "2O2Fr$t4X7Zf8NOew3FKcz"
    // await refReg.createReference(concept, document, identifier)
}

async function createProject() {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const url = root + v4()
  const project = new Catalog(session, url)
  await project.create(true, [{predicate: RDF.type, object: LBDS.Project}])
  console.log('project.url', project.url)
  return project.url
}

async function addDatasetToProject(url) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const project = new Catalog(session, url)
  const dsUrl = root + v4()
  console.log('dsUrl', dsUrl)
  await project.addDataset(dsUrl)
}

async function addDistributionToDataset(url, path, mime) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)

  const distUrl = root + v4()
  const ds = new Catalog(session, url)
  await ds.addDistribution(distUrl)

  const buff = fs.readFileSync(path);
  await ds.dataService.writeFileToPod(buff, distUrl, true, mime)
}

async function createReferenceRegistry(projectUrl) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const project = new Catalog(session, projectUrl)
  const refRegUrl = root + v4()
  console.log('refRegUrl', refRegUrl)
  const refReg = new ReferenceRegistry(session, refRegUrl)
  await refReg.create(project, true)
}

async function createConceptInRefReg(url) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const refReg = new ReferenceRegistry(session, url)
  const conceptUrl = "http://localhost:3000/jeroen/a737edbb-de8e-4858-b097-211357ed95d3"
  const concept = await refReg.createConcept(conceptUrl)
  console.log('concept', concept)
}

async function createReferenceForConcept(refreg, conceptUrl, distributionUrl, identifier) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const refReg = new ReferenceRegistry(session, refreg)
  const referenceUrl = "http://localhost:3000/jeroen/b5543632-431d-4cee-a176-3b488d52eb9b"
  await refReg.createReference(conceptUrl, referenceUrl, distributionUrl, identifier)
}

async function deleteReferenceOfConcept(refreg, reference) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const refReg = new ReferenceRegistry(session, refreg)
  await refReg.deleteReference(reference)
}

async function deleteConcept(refreg, concept) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const refReg = new ReferenceRegistry(session, refreg)
  await refReg.deleteConcept(concept)
}

async function getAllReferencesOfConcept(refreg, concept) {
  const session = await generateSession(stakeholder.options, stakeholder.webId)
  const refReg = new ReferenceRegistry(session, refreg)
  await refReg.aggregate(concept)

}

const projectUrl = "http://localhost:3000/jeroen/389ae28b-7534-40f0-9f05-89390f3f3231"
const datasetUrl = "http://localhost:3000/jeroen/feb4370b-7125-4385-ae71-c6d5ef4d97de"
const distributionUrl = "http://localhost:3000/jeroen/e2bf5890-3d30-404c-8e44-e359257e5f0b"
const refRegUrl = "http://localhost:3000/jeroen/415c0d6d-086e-4371-8bc0-14a116b9898a"
const conceptUrl = "http://localhost:3000/jeroen/a737edbb-de8e-4858-b097-211357ed95d3"
const identifier = "1hOSvn6df7F8_7GcBWlRqU"
const referenceUrl = "http://localhost:3000/jeroen/b5543632-431d-4cee-a176-3b488d52eb9b"

const mime = "model/gltf+json"
const path = "C:/Users/Administrator/OneDrive - UGent/Algemeen/publicaties/SWJ_LBDserver/code/api/raapi/tests/artifacts/duplex.gltf"

console.log("starting")
// createConceptInRefReg(projectUrl)
// createReferenceForConcept(refRegUrl, conceptUrl, distributionUrl, identifier)
getAllReferencesOfConcept(refRegUrl, conceptUrl)


// deleteReferenceOfConcept(refRegUrl, referenceUrl)
// deleteConcept(refRegUrl, conceptUrl)
