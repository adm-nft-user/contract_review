import { Address, UInt32, UInt64 } from "@onflow/types";
import {
  executeScript,
  sendTransaction,
  getContractAddress,
  getScriptCode,
  getTransactionCode,
  mintFlow,
  deployContractByName,
} from "flow-js-testing";
import { getTuneGOAddress } from "./common";

/*
 * Deploys NonFungibleToken and TuneGO contracts.
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const deployTuneGO = async () => {
  const TuneGO = await getTuneGOAddress();
  await mintFlow(TuneGO, "10.0");

  await deployContractByName({
    to: TuneGO,
    name: "NonFungibleToken",
  });
  return deployContractByName({
    to: TuneGO,
    name: "TuneGO",
  });
};

/*
 * Setups TuneGO collection on account and exposes public capability.
 * @param {string} account - account address
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const setupTuneGOOnAccount = async (account) => {
  const name = "tunego/setup_account";
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
  const TuneGO = await getTuneGOAddress();

  const addressMap = { TuneGO };
  const name = "tunego/read_tunego_supply";
  const code = await getScriptCode({ name, addressMap });

  return executeScript({ code });
};

/*
 * Setups TuneGO items
 * @throws Will throw an error if execution fails
 * @returns {Promise<*>}
 * */
export const setupTuneGOItems = async () => {
  const NonFungibleToken = await getTuneGOAddress();
  const TuneGO = await getTuneGOAddress();
  const addressMap = { NonFungibleToken, TuneGO };

  const startNewSeries = "tunego/start_new_series";
  const createSet = "tunego/create_set";
  const createItem = "tunego/create_item";
  const addItemToSet = "tunego/add_item_to_set";

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

  const TuneGO = await getTuneGOAddress();
  const NonFungibleToken = await getTuneGOAddress();

  const name = "tunego/mint_collectibles";
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
  const NonFungibleToken = await getTuneGOAddress();
  const TuneGO = await getTuneGOAddress();

  const name = "tunego/transfer_collectible";
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
  const TuneGO = await getTuneGOAddress();
  const NonFungibleToken = await getTuneGOAddress();

  const name = "tunego/read_tunego";
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
  const TuneGO = await getTuneGOAddress();
  const NonFungibleToken = await getContractAddress("NonFungibleToken");

  const name = "tunego/read_collection_length";
  const addressMap = { NonFungibleToken, TuneGO };

  const code = await getScriptCode({ name, addressMap });
  const args = [[account, Address]];

  return executeScript({ code, args });
};
