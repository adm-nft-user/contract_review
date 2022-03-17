import { Address, UInt64, UFix64, String, Dictionary } from '@onflow/types';
import {
  deployContractByName,
  executeScript,
  getContractAddress,
  getContractCode,
  getScriptCode,
  getTransactionCode,
  mintFlow,
  sendTransaction,
} from 'flow-js-testing';
import {
  getTunegoAddress,
  getTunegoAdminAddress,
  getFungibleTokenAddress,
  getFlowTokenAddress,
  registerContract,
  toUFix64,
} from './common';
import * as faker from 'faker';

/*
 * Deploys NonFungibleToken and TunegoNfts contracts.
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const deployTunegoNfts = async () => {
  const Tunego = await getTunegoAddress();
  const addressMap = {
    FungibleToken: getFungibleTokenAddress(),
    FlowToken: getFlowTokenAddress(),
    NonFungibleToken: Tunego,
    MetadataViews: Tunego,
  };

  await mintFlow(Tunego, '10.0');
  await deployContractByName({
    to: Tunego,
    name: 'FungibleToken',
  });
  await deployContractByName({
    to: Tunego,
    name: 'NonFungibleToken',
  });
  await deployContractByName({
    to: Tunego,
    name: 'MetadataViews',
  });

  const contractName = 'TunegoNfts';
  const contractCode = await getContractCode({
    name: contractName,
    addressMap,
  });
  const contractCodeHex = Buffer.from(contractCode).toString('hex');

  const code = await getTransactionCode({ name: 'tunegoNft/deploy_contract' });
  const signers = [Tunego];

  const args = [
    [contractName, String],
    [contractCodeHex, String],
  ];

  await registerContract(contractName, Tunego);
  return sendTransaction({ code, signers, args });
};

/*
 * Creates new NFTMinter for **newAdmin**.
 * @param {string} admin - admin address
 * @param {string} newAdmin - newAdmin address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const createNFTMinter = async (admin, newAdmin) => {
  const TunegoNfts = await getTunegoAddress();

  const name = 'tunegoNft/create_nft_minter';
  const addressMap = { TunegoNfts };
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
  const TunegoNfts = await getTunegoAddress();

  const name = 'tunegoNft/transfer_nft_minter';
  const addressMap = { TunegoNfts };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [admin, newAdmin];
  const args = [];

  return sendTransaction({ code, signers, args });
};

/*
 * Setups TunegoNfts collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupTunegoNftsOnAccount = async (account) => {
  const name = 'tunegoNft/setup_account';
  const code = await getTransactionCode({ name });
  const signers = [account];

  return sendTransaction({ code, signers });
};

/*
 * Returns TunegoNfts supply.
 * @throws Will throw an error if execution fails
 * @returns Promise{UInt64} - number of NFT minted so far
 * */
export const getTunegoNftSupply = async () => {
  const TunegoNfts = await getTunegoAddress();

  const addressMap = { TunegoNfts };
  const name = 'tunegoNft/read_tunego_nfts_supply';
  const code = await getScriptCode({ name, addressMap });

  return executeScript({ code });
};

/*
 * Mints TunegoNft and sends it to **recipient**.
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
export const mintTunegoNfts = async (
  recipient,
  itemId,
  collectionId,
  quantity,
  metadata,
  royalties = [],
  additionalInfo = {},
  minter = null,
) => {
  const TunegoAdmin = minter || (await getTunegoAdminAddress());
  const NonFungibleToken = await getTunegoAddress();
  const TunegoNfts = await getTunegoAddress();
  const FungibleToken = getFungibleTokenAddress();
  const FlowToken = getFlowTokenAddress();

  const name = 'tunegoNft/mint_tunego_nfts';
  const addressMap = { NonFungibleToken, TunegoNfts, FungibleToken, FlowToken };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [TunegoAdmin];
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
 * Mints random TunegoNft and sends it to **recipient**.
 * @param {string} recipient - account address
 * @param {number} quantity - nfts quantity
 * @param {object} data - nft data
 * @param {string} minter - minter address
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const mintRandomTunegoNfts = async (
  recipient,
  quantity = 1,
  data = {},
  minter = null,
) => {
  await setupTunegoNftsOnAccount(recipient);

  const itemId = data.itemId || faker.datatype.uuid();
  const collectionId = data.collectionId || faker.datatype.uuid();
  const metadata = getRandomMetadata();

  return mintTunegoNfts(
    recipient,
    itemId,
    collectionId,
    quantity,
    metadata,
    [],
    {},
    minter,
  );
};

/*
 * Transfers TunegoNft NFT with id equal **collectibleId** from **sender** account to **recipient**.
 * @param {string} sender - sender address
 * @param {string} recipient - recipient address
 * @param {UInt64} collectibleId - id of the item to transfer
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferTunegoNft = async (sender, recipient, collectibleId) => {
  const NonFungibleToken = await getTunegoAddress();
  const TunegoNfts = await getTunegoAddress();

  const name = 'tunegoNft/transfer_tunego_nft';
  const addressMap = { NonFungibleToken, TunegoNfts };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [sender];
  const args = [
    [recipient, Address],
    [collectibleId, UInt64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Returns TunegoNft with **id** in account collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<TunegoNft>}
 * */
export const getTunegoNftById = async (account, id) => {
  const TunegoNfts = await getTunegoAddress();
  const NonFungibleToken = await getTunegoAddress();

  const name = 'tunegoNft/read_tunego_nft';
  const addressMap = { TunegoNfts, NonFungibleToken };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns TunegoNft MetadataViews.
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const getTunegoNftViewsById = async (account, id) => {
  const TunegoNfts = await getTunegoAddress();
  const NonFungibleToken = await getTunegoAddress();
  const MetadataViews = await getTunegoAddress();

  const name = 'tunegoNft/read_tunego_nft_views';
  const addressMap = { TunegoNfts, NonFungibleToken, MetadataViews };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns TunegoNft additionalInfo.
 * @throws Will throw an error if execution fails
 * */
export const getTunegoNftAdditionalInfoById = async (account, id) => {
  const TunegoNfts = await getTunegoAddress();
  const NonFungibleToken = await getTunegoAddress();

  const name = 'tunegoNft/read_tunego_nft_additional_info';
  const addressMap = { TunegoNfts, NonFungibleToken };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns the length of account's TunegoNfts collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<UInt64>}
 * */
export const getTunegoNftsCollectionLength = async (account) => {
  const TunegoNfts = await getTunegoAddress();
  const NonFungibleToken = await getContractAddress('NonFungibleToken');

  const name = 'tunegoNft/read_collection_length';
  const addressMap = { NonFungibleToken, TunegoNfts };

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
