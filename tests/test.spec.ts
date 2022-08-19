import { Catalog, generateSession, DataService } from "daapi";
import {v4} from 'uuid'
import * as path from "path";
import fs from "fs";

import { DCAT, DCTERMS, LDP, RDF, RDFS, VOID } from "@inrupt/vocab-common-rdf";
import { ReferenceRegistry } from "../src";
const QueryEngine = require('@comunica/query-sparql').QueryEngine

const filePath1 = path.join(__dirname, "./artifacts/duplex.gltf");
const fileUpload1 = fs.readFileSync(filePath1);

let session: any;
let cat1: Catalog;
let url1: string;

let cat2: Catalog;
let url2: string;

let url3: string;

let refReg: ReferenceRegistry;
let refRegUrl: string;
let concept: string;
let reference: string;

const engine = new QueryEngine()

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

beforeAll(async () => {
  session = await generateSession(stakeholder.options, stakeholder.webId)
  // session = await generateSession(stakeholder.options, stakeholder.webId)
});


describe("Auth", () => {

  test("is logged in", () => {
    expect(session.info.isLoggedIn).toBe(true);
  });

  test("can create Catalog", async () => {
    url1 = root + v4()
    cat1 = new Catalog(session, url1)
    await cat1.create(true)
    console.log('url1', url1)
    const response = await session.fetch(url1)
    expect(response.status).toBe(200)
  })

  test("can create Catalog 2", async () => {
    url2 = root + v4()
    cat2 = new Catalog(session, url2)
    await cat2.create(true)

    const response = await session.fetch(url2)
    expect(response.status).toBe(200)
  })

  test("can add Catalog2 as a dataset to Catalog1", async () => {
    await cat1.addDataset(url2)
    const ok = await engine.queryBoolean(`ASK {<${url1}> <${DCAT.dataset}> <${url2}> }`, {sources: [url1], fetch: session.fetch})
    expect(ok).toBe(true)
  })

  test("can upload new File and add as distribution to catalog 2", async () => {
    const dataservice = new DataService(session.fetch)
    url3 = root + v4()
    await dataservice.writeFileToPod(fileUpload1, url3, true, "model/gltf+json")

    await cat2.addDistribution(url3)
    const ok = await engine.queryBoolean(`ASK {<${url2}> <${DCAT.distribution}> <${url3}>. }`, {sources: [url2], fetch: session.fetch})
    expect(ok).toBe(true)
  })

  test("can create reference registry") {
    refRegUrl = root + v4()
    console.log('refRegUrl', refRegUrl)
    refReg = new ReferenceRegistry(session, refRegUrl)
    await refReg.create(cat1, true)
  }

  test("can add concept to Ref Reg") {
    concept = await refReg.createConcept()
  }

  test("can add reference to concept") {
    await refReg.createReference(concept, url3, "2O2Fr$t4X7Zf8NOew3FKcz")
  }

  // test("can retrieve recursive DCAT structure of catalog 1", async() => {

  //   const result = await cat1.get()
  //   console.log('result', result)
  // })
})
