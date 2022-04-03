import { Address, UInt64, UFix64, String, Dictionary } from "@onflow/types";
import {
  deployContractByName,
  executeScript,
  getContractAddress,
  getScriptCode,
  getTransactionCode,
  mintFlow,
  sendTransaction,
} from "flow-js-testing";
import {
  getTuneGOAddress,
  getTuneGOAdminAddress,
  getFungibleTokenAddress,
  getFlowTokenAddress,
  toUFix64,
} from "./common";
import * as faker from "faker";

/*
 * Deploys NonFungibleToken and TuneGONFT contracts.
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const deployTuneGONFT = async () => {
  const TuneGO = await getTuneGOAddress();

  await mintFlow(TuneGO, "10.0");
  await deployContractByName({
    to: TuneGO,
    name: "FungibleToken",
  });
  await deployContractByName({
    to: TuneGO,
    name: "NonFungibleToken",
  });
  await deployContractByName({
    to: TuneGO,
    name: "MetadataViews",
  });
  return deployContractByName({
    to: TuneGO,
    name: "TuneGONFT",
  });
};

/*
 * Creates new NFTMinter for **newAdmin**.
 * @param {string} admin - admin address
 * @param {string} newAdmin - newAdmin address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const createNFTMinter = async (admin, newAdmin) => {
  const TuneGONFT = await getTuneGOAddress();

  const name = "tunegoNFT/create_nft_minter";
  const addressMap = { TuneGONFT };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [admin, newAdmin];
  const args = [];

  return sendTransaction({ code, signers, args });
};

/*
 * Transfers NFTMinter from **admin** account to **newAdmin**.
 * @param {string} admin - admin address
 * @param {string} newAdmin - newAdmin address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferNFTMinter = async (admin, newAdmin) => {
  const TuneGONFT = await getTuneGOAddress();

  const name = "tunegoNFT/transfer_nft_minter";
  const addressMap = { TuneGONFT };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [admin, newAdmin];
  const args = [];

  return sendTransaction({ code, signers, args });
};

/*
 * Setups TuneGONFT collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupTuneGONFTOnAccount = async (account) => {
  const name = "tunegoNFT/setup_account";
  const code = await getTransactionCode({ name });
  const signers = [account];

  return sendTransaction({ code, signers });
};

/*
 * Returns TuneGONFT supply.
 * @throws Will throw an error if execution fails
 * @returns Promise{UInt64} - number of NFT minted so far
 * */
export const getTuneGONFTSupply = async () => {
  const TuneGONFT = await getTuneGOAddress();

  const addressMap = { TuneGONFT };
  const name = "tunegoNFT/read_tunego_nfts_supply";
  const code = await getScriptCode({ name, addressMap });

  return executeScript({ code });
};

/*
 * Mints TuneGONFT and sends it to **recipient**.
 * @param {string} recipient - account address
 * @param {string} itemId - nft itemId
 * @param {string} collectionId - nft collectionId
 * @param {number} quantity - nfts quantity
 * @param {object} metadata - nft collectionId
 * @param {array}  royalties - list of royalties recipients with royalty percentages
 * @param {object} additionalInfo - additional information for nft
 * @param {string} minter - minter address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const mintTuneGONFT = async (
  recipient,
  itemId,
  collectionId,
  quantity,
  metadata,
  royalties = [],
  additionalInfo = {},
  minter = null
) => {
  const TuneGOAdmin = minter || (await getTuneGOAdminAddress());
  const NonFungibleToken = await getTuneGOAddress();
  const TuneGONFT = await getTuneGOAddress();
  const FungibleToken = getFungibleTokenAddress();
  const FlowToken = getFlowTokenAddress();

  const name = "tunegoNFT/mint_tunego_nfts";
  const addressMap = { NonFungibleToken, TuneGONFT, FungibleToken, FlowToken };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [TuneGOAdmin];
  const args = [
    [recipient, Address],
    [itemId, String],
    [collectionId, String],
    [metadata.title, String],
    [metadata.description, String],
    [metadata.rarity, String],
    [metadata.creator, String],
    [metadata.credits, String],
    [metadata.asset, String],
    [
      royalties.map((royalty) => {
        return { key: royalty.recipient, value: toUFix64(royalty.percentage) };
      }),
      Dictionary({ key: Address, value: UFix64 }),
    ],
    [
      Object.keys(additionalInfo).map(function (key) {
        return { key, value: additionalInfo[key] };
      }),
      Dictionary({ key: String, value: String }),
    ],
    [quantity, UInt64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Mints random TuneGONFT and sends it to **recipient**.
 * @param {string} recipient - account address
 * @param {number} quantity - nfts quantity
 * @param {object} data - nft data
 * @param {string} minter - minter address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const mintRandomTuneGONFT = async (
  recipient,
  quantity = 1,
  data = {},
  minter = null
) => {
  await setupTuneGONFTOnAccount(recipient);

  const itemId = data.itemId || faker.datatype.uuid();
  const collectionId = data.collectionId || faker.datatype.uuid();
  const metadata = getRandomMetadata();

  return mintTuneGONFT(
    recipient,
    itemId,
    collectionId,
    quantity,
    metadata,
    [],
    {},
    minter
  );
};

/*
 * Transfers TuneGONFT NFT with id equal **collectibleId** from **sender** account to **recipient**.
 * @param {string} sender - sender address
 * @param {string} recipient - recipient address
 * @param {UInt64} collectibleId - id of the item to transfer
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferTuneGONFT = async (sender, recipient, collectibleId) => {
  const NonFungibleToken = await getTuneGOAddress();
  const TuneGONFT = await getTuneGOAddress();

  const name = "tunegoNFT/transfer_tunego_nft";
  const addressMap = { NonFungibleToken, TuneGONFT };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [sender];
  const args = [
    [recipient, Address],
    [collectibleId, UInt64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Returns TuneGONFT with **id** in account collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<TuneGONFT>}
 * */
export const getTuneGONFTById = async (account, id) => {
  const TuneGONFT = await getTuneGOAddress();
  const NonFungibleToken = await getTuneGOAddress();

  const name = "tunegoNFT/read_tunego_nft";
  const addressMap = { TuneGONFT, NonFungibleToken };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns TuneGONFT MetadataViews.
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const getTuneGONFTViewsById = async (account, id) => {
  const TuneGONFT = await getTuneGOAddress();
  const NonFungibleToken = await getTuneGOAddress();
  const MetadataViews = await getTuneGOAddress();

  const name = "tunegoNFT/read_tunego_nft_views";
  const addressMap = { TuneGONFT, NonFungibleToken, MetadataViews };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns TuneGONFT additionalInfo.
 * @throws Will throw an error if execution fails
 * */
export const getTuneGONFTAdditionalInfoById = async (account, id) => {
  const TuneGONFT = await getTuneGOAddress();
  const NonFungibleToken = await getTuneGOAddress();

  const name = "tunegoNFT/read_tunego_nft_additional_info";
  const addressMap = { TuneGONFT, NonFungibleToken };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns the length of account's TuneGONFT collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<UInt64>}
 * */
export const getTuneGONFTCollectionLength = async (account) => {
  const TuneGONFT = await getTuneGOAddress();
  const NonFungibleToken = await getContractAddress("NonFungibleToken");

  const name = "tunegoNFT/read_collection_length";
  const addressMap = { NonFungibleToken, TuneGONFT };

  const code = await getScriptCode({ name, addressMap });
  const args = [[account, Address]];

  return executeScript({ code, args });
};

/*
 * Returns random metadata
 * */
export const getRandomMetadata = (metadata = {}) => {
  return {
    title: metadata.title || faker.random.words(4),
    description: metadata.description || faker.random.words(20),
    rarity: metadata.rarity || faker.random.words(1),
    creator: metadata.creator || faker.random.words(4),
    credits: metadata.credits || faker.random.words(10),
    asset: metadata.asset || faker.image.imageUrl(),
  };
};
