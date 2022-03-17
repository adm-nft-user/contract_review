import {
  getAccountAddress,
  getTransactionCode,
  sendTransaction,
} from 'flow-js-testing';

const FUNGIBLE_TOKEN_ADDRESS = '0xee82856bf20e2aa6';
const FLOW_TOKEN_ADDRESS = '0x0ae53cb6e3f42a79';
const UFIX64_PRECISION = 8;

export const toUFix64 = (value) => value.toFixed(UFIX64_PRECISION);

export const getTunegoAddress = async () => getAccountAddress('Tunego');
export const getNonFungibleTokenAddress = async () => getTunegoAddress();
export const getTunegoAdminAddress = async () => getTunegoAddress();
export const getFlowTokenAddress = () => FLOW_TOKEN_ADDRESS;
export const getFungibleTokenAddress = () => FUNGIBLE_TOKEN_ADDRESS;

export const registerContract = async (name, address) => {
  const code = await getTransactionCode({ name: 'utils/register_contract' });
  const args = [name, address];

  return sendTransaction({ code, args });
};
