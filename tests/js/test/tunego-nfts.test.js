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
  deployTunegoNfts,
  getTunegoNftsCollectionLength,
  getTunegoNftById,
  getTunegoNftViewsById,
  getTunegoNftSupply,
  mintTunegoNfts,
  mintRandomTunegoNfts,
  setupTunegoNftsOnAccount,
  transferTunegoNft,
  getRandomMetadata,
  getTunegoNftAdditionalInfoById,
  transferNFTMinter,
  createNFTMinter,
} from '../src/tunego-nfts';
import {
  getTunegoAddress,
  getTunegoAdminAddress,
  toUFix64,
} from '../src/common';

describe('Tunego Nfts', () => {
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

  it('should deploy TunegoNfts contract', async () => {
    await shallPass(deployTunegoNfts());
  });

  it('supply should be 0 after contract is deployed', async () => {
    await deployTunegoNfts();
    const Tunego = await getTunegoAddress();

    await shallPass(setupTunegoNftsOnAccount(Tunego));
    const [supply] = await shallResolve(getTunegoNftSupply());

    expect(supply).toBe(0);
  });

  it('should be possible to create a new empty NFT Collection', async () => {
    await deployTunegoNfts();
    const Seller = await getAccountAddress('Seller');

    await setupTunegoNftsOnAccount(Seller);
    const [length] = await shallResolve(getTunegoNftsCollectionLength(Seller));

    expect(length).toBe(0);
  });

  it('should be possible to mint tunego nfts', async () => {
    await deployTunegoNfts();
    const Seller = await getAccountAddress('Seller');

    await setupTunegoNftsOnAccount(Seller);

    const itemId = 'test item id';
    const collectionId = 'test collection id';
    const quantity1 = 2;
    await shallPass(
      mintRandomTunegoNfts(Seller, quantity1, { itemId, collectionId }),
    );

    const [amount1] = await getTunegoNftsCollectionLength(Seller);
    expect(amount1).toBe(2);

    const [nft1] = await getTunegoNftById(Seller, 0);
    const [nft2] = await getTunegoNftById(Seller, 1);
    expect(nft1.itemId).toBe(itemId);
    expect(nft1.collectionId).toBe(collectionId);
    expect(nft1.edition).toBe(1);
    expect(nft2.itemId).toBe(itemId);
    expect(nft2.collectionId).toBe(collectionId);
    expect(nft2.edition).toBe(2);

    const quantity2 = 2;
    await shallPass(
      mintRandomTunegoNfts(Seller, quantity2, { itemId, collectionId }),
    );

    const [amount2] = await getTunegoNftsCollectionLength(Seller);
    expect(amount2).toBe(4);

    const [nft3] = await getTunegoNftById(Seller, 2);
    const [nft4] = await getTunegoNftById(Seller, 3);
    expect(nft3.itemId).toBe(itemId);
    expect(nft3.collectionId).toBe(collectionId);
    expect(nft3.edition).toBe(3);
    expect(nft4.itemId).toBe(itemId);
    expect(nft4.collectionId).toBe(collectionId);
    expect(nft4.edition).toBe(4);
  });

  it('should be possible to mint tunego nfts with additional info', async () => {
    await deployTunegoNfts();
    const Seller = await getAccountAddress('Seller');

    await setupTunegoNftsOnAccount(Seller);

    const itemId = 'test item id';
    const collectionId = 'test collection id';
    const quantity = 2;
    const metadata = getRandomMetadata();
    const royalties = [];
    const additionalInfo = { info: 'testInfo' };

    await shallPass(
      mintTunegoNfts(
        Seller,
        itemId,
        collectionId,
        quantity,
        metadata,
        royalties,
        additionalInfo,
      ),
    );

    const [collectibleAdditionalInfo] = await getTunegoNftAdditionalInfoById(
      Seller,
      0,
    );
    expect(collectibleAdditionalInfo).toEqual(additionalInfo);
  });

  it('should be possible to read tunego nfts metadata views', async () => {
    await deployTunegoNfts();
    const Seller = await getAccountAddress('Seller');
    const RoyaltyReceiver = await getAccountAddress('RoyaltyReceiver');
    const royaltyPercentage = 2.5;

    await setupTunegoNftsOnAccount(Seller);

    const itemId = 'test item id';
    const collectionId = 'test collection id';
    const metadata = getRandomMetadata();
    const royalties = [
      { recipient: RoyaltyReceiver, percentage: royaltyPercentage },
    ];
    const additionalInfo = { test: 'testInfo' };
    const quantity = 2;

    await shallPass(
      mintTunegoNfts(
        Seller,
        itemId,
        collectionId,
        quantity,
        metadata,
        royalties,
        additionalInfo,
      ),
    );

    const [amount] = await getTunegoNftsCollectionLength(Seller);
    expect(amount).toBe(2);

    const [nftViews] = await getTunegoNftViewsById(Seller, 0);
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
    await deployTunegoNfts();
    const Seller = await getAccountAddress('Seller');
    const Buyer = await getAccountAddress('Buyer');

    await setupTunegoNftsOnAccount(Seller);
    await setupTunegoNftsOnAccount(Buyer);

    await shallRevert(transferTunegoNft(Seller, Buyer, 9999));
  });

  it('should be possible to withdraw NFT and deposit to another accounts collection', async () => {
    await deployTunegoNfts();
    const Seller = await getAccountAddress('Seller');
    const Buyer = await getAccountAddress('Buyer');

    await setupTunegoNftsOnAccount(Seller);
    await setupTunegoNftsOnAccount(Buyer);

    await shallPass(mintRandomTunegoNfts(Seller));
    await shallPass(transferTunegoNft(Seller, Buyer, 0));
  });

  it('should be possible to transfer NFTMinter resource', async () => {
    await deployTunegoNfts();
    const NftsHolder = await getTunegoAdminAddress();
    const CurrentAdmin = await getTunegoAdminAddress();
    const NewAdmin = await getAccountAddress('NewAdmin');

    await setupTunegoNftsOnAccount(NftsHolder);
    await shallPass(mintRandomTunegoNfts(NftsHolder, 1, {}, CurrentAdmin));
    await shallRevert(mintRandomTunegoNfts(NftsHolder, 1, {}, NewAdmin));

    const [amount1] = await getTunegoNftsCollectionLength(NftsHolder);
    expect(amount1).toBe(1);

    await shallPass(transferNFTMinter(CurrentAdmin, NewAdmin));
    await shallRevert(mintRandomTunegoNfts(NftsHolder, 1, {}, CurrentAdmin));
    await shallPass(mintRandomTunegoNfts(NftsHolder, 1, {}, NewAdmin));

    const [amount2] = await getTunegoNftsCollectionLength(NftsHolder);
    expect(amount2).toBe(2);
  });

  it('should be possible to create new NFTMinter resource', async () => {
    await deployTunegoNfts();
    const NftsHolder = await getTunegoAdminAddress();
    const CurrentAdmin = await getTunegoAdminAddress();
    const NewAdmin = await getAccountAddress('NewAdmin');

    await setupTunegoNftsOnAccount(NftsHolder);
    await shallPass(mintRandomTunegoNfts(NftsHolder, 1, {}, CurrentAdmin));
    await shallRevert(mintRandomTunegoNfts(NftsHolder, 1, {}, NewAdmin));

    const [amount1] = await getTunegoNftsCollectionLength(NftsHolder);
    expect(amount1).toBe(1);

    await shallPass(createNFTMinter(CurrentAdmin, NewAdmin));
    await shallPass(mintRandomTunegoNfts(NftsHolder, 1, {}, CurrentAdmin));
    await shallPass(mintRandomTunegoNfts(NftsHolder, 1, {}, NewAdmin));

    const [amount2] = await getTunegoNftsCollectionLength(NftsHolder);
    expect(amount2).toBe(3);
  });
});
