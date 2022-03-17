import { Address, UFix64 } from '@onflow/types';
import {
  executeScript,
  getScriptCode,
  getTransactionCode,
  sendTransaction,
} from 'flow-js-testing';
import { getFlowTokenAddress, getFungibleTokenAddress } from './common';

/*
 * Returns Flow Token balance for **account**.
 * @param {string} account - account address
 * @throws Will throw an error if execution fails
 * @returns {UFix64}
 * */
export const getFlowTokenBalance = async (account) => {
  const name = 'flowToken/get_balance';
  const addressMap = {
    FungibleToken: getFungibleTokenAddress(),
    FlowToken: getFlowTokenAddress(),
  };
  const code = await getScriptCode({ name, addressMap });
  const args = [[account, Address]];

  return executeScript({ code, args });
};

/*
 * Returns Flow Token supply.
 * @throws Will throw an error if execution fails
 * @returns {UFix64}
 * */
export const getFlowTokenSupply = async () => {
  const name = 'flowToken/get_supply';
  const addressMap = { FlowToken: getFlowTokenAddress() };
  const code = await getScriptCode({ name, addressMap });

  return executeScript({ code });
};

/*
 * Transfers **amount** of Flow tokens from **sender** account to **recipient**.
 * @param {string} sender - sender address
 * @param {string} recipient - recipient address
 * @param {string} amount - UFix64 amount to transfer
 * @throws Will throw an error if transaction is reverted.
 * @returns {Promise<*>}
 * */
export const transferFlowTokens = async (sender, recipient, amount) => {
  const name = 'flowToken/transfer_tokens';
  const addressMap = {
    FungibleToken: getFungibleTokenAddress(),
    FlowToken: getFlowTokenAddress(),
  };
  const code = await getTransactionCode({ name, addressMap });
  const signers = [sender];
  const args = [
    [amount, UFix64],
    [recipient, Address],
  ];

  return sendTransaction({
    code,
    signers,
    args,
  });
};
