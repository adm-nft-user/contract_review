import TuneGONFT from "../../contracts/TuneGONFT.cdc"

// This scripts returns the number of TuneGONFT currently in existence.

pub fun main(): UInt64 {    
    return TuneGONFT.totalSupply
}
