import TunegoMarket from "../../contracts/TunegoMarket.cdc"

// This script returns the size of an account's SaleOffer collection.

pub fun main(account: Address): Int {
    let marketCollectionRef = getAccount(account)
        .getCapability<&TunegoMarket.Collection{TunegoMarket.CollectionPublic}>(
             TunegoMarket.CollectionPublicPath
        )
        .borrow()
        ?? panic("Could not borrow market collection from market address")
    
    return marketCollectionRef.getSaleOfferIDs().length
}
