import { getAccountAddress } from 'flow-js-testing';

const FUNGIBLE_TOKEN_ADDRESS = '0xee82856bf20e2aa6';
const FLOW_TOKEN_ADDRESS = '0x0ae53cb6e3f42a79';
const UFIX64_PRECISION = 8;

export const toUFix64 = (value) => value.toFixed(UFIX64_PRECISION);

export const getTuneGOAddress = async () => getAccountAddress('TuneGO');
export const getTuneGOAdminAddress = async () => getTuneGOAddress();
export const getNonFungibleTokenAddress = async () => getTuneGOAddress();
export const getFlowTokenAddress = () => FLOW_TOKEN_ADDRESS;
export const getFungibleTokenAddress = () => FUNGIBLE_TOKEN_ADDRESS;
