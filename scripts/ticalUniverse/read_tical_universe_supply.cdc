import TicalUniverse from "../../contracts/TicalUniverse.cdc"

pub fun main(): UInt64 {    
    return TicalUniverse.totalSupply
}
