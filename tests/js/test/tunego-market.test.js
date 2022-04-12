import path from "path";
import {
  init,
  getAccountAddress,
  shallPass,
  shallRevert,
  mintFlow,
  emulator,
} from "flow-js-testing";
import {
  getTuneGOAddress,
  getTuneGOAdminAddress,
  toUFix64,
} from "../src/common";
import {
  deployTuneGONFT,
  getTuneGONFTCollectionLength,
  mintRandomTuneGONFT,
  setupTuneGONFTOnAccount,
} from "../src/tunego-nft";
import {
  acceptSaleOffer,
  deployMarket,
  createSaleOffer,
  removeSaleOffer,
  getMarketCollectionLength,
  setupTuneGOMarketOnAccount,
  TUNEGO_FEE_PERCENTAGE,
  TUNEGO_NFTS_CONTRACT_NAME,
  TUNEGO_CONTRACT_NAME,
  TICAL_UNIVERSE_CONTRACT_NAME,
  getSaleOfferIdFromTransactionResult,
  transferAdminResource,
  createAdminResource,
  addSupportedNFTType,
  getMarketFee,
  setTuneGOFee,
  createSaleOfferLegacy,
  acceptSaleOfferLegacy,
} from "../src/tunego-market";
import { getFlowTokenBalance } from "../src/flow-token";
import {
  mintTicalUniverse,
  setupTicalUniverseItems,
} from "../src/tical-universe";
import { mintTuneGO, setupTuneGOItems } from "../src/tunego";

describe("TuneGO Market", () => {
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../../../");
    const port = 9080;
    const logging = false;

    await init(basePath, { port });
    await emulator.start(port, logging);
  });

  afterEach(async () => {
    await emulator.stop();
  });

  it("should deploy TuneGOMarket contract", async () => {
    await shallPass(deployMarket());
  });

  it("should be possible to create an empty TuneGOMarket Collection", async () => {
    await deployMarket();
    const Seller = await getAccountAddress("Seller");

    await shallPass(setupTuneGOMarketOnAccount(Seller));
  });

  it("should be possible to create SaleOffer with legacy NFTs", async () => {
    await deployMarket();
    await setupTuneGOItems();
    await setupTicalUniverseItems();

    const Seller = await getAccountAddress("Seller");
    await mintTuneGO(Seller);
    await mintTicalUniverse(Seller);

    await shallPass(
      createSaleOfferLegacy(Seller, TUNEGO_CONTRACT_NAME, 1, toUFix64(1.11))
    );
    await shallPass(
      createSaleOfferLegacy(
        Seller,
        TICAL_UNIVERSE_CONTRACT_NAME,
        1,
        toUFix64(1.11)
      )
    );
  });

  it("should not be possible to create SaleOffer with unsupported NFT type", async () => {
    await deployMarket();
    await deployTuneGONFT();

    const Seller = await getAccountAddress("Seller");
    await setupTuneGONFTOnAccount(Seller);
    await mintRandomTuneGONFT(Seller);

    await shallRevert(
      createSaleOffer(Seller, TUNEGO_NFTS_CONTRACT_NAME, 0, toUFix64(1.11))
    );
  });

  it("should be possible to create SaleOffer with unsupported NFT after adding it as supported type", async () => {
    await deployMarket();
    await deployTuneGONFT();

    const Seller = await getAccountAddress("Seller");
    await setupTuneGONFTOnAccount(Seller);
    await mintRandomTuneGONFT(Seller);

    await shallPass(addSupportedNFTType());
    await shallPass(
      createSaleOffer(Seller, TUNEGO_NFTS_CONTRACT_NAME, 0, toUFix64(1.11))
    );
  });

  it("should be possible to change MarketFee", async () => {
    await deployMarket();
    const TuneGO = await getTuneGOAddress();

    const [initialMarketFee] = await getMarketFee();
    expect(initialMarketFee.receiver).toEqual(TuneGO);
    expect(Number(initialMarketFee.percentage)).toEqual(TUNEGO_FEE_PERCENTAGE);

    const newReceiver = await getAccountAddress("NewReceiver");
    const newPercentage = 5.0;
    await shallPass(setTuneGOFee(newReceiver, toUFix64(newPercentage)));

    const [newMarketFee] = await getMarketFee();
    expect(newMarketFee.receiver).toEqual(newReceiver);
    expect(Number(newMarketFee.percentage)).toEqual(newPercentage);
  });

  it("should only apply new market fee for new sale offers", async () => {
    await deployMarket();
    await deployTuneGONFT();
    const Seller = await getAccountAddress("Seller");
    const Buyer = await getAccountAddress("Buyer");
    const TuneGO = await getTuneGOAddress();

    await addSupportedNFTType();
    await mintRandomTuneGONFT(Seller, 2);
    await mintFlow(Buyer, toUFix64(1000));

    const [initialMarketFee] = await getMarketFee();
    expect(initialMarketFee.receiver).toEqual(TuneGO);
    expect(Number(initialMarketFee.percentage)).toEqual(TUNEGO_FEE_PERCENTAGE);

    const nftPrice = 100.0;
    const tunegoFee = (nftPrice * TUNEGO_FEE_PERCENTAGE) / 100;
    const [transactionResult] = await createSaleOffer(
      Seller,
      TUNEGO_NFTS_CONTRACT_NAME,
      0,
      toUFix64(nftPrice)
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    const newReceiver = await getAccountAddress("NewReceiver");
    const newPercentage = 5.0;
    const newTuneGOFee = (nftPrice * newPercentage) / 100;
    await shallPass(setTuneGOFee(newReceiver, toUFix64(newPercentage)));

    const [buyerBalanceBefore] = await getFlowTokenBalance(Buyer);
    const [sellerBalanceBefore] = await getFlowTokenBalance(Seller);
    const [tunegoBalanceBefore] = await getFlowTokenBalance(TuneGO);

    await shallPass(
      acceptSaleOffer(Buyer, TUNEGO_NFTS_CONTRACT_NAME, saleOfferId, Seller)
    );

    const [buyerBalanceAfter] = await getFlowTokenBalance(Buyer);
    const [sellerBalanceAfter] = await getFlowTokenBalance(Seller);
    const [tunegoBalanceAfter] = await getFlowTokenBalance(TuneGO);

    expect(Number(buyerBalanceAfter)).toBeCloseTo(
      Number(buyerBalanceBefore) - nftPrice,
      6
    );
    expect(Number(sellerBalanceAfter)).toBeCloseTo(
      Number(sellerBalanceBefore) + nftPrice - tunegoFee,
      6
    );
    expect(Number(tunegoBalanceAfter)).toBeCloseTo(
      Number(tunegoBalanceBefore) + tunegoFee,
      6
    );

    const [newTransactionResult] = await createSaleOffer(
      Seller,
      TUNEGO_NFTS_CONTRACT_NAME,
      1,
      toUFix64(nftPrice)
    );
    const newSaleOfferId =
      getSaleOfferIdFromTransactionResult(newTransactionResult);

    const [newBuyerBalanceBefore] = await getFlowTokenBalance(Buyer);
    const [newSellerBalanceBefore] = await getFlowTokenBalance(Seller);
    const [newTuneGOBalanceBefore] = await getFlowTokenBalance(TuneGO);
    const [newReceiverBalanceBefore] = await getFlowTokenBalance(newReceiver);

    await shallPass(
      acceptSaleOffer(Buyer, TUNEGO_NFTS_CONTRACT_NAME, newSaleOfferId, Seller)
    );

    const [newBuyerBalanceAfter] = await getFlowTokenBalance(Buyer);
    const [newSellerBalanceAfter] = await getFlowTokenBalance(Seller);
    const [newTuneGOBalanceAfter] = await getFlowTokenBalance(TuneGO);
    const [newReceiverBalanceAfter] = await getFlowTokenBalance(newReceiver);

    expect(Number(newBuyerBalanceAfter)).toBeCloseTo(
      Number(newBuyerBalanceBefore) - nftPrice,
      6
    );
    expect(Number(newSellerBalanceAfter)).toBeCloseTo(
      Number(newSellerBalanceBefore) + nftPrice - newTuneGOFee,
      6
    );
    expect(Number(newTuneGOBalanceAfter)).toBeCloseTo(
      Number(newTuneGOBalanceBefore),
      6
    );
    expect(Number(newReceiverBalanceAfter)).toBeCloseTo(
      Number(newReceiverBalanceBefore) + newTuneGOFee,
      6
    );
  });

  it("should not be possible create sale offer with fees >= 100%", async () => {
    const Seller = await getAccountAddress("Seller");
    const Recipient1 = await getAccountAddress("Recipient1");
    const Recipient2 = await getAccountAddress("Recipient2");

    await deployMarket();
    await deployTuneGONFT();
    await addSupportedNFTType();
    await mintRandomTuneGONFT(Seller, 2);

    const nftPrice = 100.0;

    await shallRevert(
      createSaleOffer(
        Seller,
        TUNEGO_NFTS_CONTRACT_NAME,
        0,
        toUFix64(nftPrice),
        [
          { receiver: Recipient1, percentage: 50 - TUNEGO_FEE_PERCENTAGE },
          { receiver: Recipient2, percentage: 50 },
        ]
      )
    );
    await shallPass(
      createSaleOffer(
        Seller,
        TUNEGO_NFTS_CONTRACT_NAME,
        0,
        toUFix64(nftPrice),
        [
          { receiver: Recipient1, percentage: 44.99 - TUNEGO_FEE_PERCENTAGE },
          { receiver: Recipient2, percentage: 50 },
        ]
      )
    );
  });

  it("should be possible to accept TuneGONFT SaleOffer", async () => {
    const Seller = await getAccountAddress("Seller");
    const Buyer = await getAccountAddress("Buyer");
    const TuneGO = await getTuneGOAddress();

    await deployMarket();
    await deployTuneGONFT();
    await addSupportedNFTType();
    await mintRandomTuneGONFT(Seller, 2);
    await mintFlow(Buyer, toUFix64(1000));

    const nftPrice = 100.0;
    const tunegoFee = (nftPrice * TUNEGO_FEE_PERCENTAGE) / 100;
    const [transactionResult] = await createSaleOffer(
      Seller,
      TUNEGO_NFTS_CONTRACT_NAME,
      0,
      toUFix64(nftPrice)
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    const [itemsListed] = await getMarketCollectionLength(Seller);
    expect(itemsListed).toBe(1);

    const [buyerBalanceBefore] = await getFlowTokenBalance(Buyer);
    const [sellerBalanceBefore] = await getFlowTokenBalance(Seller);
    const [tunegoBalanceBefore] = await getFlowTokenBalance(TuneGO);

    await shallPass(
      acceptSaleOffer(Buyer, TUNEGO_NFTS_CONTRACT_NAME, saleOfferId, Seller)
    );

    const [buyerBalanceAfter] = await getFlowTokenBalance(Buyer);
    const [sellerBalanceAfter] = await getFlowTokenBalance(Seller);
    const [tunegoBalanceAfter] = await getFlowTokenBalance(TuneGO);

    expect(Number(buyerBalanceAfter)).toBeCloseTo(
      Number(buyerBalanceBefore) - nftPrice,
      6
    );
    expect(Number(sellerBalanceAfter)).toBeCloseTo(
      Number(sellerBalanceBefore) + nftPrice - tunegoFee,
      6
    );
    expect(Number(tunegoBalanceAfter)).toBeCloseTo(
      Number(tunegoBalanceBefore) + tunegoFee,
      6
    );

    const [buyerCollectionLength] = await getTuneGONFTCollectionLength(Buyer);
    const [sellerCollectionLength] = await getTuneGONFTCollectionLength(Seller);
    expect(buyerCollectionLength).toBe(1);
    expect(sellerCollectionLength).toBe(1);
  });

  it("should be possible to accept TuneGO SaleOffer", async () => {
    const seller = await getAccountAddress("seller");
    const buyer = await getAccountAddress("buyer");

    await deployMarket();
    await setupTuneGOItems();
    await mintTuneGO(seller, 2);
    await mintFlow(buyer, toUFix64(1000));

    const nftPrice = 100.0;
    const [transactionResult] = await createSaleOfferLegacy(
      seller,
      TUNEGO_CONTRACT_NAME,
      1,
      toUFix64(nftPrice)
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    await shallPass(
      acceptSaleOfferLegacy(buyer, TUNEGO_CONTRACT_NAME, saleOfferId, seller)
    );
  });

  it("should be possible to accept TicalUniverse SaleOffer", async () => {
    const Seller = await getAccountAddress("Seller");
    const Buyer = await getAccountAddress("Buyer");

    await deployMarket();
    await setupTicalUniverseItems();
    await mintTicalUniverse(Seller, 2);
    await mintFlow(Buyer, toUFix64(1000));

    const nftPrice = 100.0;
    const [transactionResult] = await createSaleOfferLegacy(
      Seller,
      TICAL_UNIVERSE_CONTRACT_NAME,
      1,
      toUFix64(nftPrice)
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    await shallPass(
      acceptSaleOfferLegacy(
        Buyer,
        TICAL_UNIVERSE_CONTRACT_NAME,
        saleOfferId,
        Seller
      )
    );
  });

  it("should be possible to accept SaleOffer with royalties", async () => {
    const TuneGO = await getTuneGOAddress();
    const Seller = await getAccountAddress("Seller");
    const Recipient1 = await getAccountAddress("Recipient1");
    const Recipient2 = await getAccountAddress("Recipient2");
    const Buyer = await getAccountAddress("Buyer");

    await deployMarket();
    await deployTuneGONFT();
    await addSupportedNFTType();
    await mintRandomTuneGONFT(Seller, 2);
    await mintFlow(Buyer, toUFix64(1000));

    const nftPrice = 100.0;
    const tunegoFee = (nftPrice * TUNEGO_FEE_PERCENTAGE) / 100;
    const recipient1Percentage = 2.5;
    const recipient2Percentage = 3.5;
    const recipient1Fee = (nftPrice * recipient1Percentage) / 100;
    const recipient2Fee = (nftPrice * recipient2Percentage) / 100;

    const [transactionResult] = await createSaleOffer(
      Seller,
      TUNEGO_NFTS_CONTRACT_NAME,
      0,
      toUFix64(nftPrice),
      [
        { receiver: Recipient1, percentage: recipient1Percentage },
        { receiver: Recipient2, percentage: recipient2Percentage },
      ]
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    const [buyerBalanceBefore] = await getFlowTokenBalance(Buyer);
    const [sellerBalanceBefore] = await getFlowTokenBalance(Seller);
    const [recipient1BalanceBefore] = await getFlowTokenBalance(Recipient1);
    const [recipient2BalanceBefore] = await getFlowTokenBalance(Recipient2);
    const [tunegoBalanceBefore] = await getFlowTokenBalance(TuneGO);

    await shallPass(
      acceptSaleOffer(Buyer, TUNEGO_NFTS_CONTRACT_NAME, saleOfferId, Seller)
    );

    const [buyerBalanceAfter] = await getFlowTokenBalance(Buyer);
    const [sellerBalanceAfter] = await getFlowTokenBalance(Seller);
    const [recipient1BalanceAfter] = await getFlowTokenBalance(Recipient1);
    const [recipient2BalanceAfter] = await getFlowTokenBalance(Recipient2);
    const [tunegoBalanceAfter] = await getFlowTokenBalance(TuneGO);

    expect(Number(buyerBalanceAfter)).toBeCloseTo(
      Number(buyerBalanceBefore) - nftPrice,
      6
    );
    expect(Number(sellerBalanceAfter)).toBeCloseTo(
      Number(sellerBalanceBefore) +
        (nftPrice - tunegoFee - recipient1Fee - recipient2Fee),
      6
    );
    expect(Number(recipient1BalanceAfter)).toBeCloseTo(
      Number(recipient1BalanceBefore) + recipient1Fee,
      6
    );
    expect(Number(recipient2BalanceAfter)).toBeCloseTo(
      Number(recipient2BalanceBefore) + recipient2Fee,
      6
    );
    expect(Number(tunegoBalanceAfter)).toBeCloseTo(
      Number(tunegoBalanceBefore) + tunegoFee,
      6
    );
  });

  it("should not accept sale offer with insufficient buyer balance", async () => {
    const Seller = await getAccountAddress("Seller");
    const Buyer = await getAccountAddress("Buyer");

    await deployMarket();
    await deployTuneGONFT();
    await addSupportedNFTType();
    await mintRandomTuneGONFT(Seller, 2);
    await mintFlow(Buyer, toUFix64(10));

    const nftPrice = 100;
    const [transactionResult] = await createSaleOffer(
      Seller,
      TUNEGO_NFTS_CONTRACT_NAME,
      0,
      toUFix64(nftPrice)
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    await shallRevert(
      acceptSaleOffer(Buyer, TUNEGO_NFTS_CONTRACT_NAME, saleOfferId, Seller)
    );
  });

  it("should not accept removed sale offer", async () => {
    const Seller = await getAccountAddress("Seller");
    const Buyer = await getAccountAddress("Buyer");

    await deployMarket();
    await deployTuneGONFT();
    await addSupportedNFTType();
    await mintRandomTuneGONFT(Seller, 2);
    await mintFlow(Buyer, toUFix64(1000));

    const nftPrice = 100.0;
    const [transactionResult] = await createSaleOffer(
      Seller,
      TUNEGO_NFTS_CONTRACT_NAME,
      0,
      toUFix64(nftPrice)
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    await shallPass(removeSaleOffer(Seller, saleOfferId));

    await shallRevert(
      acceptSaleOffer(Buyer, TUNEGO_NFTS_CONTRACT_NAME, saleOfferId, Seller)
    );
  });

  it("should be possible to remove SaleOffer", async () => {
    const Seller = await getAccountAddress("Seller");

    await deployMarket();
    await deployTuneGONFT();
    await addSupportedNFTType();
    await mintRandomTuneGONFT(Seller, 2);
    const [transactionResult] = await createSaleOffer(
      Seller,
      TUNEGO_NFTS_CONTRACT_NAME,
      0,
      toUFix64(1.11)
    );
    const saleOfferId = getSaleOfferIdFromTransactionResult(transactionResult);

    let [itemsListed] = await getMarketCollectionLength(Seller);
    expect(itemsListed).toBe(1);

    await shallPass(removeSaleOffer(Seller, saleOfferId));

    [itemsListed] = await getMarketCollectionLength(Seller);
    expect(itemsListed).toBe(0);
  });

  it("should be possible to transfer admin resource", async () => {
    await deployMarket();
    const CurrentAdmin = await getTuneGOAdminAddress();
    const NewAdmin = await getAccountAddress("NewAdmin");

    await shallPass(transferAdminResource(CurrentAdmin, NewAdmin));
  });

  it("should be possible to create new admin resource", async () => {
    await deployMarket();
    const CurrentAdmin = await getTuneGOAdminAddress();
    const NewAdmin = await getAccountAddress("NewAdmin");

    await shallPass(createAdminResource(CurrentAdmin, NewAdmin));
  });
});
