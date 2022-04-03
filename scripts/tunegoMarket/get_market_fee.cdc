import TuneGOMarket from "../../contracts/TuneGOMarket.cdc"

pub fun main(): TuneGOMarket.MarketFee {

    return TuneGOMarket.getMarketFee()
}
