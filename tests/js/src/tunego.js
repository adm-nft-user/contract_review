import { Address, UInt32, UInt64, String } from '@onflow/types';
import {
  executeScript,
  sendTransaction,
  getContractAddress,
  getContractCode,
  getScriptCode,
  getTransactionCode,
  mintFlow,
  deployContractByName,
} from 'flow-js-testing';
import { getTunegoAddress, registerContract } from './common';

/*
 * Deploys NonFungibleToken and TuneGO contracts.
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const deployTuneGO = async () => {
  const Tunego = await getTunegoAddress();
  const addressMap = { NonFungibleToken: Tunego };
  await mintFlow(Tunego, '10.0');

  await deployContractByName({
    to: Tunego,
    name: 'NonFungibleToken',
  });

  const contractName = 'TuneGO';
  const contractCode = await getContractCode({
    name: contractName,
    addressMap,
  });
  const contractCodeHex = Buffer.from(contractCode).toString('hex');

  const code = await getTransactionCode({ name: 'tuneGO/deploy_contract' });
  const signers = [Tunego];

  const args = [
    [contractName, String],
    [contractCodeHex, String],
  ];

  await registerContract(contractName, Tunego);
  return sendTransaction({ code, signers, args });
};

/*
 * Setups TuneGO collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupTuneGOOnAccount = async (account) => {
  const name = 'tuneGO/setup_account';
  const code = await getTransactionCode({ name });
  const signers = [account];

  return sendTransaction({ code, signers });
};

/*
 * Returns TuneGO supply.
 * @throws Will throw an error if execution fails
 * @returns Promise{UInt64} - number of NFT minted so far
 * */
export const getTuneGOSupply = async () => {
  const TuneGO = await getTunegoAddress();

  const addressMap = { TuneGO };
  const name = 'tuneGO/read_tunego_supply';
  const code = await getScriptCode({ name, addressMap });

  return executeScript({ code });
};

/*
 * Setups TuneGO items
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const setupTuneGOItems = async () => {
  const NonFungibleToken = await getTunegoAddress();
  const TuneGO = await getTunegoAddress();
  const addressMap = { NonFungibleToken, TuneGO };

  const startNewSeries = 'tuneGO/start_new_series';
  const createSet = 'tuneGO/create_set';
  const createItem = 'tuneGO/create_item';
  const addItemToSet = 'tuneGO/add_item_to_set';

  const signers = [TuneGO];
  const args = [];

  let code = await getTransactionCode({ name: startNewSeries, addressMap });
  await sendTransaction({ code, signers, args });

  code = await getTransactionCode({ name: createSet, addressMap });
  await sendTransaction({ code, signers, args });

  code = await getTransactionCode({ name: createItem, addressMap });
  await sendTransaction({ code, signers, args });

  code = await getTransactionCode({ name: addItemToSet, addressMap });
  await sendTransaction({ code, signers, args });
};

/*
 * Mints TuneGO and sends it to **recipient**.
 * @param {string} recipient - account address
 * @param {number} quantity - nfts quantity
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const mintTuneGO = async (recipient, quantity = 1) => {
  await setupTuneGOOnAccount(recipient);

  const TuneGO = await getTunegoAddress();
  const NonFungibleToken = await getTunegoAddress();

  const name = 'tuneGO/mint_collectibles';
  const addressMap = { NonFungibleToken, TuneGO };
  const itemId = 1;
  const setId = 1;

  const code = await getTransactionCode({ name, addressMap });
  const signers = [TuneGO];
  const args = [
    [recipient, Address],
    [itemId, UInt32],
    [setId, UInt32],
    [quantity, UInt64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Transfers TuneGO NFT with id equal **collectibleId** from **sender** account to **recipient**.
 * @param {string} sender - sender address
 * @param {string} recipient - recipient address
 * @param {UInt64} collectibleId - id of the item to transfer
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const transferTuneGO = async (sender, recipient, collectibleId) => {
  const NonFungibleToken = await getTunegoAddress();
  const TuneGO = await getTunegoAddress();

  const name = 'tuneGO/transfer_collectible';
  const addressMap = { NonFungibleToken, TuneGO };
  const code = await getTransactionCode({ name, addressMap });

  const signers = [sender];
  const args = [
    [recipient, Address],
    [collectibleId, UInt64],
  ];

  return sendTransaction({ code, signers, args });
};

/*
 * Returns TuneGO with **id** in account collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<TuneGO>}
 * */
export const getTuneGOById = async (account, id) => {
  const TuneGO = await getTunegoAddress();
  const NonFungibleToken = await getTunegoAddress();

  const name = 'tuneGO/read_tunego';
  const addressMap = { TuneGO, NonFungibleToken };
  const code = await getScriptCode({ name, addressMap });

  const args = [
    [account, Address],
    [id, UInt64],
  ];

  return executeScript({ code, args });
};

/*
 * Returns the length of account's TuneGO collection.
 * @throws Will throw an error if execution fails
 * @returns {Promise<UInt64>}
 * */
export const getTuneGOCollectionLength = async (account) => {
  const TuneGO = await getTunegoAddress();
  const NonFungibleToken = await getContractAddress('NonFungibleToken');

  const name = 'tuneGO/read_collection_length';
  const addressMap = { NonFungibleToken, TuneGO };

  const code = await getScriptCode({ name, addressMap });
  const args = [[account, Address]];

  return executeScript({ code, args });
};
