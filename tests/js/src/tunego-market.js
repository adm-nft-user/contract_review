import { UFix64, UInt64, Address, String, Dictionary } from "@onflow/types";
import {
  getTransactionCode,
  getScriptCode,
  executeScript,
  sendTransaction,
  deployContractByName,
} from "flow-js-testing";
import {
  getFlowTokenAddress,
  getFungibleTokenAddress,
  getNonFungibleTokenAddress,
  getTuneGOAddress,
  getTuneGOAdminAddress,
  toUFix64,
} from "./common";
import { deployTicalUniverse } from "./tical-universe";
import { deployTuneGO } from "./tunego";

export const TUNEGO_FEE_PERCENTAGE = 2.5;
export const TUNEGO_NFTS_CONTRACT_NAME = "TuneGONFT";
export const TUNEGO_CONTRACT_NAME = "TuneGO";
export const TICAL_UNIVERSE_CONTRACT_NAME = "TicalUniverse";

/*
 * Deploys TuneGONFT and TuneGOMarket contracts.
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const deployMarket = async () => {
  const TuneGO = await getTuneGOAddress();

  await deployTuneGO();
  await deployTicalUniverse();

  return deployContractByName({
    to: TuneGO,
    name: "TuneGOMarket",
  });
};

/*
 * Creates new admin resource for **newAdmin**.
 * @param {string} admin - admin address
 * @param {string} newAdmin - newAdmin address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const createAdminResource = async (admin, newAdmin) => {
  const TuneGOMarket = await getTuneGOAddress();

  const name = "tunegoMarket/create_admin_resource";
  const addressMap = { TuneGOMarket };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [admin, newAdmin];
  const args = [];

  return sendTransaction({ code, signers, args });
};

/*
 * Transfers admin resource from **admin** account to **newAdmin**.
 * @param {string} admin - admin address
 * @param {string} newAdmin - newAdmin address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferAdminResource = async (admin, newAdmin) => {
  const TuneGOMarket = await getTuneGOAddress();

  const name = "tunegoMarket/transfer_admin_resource";
  const addressMap = { TuneGOMarket };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [admin, newAdmin];
  const args = [];

  return sendTransaction({ code, signers, args });
};

/*
 * Set TuneGOFee
 * @param {string} receiver - receiver address
 * @param {UFix64} percentage - fee percentage
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const setTuneGOFee = async (receiver, percentage) => {
  const TuneGOAdmin = await getTuneGOAdminAddress();
  const TuneGOMarket = await getTuneGOAddress();

  const name = "tunegoMarket/set_market_fee";
  const addressMap = { TuneGOMarket };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [TuneGOAdmin];
  const args = [
    [receiver, Address],
    [percentage, UFix64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Add supported NFT Type
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const addSupportedNFTType = async () => {
  const TuneGOAdmin = await getTuneGOAdminAddress();
  const name = "tunegoMarket/add_supported_nft_type";
  const code = await getTransactionCode({ name });

  const signers = [TuneGOAdmin];
  const args = [];

  return sendTransaction({ code, signers, args });
};

/*
 * Setups TuneGOMarket collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupTuneGOMarketOnAccount = async (account) => {
  const TuneGOMarket = await getTuneGOAddress();
  const addressMap = { TuneGOMarket };
  const name = "tunegoMarket/setup_account";

  const code = await getTransactionCode({ name, addressMap });
  const signers = [account];

  return sendTransaction({ code, signers });
};

/*
 * Lists item with id equal to **item** id for sale with specified **price**.
 * @param {string} seller - account address
 * @param {string} collectibleContractName - name of collectible contract
 * @param {UInt64} collectibleId - collectible token id
 * @param {UFix64} price - collectible token price
 * @param {Array}  royalties - list of royalties receivers with percentages
 * @param {string} transaction name
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const createSaleOffer = async (
  seller,
  collectibleContractName,
  collectibleId,
  price,
  royalties = [],
  txName = "tunegoMarket/sell_market_item"
) => {
  const TuneGO = await getTuneGOAddress();
  const NonFungibleToken = await getNonFungibleTokenAddress();
  const addressMap = {
    FungibleToken: getFungibleTokenAddress(),
    FlowToken: getFlowTokenAddress(),
    NonFungibleToken: NonFungibleToken,
    TuneGONFT: TuneGO,
    TuneGO: TuneGO,
    TicalUniverse: TuneGO,
    TuneGOMarket: TuneGO,
  };

  const code = await getTransactionCode({ name: txName, addressMap });
  const signers = [seller];
  const args = [
    [collectibleContractName, String],
    [collectibleId, UInt64],
    [price, UFix64],
    [
      royalties.map((royalty) => {
        return { key: royalty.receiver, value: toUFix64(royalty.percentage) };
      }),
      Dictionary({ key: Address, value: UFix64 }),
    ],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Lists item with id equal to **item** id for sale with specified **price**.
 * @param {string} seller - account address
 * @param {string} collectibleContractName - name of collectible contract
 * @param {UInt64} collectibleId - collectible token id
 * @param {UFix64} price - collectible token price
 * @param {Array}  royalties - list of royalties receivers with percentages
 * @param {string} transaction name
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const createSaleOfferLegacy = async (
  seller,
  collectibleContractName,
  collectibleId,
  price,
  royalties = []
) => {
  return createSaleOffer(
    seller,
    collectibleContractName,
    collectibleId,
    price,
    royalties,
    "tunegoMarket/sell_market_item_legacy"
  );
};

/*
 * Accepts sale offer with **saleOffer** id.
 * @param {string} buyer - buyer address
 * @param {string} collectibleContractName - name of collectible contract
 * @param {UInt64} saleOfferId - sale offer resource id
 * @param {string} seller - seller address
 * @param {string} transaction name
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const acceptSaleOffer = async (
  buyer,
  collectibleContractName,
  saleOfferId,
  seller,
  txName = "tunegoMarket/buy_market_item"
) => {
  const TuneGO = await getTuneGOAddress();
  const NonFungibleToken = await getNonFungibleTokenAddress();
  const addressMap = {
    FungibleToken: getFungibleTokenAddress(),
    FlowToken: getFlowTokenAddress(),
    NonFungibleToken: NonFungibleToken,
    TuneGONFT: TuneGO,
    TuneGO: TuneGO,
    TicalUniverse: TuneGO,
    TuneGOMarket: TuneGO,
  };

  const code = await getTransactionCode({ name: txName, addressMap });
  const signers = [buyer];
  const args = [
    [collectibleContractName, String],
    [saleOfferId, UInt64],
    [seller, Address],
  ];
  return sendTransaction({ code, signers, args });
};

/*
 * Accepts sale offer with **saleOffer** id.
 * @param {string} buyer - buyer address
 * @param {string} collectibleContractName - name of collectible contract
 * @param {UInt64} saleOfferId - sale offer resource id
 * @param {string} seller - seller address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const acceptSaleOfferLegacy = async (
  buyer,
  collectibleContractName,
  saleOfferId,
  seller
) => {
  return acceptSaleOffer(
    buyer,
    collectibleContractName,
    saleOfferId,
    seller,
    "tunegoMarket/buy_market_item_legacy"
  );
};

/*
 * Removes sale offer with id equal to **saleOffer** from sale offers.
 * @param {string} owner - seller address
 * @param {UInt64} saleOfferId - sale offer resource id
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const removeSaleOffer = async (owner, saleOfferId) => {
  const TuneGOMarket = await getTuneGOAddress();
  const addressMap = { TuneGOMarket };
  const name = "tunegoMarket/remove_market_item";

  const code = await getTransactionCode({ name, addressMap });
  const signers = [owner];
  const args = [[saleOfferId, UInt64]];

  return sendTransaction({ code, signers, args });
};

/*
 * Returns the length of list of items for sale.
 * @param {string} account - account address
 * @throws Will throw an error if execution fails
 * @returns {UInt64}
 * */
export const getMarketCollectionLength = async (account) => {
  const TuneGOMarket = await getTuneGOAddress();
  const addressMap = { TuneGOMarket };
  const name = "tunegoMarket/read_collection_length";

  const code = await getScriptCode({ name, addressMap });
  const args = [[account, Address]];

  return executeScript({ code, args });
};

/*
 * Returns MarketFee config
 * @throws Will throw an error if execution fails
 * @returns {MarketFee}
 * */
export const getMarketFee = async () => {
  const TuneGOMarket = await getTuneGOAddress();
  const addressMap = { TuneGOMarket };
  const name = "tunegoMarket/get_market_fee";

  const code = await getScriptCode({ name, addressMap });
  const args = [];

  return executeScript({ code, args });
};

/*
 * Returns the sale offer id from createSaleOffer result
 * @param {string} transactionResult
 * @returns {UInt64}
 * */
export const getSaleOfferIdFromTransactionResult = (transactionResult) => {
  const saleOfferCreatedEvent = transactionResult.events[0];
  return saleOfferCreatedEvent.data.saleOfferId;
};
