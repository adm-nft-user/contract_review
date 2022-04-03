import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

// This script returns the size of an account's SaleOffer collection.

pub fun main(account: Address): Int {
    let marketCollectionRef = getAccount(account)
        .getCapability<&TuneGOMarket.Collection{TuneGOMarket.CollectionPublic}>(
             TuneGOMarket.CollectionPublicPath
        )
        .borrow()
        ?? panic("Could not borrow market collection from market address")
    
    return marketCollectionRef.getSaleOfferIDs().length
}
