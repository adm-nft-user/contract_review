/** 
  This transaction is for local development purposes only.
  It provides test util for automated tests.
*/

import FlowManager  from "../../contracts/FlowManager.cdc"

transaction(name: String, address: Address) {
    prepare(signer: AuthAccount){
        let linkPath = FlowManager.contractManagerPath
        let contractManager = signer
                                .getCapability(linkPath)!
                                .borrow<&FlowManager.Mapper>()!
        contractManager.setAddress(name, address: address)
    }
}