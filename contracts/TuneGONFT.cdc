import FlowToken from "./FlowToken.cdc"
import FungibleToken from "./FungibleToken.cdc"
import NonFungibleToken from "./NonFungibleToken.cdc"
import MetadataViews from "./MetadataViews.cdc"

// Contract
//
pub contract TuneGONFT: NonFungibleToken {

    // Events
    //
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(
        id: UInt64,
        itemId: String,
        collectionId: String,
        edition: UInt64,
        metadata: Metadata,
        royalties: [Royalty],
        additionalInfo: {String: String}
    )

    // Named Paths
    //
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let MinterStoragePath: StoragePath

    // totalSupply
    // The total number of TuneGONFT that have been minted
    //
    pub var totalSupply: UInt64

    // itemEditions
    //
    access(contract) var itemEditions: {String: UInt64}

    // Metadata
    //
    pub struct Metadata {
        pub let title: String
        pub let description: String
        pub let rarity: String
        pub let creator: String
        pub let credits: String
        pub let asset: String

        init(
            title: String,
            description: String,
            rarity: String,
            creator: String,
            credits: String,
            asset: String,
        ) {
            self.title = title
            self.description = description
            self.rarity = rarity
            self.creator = creator
            self.credits = credits
            self.asset = asset
        }
    }

    // Edition
    //
    pub struct Edition {
        pub let edition: UInt64
        pub let totalEditions: UInt64

        init(edition: UInt64, totalEditions: UInt64) {
            self.edition = edition
            self.totalEditions = totalEditions
        }
    }

    // Royalty
    //
    pub struct Royalty {
        pub let receiver: Address 
        pub let percentage: UFix64

        init(receiver: Address, percentage: UFix64) {
            self.receiver = receiver
            self.percentage = percentage
        }
    }

    // NFT
    //
    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        pub let id: UInt64
        pub let itemId: String
        pub let collectionId: String
        pub let edition: UInt64
        access(self) let metadata: Metadata
        access(self) let royalties: [Royalty]
        access(self) let additionalInfo: {String: String}

        init(
            id: UInt64,
            itemId: String,
            collectionId: String,
            edition: UInt64,
            metadata: Metadata,
            royalties: [Royalty],
            additionalInfo: {String: String}
        ) {
            self.id = id
            self.itemId = itemId
            self.collectionId = collectionId
            self.edition = edition
            self.metadata = metadata
            self.royalties = royalties
            self.additionalInfo = additionalInfo
        }

        pub fun getAdditionalInfo(): {String: String} {
            return self.additionalInfo
        }

        pub fun totalEditions(): UInt64 {
            return TuneGONFT.itemEditions[self.itemId] != nil
                ? TuneGONFT.itemEditions[self.itemId]!
                : UInt64(0)
        }

        pub fun getViews(): [Type] {
            return [
                Type<Metadata>(),
                Type<Edition>(),
                Type<[Royalty]>(),
                Type<MetadataViews.Display>()
            ]
        }

        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<Metadata>():
                    return self.metadata
                case Type<[Royalty]>():
                    return self.royalties
                case Type<Edition>():
                    return Edition(
                        edition: self.edition,
                        totalEditions: self.totalEditions()
                    )
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.metadata.title,
                        description: self.metadata.description,
                        thumbnail: MetadataViews.HTTPFile(
                            url: self.metadata.asset
                        )
                    )
            }

            return nil
        }
    }

    // TuneGONFTCollectionPublic
    //
    pub resource interface TuneGONFTCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowTuneGONFT(id: UInt64): &TuneGONFT.NFT? {
            // If the result isn't nil, the id of the returned reference
            // should be the same as the argument to the function
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow TuneGONFT reference: The ID of the returned reference is incorrect"
            }
        }
    }

    // Collection
    //
    pub resource Collection: TuneGONFTCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {

        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token
        }

        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @TuneGONFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        pub fun borrowTuneGONFT(id: UInt64): &TuneGONFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
                return ref as! &TuneGONFT.NFT
            } else {
                return nil
            }
        }

        destroy() {
            destroy self.ownedNFTs
        }

        init () {
            self.ownedNFTs <- {}
        }
    }

    // createEmptyCollection
    //
    pub fun createEmptyCollection(): @TuneGONFT.Collection {
        return <- create Collection()
    }

    // NFTMinter
    //
	pub resource NFTMinter {

		access(all) fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            itemId: String,
            collectionId: String,
            metadata: Metadata,
            royalties: [Royalty],
            additionalInfo: {String: String}
        ) {
            var totalRoyaltiesPercentage: UFix64 = 0.0
            for royalty in royalties {
                let account = getAccount(royalty.receiver)
                let vault = account.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                assert(vault.borrow() != nil, message: "Missing royalty receiver vault")

                totalRoyaltiesPercentage = totalRoyaltiesPercentage + royalty.percentage;
            }
            assert(totalRoyaltiesPercentage <= 95.0, message: "Total royalties percentage is too high")

            let totalEditions = TuneGONFT.itemEditions[itemId] != nil ? TuneGONFT.itemEditions[itemId] : UInt64(0)
            let edition = totalEditions! + UInt64(1)

            emit Minted(
                id: TuneGONFT.totalSupply,
                itemId: itemId,
                collectionId: collectionId,
                edition: edition,
                metadata: metadata,
                royalties: royalties,
                additionalInfo: additionalInfo
            )

			recipient.deposit(token: <-create TuneGONFT.NFT(
                id: TuneGONFT.totalSupply,
                itemId: itemId,
                collectionId: collectionId,
                edition: edition,
                metadata: metadata,
                royalties: royalties,
                additionalInfo: additionalInfo
            ))

            TuneGONFT.itemEditions[itemId] = totalEditions! + UInt64(1)
            TuneGONFT.totalSupply = TuneGONFT.totalSupply + UInt64(1)
		}

        access(all) fun batchMintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            itemId: String,
            collectionId: String,
            metadata: Metadata,
            royalties: [Royalty],
            additionalInfo: {String: String},
            quantity: UInt64
        ) {
            var i: UInt64 = 0
            while i < quantity {
                i = i + UInt64(1)
                self.mintNFT(
                    recipient: recipient,
                    itemId: itemId,
                    collectionId: collectionId,
                    metadata: metadata,
                    royalties: royalties,
                    additionalInfo: additionalInfo
                )
            }
        }

        pub fun createNFTMinter(): @NFTMinter {
            return <- create NFTMinter()
        }
    }

    init () {
        self.CollectionStoragePath = /storage/tunegoNFTCollection
        self.CollectionPublicPath = /public/tunegoNFTCollection
        self.MinterStoragePath = /storage/tunegoNFTMinter

        self.totalSupply = 0
        self.itemEditions = {}

        let minter <- create NFTMinter()
        self.account.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}
