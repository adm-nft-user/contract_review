import { Address, UInt32, UInt64 } from '@onflow/types';
import {
  executeScript,
  sendTransaction,
  getContractAddress,
  getScriptCode,
  getTransactionCode,
  mintFlow,
  deployContractByName,
} from 'flow-js-testing';
import { getTuneGOAddress } from './common';

/*
 * Deploys NonFungibleToken and TicalUniverse contracts.
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const deployTicalUniverse = async () => {
  const TuneGO = await getTuneGOAddress();
  await mintFlow(TuneGO, '10.0');

  await deployContractByName({
    to: TuneGO,
    name: 'NonFungibleToken',
  });
  return deployContractByName({
    to: TuneGO,
    name: 'TicalUniverse',
  });
};

/*
 * Setups TicalUniverse collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupTicalUniverseOnAccount = async (account) => {
  const name = 'ticalUniverse/setup_account';
  const code = await getTransactionCode({ name });
  const signers = [account];

  return sendTransaction({ code, signers });
};

/*
 * Returns TicalUniverse supply.
 * @throws Will throw an error if execution fails
 * @returns Promise{UInt64} - number of NFT minted so far
 * */
export const getTicalUniverseSupply = async () => {
  const TicalUniverse = await getTuneGOAddress();

  const addressMap = { TicalUniverse };
  const name = 'ticalUniverse/read_tical_universe_supply';
  const code = await getScriptCode({ name, addressMap });

  return executeScript({ code });
};

/*
 * Setups TicalUniverse items
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const setupTicalUniverseItems = async () => {
  const NonFungibleToken = await getTuneGOAddress();
  const TicalUniverse = await getTuneGOAddress();
  const addressMap = { NonFungibleToken, TicalUniverse };

  const startNewSeries = 'ticalUniverse/start_new_series';
  const createSet = 'ticalUniverse/create_set';
  const createItem = 'ticalUniverse/create_item';
  const addItemsToSet = 'ticalUniverse/add_items_to_set';

  const signers = [TicalUniverse];
  const args = [];

  let code = await getTransactionCode({ name: startNewSeries, addressMap });
  await sendTransaction({ code, signers, args });

  code = await getTransactionCode({ name: createSet, addressMap });
  await sendTransaction({ code, signers, args });

  code = await getTransactionCode({ name: createItem, addressMap });
  await sendTransaction({ code, signers, args });

  code = await getTransactionCode({ name: addItemsToSet, addressMap });
  await sendTransaction({ code, signers, args });
};

/*
 * Mints TicalUniverse and sends it to **recipient**.
 * @param {string} recipient - account address
 * @param {number} quantity - nfts quantity
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const mintTicalUniverse = async (recipient, quantity = 1) => {
  await setupTicalUniverseOnAccount(recipient);

  const TicalUniverse = await getTuneGOAddress();
  const NonFungibleToken = await getTuneGOAddress();

  const name = 'ticalUniverse/mint_collectibles';
  const addressMap = { NonFungibleToken, TicalUniverse };
  const itemId = 1;
  const setId = 1;

  const code = await getTransactionCode({ name, addressMap });
  const signers = [TicalUniverse];
  const args = [
    [recipient, Address],
    [itemId, UInt32],
    [setId, UInt32],
    [quantity, UInt64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Transfers TicalUniverse NFT with id equal **collectibleId** from **sender** account to **recipient**.
 * @param {string} sender - sender address
 * @param {string} recipient - recipient address
 * @param {UInt64} collectibleId - id of the item to transfer
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferTicalUniverse = async (
  sender,
  recipient,
  collectibleId,
) => {
  const NonFungibleToken = await getTuneGOAddress();
  const TicalUniverse = await getTuneGOAddress();

  const name = 'ticalUniverse/transfer_collectible';
  const addressMap = { NonFungibleToken, TicalUniverse };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [sender];
  const args = [
    [recipient, Address],
    [collectibleId, UInt64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Returns TicalUniverse with **id** in account collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<TicalUniverse>}
 * */
export const getTicalUniverseById = async (account, id) => {
  const TicalUniverse = await getTuneGOAddress();
  const NonFungibleToken = await getTuneGOAddress();

  const name = 'ticalUniverse/read_tical_universe';
  const addressMap = { TicalUniverse, NonFungibleToken };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns the length of account's TicalUniverse collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<UInt64>}
 * */
export const getTicalUniverseCollectionLength = async (account) => {
  const TicalUniverse = await getTuneGOAddress();
  const NonFungibleToken = await getContractAddress('NonFungibleToken');

  const name = 'ticalUniverse/read_collection_length';
  const addressMap = { NonFungibleToken, TicalUniverse };

  const code = await getScriptCode({ name, addressMap });
  const args = [[account, Address]];

  return executeScript({ code, args });
};
