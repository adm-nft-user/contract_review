import TunegoNfts from "../../contracts/TunegoNfts.cdc"

// This scripts returns the number of TunegoNfts currently in existence.

pub fun main(): UInt64 {    
    return TunegoNfts.totalSupply
}
