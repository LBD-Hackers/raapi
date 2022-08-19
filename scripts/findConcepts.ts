import { Session } from "@inrupt/solid-client-authn-node"
import { Catalog } from "consolid-daapi"
import { ReferenceRegistry } from "../src"

async function check() {
    // const session = await generateSession(user, user.webId)
    const session = new Session
        // we have selected the following element in the 3D viewer 
        const activeDocument = "http://localhost:3000/engineer/f177466f-5929-445f-b2d7-ee19576c7d3a"
        const selectedElement = "2O2Fr$t4X7Zf8NOew3FLOH"
        const url = "http://localhost:3000/fm/fb3d5bcd-8bcb-4d46-be2b-6c3ef824d5d9"
        const refRegUrl =  "http://localhost:3000/fm/44d0aea1-0c34-455f-a14f-0a96fa8a7b58"
        const project = new Catalog(session, url)
        const refReg = new ReferenceRegistry(session, refRegUrl, project)
        const references = await refReg.findConceptByIdentifier(activeDocument, selectedElement)
console.log('references', references)
}


const now = new Date()
check().then(() => {
    const end = new Date()
    console.log("duration: ", end.getTime() - now.getTime())
})