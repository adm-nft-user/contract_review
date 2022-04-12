import path from 'path';
import {
  init,
  getAccountAddress,
  shallPass,
  shallResolve,
  shallRevert,
  emulator,
} from 'flow-js-testing';
import {
  deployTuneGONFT,
  getTuneGONFTCollectionLength,
  getTuneGONFTById,
  getTuneGONFTViewsById,
  getTuneGONFTSupply,
  mintTuneGONFT,
  mintRandomTuneGONFT,
  setupTuneGONFTOnAccount,
  transferTuneGONFT,
  getRandomMetadata,
  getTuneGONFTAdditionalInfoById,
  transferNFTMinter,
  createNFTMinter,
} from '../src/tunego-nft';
import {
  getTuneGOAddress,
  getTuneGOAdminAddress,
  toUFix64,
} from '../src/common';

describe('TuneGO NFT', () => {
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, '../../../');
    const port = 9080;
    const logging = false;

    await init(basePath, { port });
    await emulator.start(port, logging);
  });

  afterEach(async () => {
    await emulator.stop();
  });

  it('should deploy TuneGONFT contract', async () => {
    await shallPass(deployTuneGONFT());
  });

  it('supply should be 0 after contract is deployed', async () => {
    await deployTuneGONFT();
    const TuneGO = await getTuneGOAddress();

    await shallPass(setupTuneGONFTOnAccount(TuneGO));
    const [supply] = await shallResolve(getTuneGONFTSupply());

    expect(supply).toBe(0);
  });

  it('should be possible to create a new empty NFT Collection', async () => {
    await deployTuneGONFT();
    const Seller = await getAccountAddress('Seller');

    await setupTuneGONFTOnAccount(Seller);
    const [length] = await shallResolve(getTuneGONFTCollectionLength(Seller));

    expect(length).toBe(0);
  });

  it('should be possible to mint tunego nfts', async () => {
    await deployTuneGONFT();
    const Seller = await getAccountAddress('Seller');

    await setupTuneGONFTOnAccount(Seller);

    const itemId = 'test item id';
    const collectionId = 'test collection id';
    const quantity1 = 2;
    await shallPass(
      mintRandomTuneGONFT(Seller, quantity1, { itemId, collectionId }),
    );

    const [amount1] = await getTuneGONFTCollectionLength(Seller);
    expect(amount1).toBe(2);

    const [nft1] = await getTuneGONFTById(Seller, 0);
    const [nft2] = await getTuneGONFTById(Seller, 1);
    expect(nft1.itemId).toBe(itemId);
    expect(nft1.collectionId).toBe(collectionId);
    expect(nft1.edition).toBe(1);
    expect(nft2.itemId).toBe(itemId);
    expect(nft2.collectionId).toBe(collectionId);
    expect(nft2.edition).toBe(2);

    const quantity2 = 2;
    await shallPass(
      mintRandomTuneGONFT(Seller, quantity2, { itemId, collectionId }),
    );

    const [amount2] = await getTuneGONFTCollectionLength(Seller);
    expect(amount2).toBe(4);

    const [nft3] = await getTuneGONFTById(Seller, 2);
    const [nft4] = await getTuneGONFTById(Seller, 3);
    expect(nft3.itemId).toBe(itemId);
    expect(nft3.collectionId).toBe(collectionId);
    expect(nft3.edition).toBe(3);
    expect(nft4.itemId).toBe(itemId);
    expect(nft4.collectionId).toBe(collectionId);
    expect(nft4.edition).toBe(4);
  });

  it('should be possible to mint tunego nfts with additional info', async () => {
    await deployTuneGONFT();
    const Seller = await getAccountAddress('Seller');

    await setupTuneGONFTOnAccount(Seller);

    const itemId = 'test item id';
    const collectionId = 'test collection id';
    const quantity = 2;
    const metadata = getRandomMetadata();
    const royalties = [];
    const additionalInfo = { info: 'testInfo' };

    await shallPass(
      mintTuneGONFT(
        Seller,
        itemId,
        collectionId,
        quantity,
        metadata,
        royalties,
        additionalInfo,
      ),
    );

    const [collectibleAdditionalInfo] = await getTuneGONFTAdditionalInfoById(
      Seller,
      0,
    );
    expect(collectibleAdditionalInfo).toEqual(additionalInfo);
  });

  it('should be possible to read tunego nfts metadata views', async () => {
    await deployTuneGONFT();
    const Seller = await getAccountAddress('Seller');
    const RoyaltyReceiver = await getAccountAddress('RoyaltyReceiver');
    const royaltyPercentage = 2.5;

    await setupTuneGONFTOnAccount(Seller);

    const itemId = 'test item id';
    const collectionId = 'test collection id';
    const metadata = getRandomMetadata();
    const royalties = [
      { recipient: RoyaltyReceiver, percentage: royaltyPercentage },
    ];
    const additionalInfo = { test: 'testInfo' };
    const quantity = 2;

    await shallPass(
      mintTuneGONFT(
        Seller,
        itemId,
        collectionId,
        quantity,
        metadata,
        royalties,
        additionalInfo,
      ),
    );

    const [amount] = await getTuneGONFTCollectionLength(Seller);
    expect(amount).toBe(2);

    const [nftViews] = await getTuneGONFTViewsById(Seller, 0);
    expect(nftViews.metadata).toEqual(metadata);
    expect(nftViews.edition).toEqual({
      edition: 1,
      totalEditions: 2,
    });
    expect(nftViews.royalties).toEqual([
      { percentage: toUFix64(royaltyPercentage), receiver: RoyaltyReceiver },
    ]);
    expect(nftViews.display).toEqual({
      name: metadata.title,
      description: metadata.description,
      thumbnail: { url: metadata.asset },
    });
  });

  it('should not be possible to withdraw NFT that does not exist in a collection', async () => {
    await deployTuneGONFT();
    const Seller = await getAccountAddress('Seller');
    const Buyer = await getAccountAddress('Buyer');

    await setupTuneGONFTOnAccount(Seller);
    await setupTuneGONFTOnAccount(Buyer);

    await shallRevert(transferTuneGONFT(Seller, Buyer, 9999));
  });

  it('should be possible to withdraw NFT and deposit to another accounts collection', async () => {
    await deployTuneGONFT();
    const Seller = await getAccountAddress('Seller');
    const Buyer = await getAccountAddress('Buyer');

    await setupTuneGONFTOnAccount(Seller);
    await setupTuneGONFTOnAccount(Buyer);

    await shallPass(mintRandomTuneGONFT(Seller));
    await shallPass(transferTuneGONFT(Seller, Buyer, 0));
  });

  it('should be possible to transfer NFTMinter resource', async () => {
    await deployTuneGONFT();
    const NFTHolder = await getTuneGOAdminAddress();
    const CurrentAdmin = await getTuneGOAdminAddress();
    const NewAdmin = await getAccountAddress('NewAdmin');

    await setupTuneGONFTOnAccount(NFTHolder);
    await shallPass(mintRandomTuneGONFT(NFTHolder, 1, {}, CurrentAdmin));
    await shallRevert(mintRandomTuneGONFT(NFTHolder, 1, {}, NewAdmin));

    const [amount1] = await getTuneGONFTCollectionLength(NFTHolder);
    expect(amount1).toBe(1);

    await shallPass(transferNFTMinter(CurrentAdmin, NewAdmin));
    await shallRevert(mintRandomTuneGONFT(NFTHolder, 1, {}, CurrentAdmin));
    await shallPass(mintRandomTuneGONFT(NFTHolder, 1, {}, NewAdmin));

    const [amount2] = await getTuneGONFTCollectionLength(NFTHolder);
    expect(amount2).toBe(2);
  });

  it('should be possible to create new NFTMinter resource', async () => {
    await deployTuneGONFT();
    const NFTHolder = await getTuneGOAdminAddress();
    const CurrentAdmin = await getTuneGOAdminAddress();
    const NewAdmin = await getAccountAddress('NewAdmin');

    await setupTuneGONFTOnAccount(NFTHolder);
    await shallPass(mintRandomTuneGONFT(NFTHolder, 1, {}, CurrentAdmin));
    await shallRevert(mintRandomTuneGONFT(NFTHolder, 1, {}, NewAdmin));

    const [amount1] = await getTuneGONFTCollectionLength(NFTHolder);
    expect(amount1).toBe(1);

    await shallPass(createNFTMinter(CurrentAdmin, NewAdmin));
    await shallPass(mintRandomTuneGONFT(NFTHolder, 1, {}, CurrentAdmin));
    await shallPass(mintRandomTuneGONFT(NFTHolder, 1, {}, NewAdmin));

    const [amount2] = await getTuneGONFTCollectionLength(NFTHolder);
    expect(amount2).toBe(3);
  });
});
