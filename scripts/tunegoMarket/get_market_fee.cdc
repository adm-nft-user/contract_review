import TunegoMarket from "../../contracts/TunegoMarket.cdc"

pub fun main(): TunegoMarket.MarketFee {

    return TunegoMarket.getMarketFee()
}
