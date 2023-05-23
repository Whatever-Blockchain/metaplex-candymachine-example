import { PublicKey as web3Pubkey } from "@solana/web3.js";
import secret from "./my-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCandyMachine, create, addConfigLines, fetchCandyMachine, mintV2 } from "@metaplex-foundation/mpl-candy-machine";
import { createGenericFile, createSignerFromKeypair, generateSigner, KeypairSigner, percentAmount, publicKey, PublicKey, signerIdentity, some, transactionBuilder, Umi } from "@metaplex-foundation/umi";
import { createNft, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { nftStorageUploader } from "@metaplex-foundation/umi-uploader-nft-storage";
import * as fs from "fs";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-essentials";


async function main() {

  // 1. Init Umi
  const umi = await initUmi();
  
  // 2. Generate UmiSigner
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
  const umiSigner = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(umiSigner));
  console.log(`UmiSigner's Pubkey: ${new web3Pubkey(umiSigner.publicKey.bytes).toString()}`);

  // 00. Get Current Balance.
  let amount = await umi.rpc.getBalance(umiSigner.publicKey);
  console.log(`Initial Balance: ${ Number(amount.basisPoints) / LAMPORTS_PER_SOL }`);

  // 3. Mint Collection NFT
  const tempCollectionMintPubkey = "BcsNwoKTooLR38ecsg2BCdeKJfY3HnLvbEuwDQ6vuD1H";
  let collectionMintKeypiar = null;
  if (tempCollectionMintPubkey == null) {
    const metadataUri = 'https://arweave.net/gVvkvEQ7XEB5dsSPQVxLCcAZ8q8ddzPjRYDo2fBOpmQ';
    collectionMintKeypiar = await mintCollectionNft(umi, umiSigner, metadataUri);
    console.log(`CollectionMint's Pubkey: ${new web3Pubkey(collectionMintKeypiar.publicKey.bytes).toString()}`);
  }

  amount = await umi.rpc.getBalance(umiSigner.publicKey);
  console.log(`[After 3] Current Balance: ${ Number(amount.basisPoints) / LAMPORTS_PER_SOL }`);

  // 4. Make Candy Machine Settings
  // const candyMachineSetting = await makeCandyMachineSettings(umi, umiSigner);
  
  // 5. Create CandyMachine
  const tempCandyMachinePubkey = '2eDnTsP59vwqvmfZiwXdNYjgcXFBqgNsk6HCvxCYT9Ek';
  // let candyMachineKeypair = null;
  if(tempCandyMachinePubkey == null) {
    const candyMachineKeypair = await makeCandyMachine(umi, publicKey(tempCollectionMintPubkey));
    if (candyMachineKeypair != null ) {
      console.log(`Created CandyMachine's Pubkey : ${new web3Pubkey(candyMachineKeypair.publicKey.bytes).toString()}`);
    } else {
      console.error(`Failed to create CandyMachine`);
    }
  }

  amount = await umi.rpc.getBalance(umiSigner.publicKey);
  console.log(`[After 5] Current Balance: ${ Number(amount.basisPoints) / LAMPORTS_PER_SOL }`);

  if (tempCandyMachinePubkey != null) {
    // 6. upload File
    const filePath = "uploads/";
    const fileName = "1.png";
    let fileUri = ["https://nftstorage.link/ipfs/bafybeigvwcqwdf752vvwggz64nbuuebff4kytug2zzsr75e6vbafmxrzzq", "https://nftstorage.link/ipfs/bafkreigh2pt46jvohnzro7brzqfgldletiiimqpcvnjas4cvx527lvqb4q", "https://nftstorage.link/ipfs/bafkreigh2pt46jvohnzro7brzqfgldletiiimqpcvnjas4cvx527lvqb4q"];
    if (fileUri[2] == null) {
      fileUri[2] = await uploadFile(umi, filePath, fileName);
      console.log(`File Uri : ${fileUri}`);
    }
    amount = await umi.rpc.getBalance(umiSigner.publicKey);
    console.log(`[After 6] Current Balance: ${ Number(amount.basisPoints) / LAMPORTS_PER_SOL }`);

    // 7. upload Metadata
    let metadataUri = ["https://nftstorage.link/ipfs/bafkreibn24kliedp2ka7rigsg5ooty5eagldvlbcwead4dufrvyojf5yoq", "https://nftstorage.link/ipfs/bafkreid532bmhcont6g52gx6chtaltjv5woztbwsw2gk2i6wn6kjokdmfe", "https://nftstorage.link/ipfs/bafkreif4stq4ddu4sbp22kzrn242bouvglbyv6axbufzyzrjuzvzsokw7m"];
    if (metadataUri[2] == null) {
      metadataUri[2] = await uploadMetadata(umi, fileUri, fileName);
      console.log(`Metadata Uri: ${metadataUri}`);
    }
    amount = await umi.rpc.getBalance(umiSigner.publicKey);
    console.log(`[After 7] Current Balance: ${ Number(amount.basisPoints) / LAMPORTS_PER_SOL }`);

    // 8. insert Item
    if (false) {
      const isSuccess = await insertItems(umi, publicKey(tempCandyMachinePubkey), metadataUri);
      console.log(`Insert Items Result: ${isSuccess}`);
    }

    amount = await umi.rpc.getBalance(umiSigner.publicKey);
    console.log(`[After 8] Current Balance: ${ Number(amount.basisPoints) / LAMPORTS_PER_SOL }`);

    // 9. Fetch CandyMachine
    const candyMachine = await fetchCandyMachine(umi, publicKey(tempCandyMachinePubkey));

    console.log(`[ CandyMachine Info ]`);
    console.log(`- Pubkey: ${new web3Pubkey(candyMachine.publicKey.bytes).toString()}`);
    console.log(`- Mint Auth: ${new web3Pubkey(candyMachine.mintAuthority.bytes).toString()}`);
    console.log(`- Total Number of NFTs: ${candyMachine.data.itemsAvailable.toString()}`);
    console.log(`- Number of Loaded NFTs: ${candyMachine.itemsLoaded.toString()}`);
    console.log(`- Number of Minted NFTs: ${candyMachine.itemsRedeemed.toString()}`);

    // 10. Mint
    // const nftMintKeypair = await mintNft(umi, publicKey(tempCandyMachinePubkey), publicKey(tempCollectionMintPubkey));
    // if (nftMintKeypair != null) {
    //   console.log(`nftMint Pubkey: ${new web3Pubkey(nftMintKeypair.publicKey.bytes).toString()}`);
    // }

  }
}

main();

async function initUmi(): Promise<Umi> {
  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplCandyMachine())
    .use(nftStorageUploader());

  return umi;
}

async function mintCollectionNft(umi: Umi, updateAuth: KeypairSigner, metadataUri: string): Promise<KeypairSigner> {
  const collectionMint = generateSigner(umi);
  await createNft(umi, {
    mint: collectionMint,
    authority: updateAuth,
    name: "Taegit's Collection NFT",
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
    isCollection: true,
  }).sendAndConfirm(umi);

  return collectionMint;
}

async function makeCandyMachine(umi: Umi, collectionMintPubkey: PublicKey): Promise<KeypairSigner | null> {
  const candyMachineKeypair = generateSigner(umi);
  
  const instruction = await create(umi, {
    candyMachine: candyMachineKeypair,
    collectionMint: collectionMintPubkey,
    tokenStandard: TokenStandard.NonFungible,
    collectionUpdateAuthority: umi.identity,
    itemsAvailable: 3,
    sellerFeeBasisPoints: percentAmount(10, 2),
    creators: [
      {
        address: umi.identity.publicKey,
        verified: true,
        percentageShare: 100,
      },
    ],
    symbol: 'Taegit',
    configLineSettings: some({
      prefixName: '',
      nameLength: 32,
      prefixUri: '',
      uriLength: 200,
      isSequential: false,
    }),
  });

  const txResult = await transactionBuilder().add(instruction).sendAndConfirm(umi);
  console.log('create Candy Machine Result');
  console.log(txResult.result);

  if (txResult.result.value.err == null) {
    return candyMachineKeypair;
  } else {
    return null;
  }
}

// upload file
async function uploadFile(umi: Umi, filePath: string, fileName: string): Promise<string> {
  const fileBuf = fs.readFileSync(filePath + fileName);
  const genericFile = createGenericFile(fileBuf, fileName);
  const [fileUri] = await umi.uploader.upload([genericFile]);

  return fileUri;
}

// upload Json metadata
async function uploadMetadata(umi: Umi, fileUri: (string | null)[], fileName: string): Promise<string> {
  const uri = await umi.uploader.uploadJson({
    name: "NFT " + fileName,
    description: "",
    image: fileUri,
  });

  return uri;
}

// insert Items
async function insertItems(umi: Umi, candyMachineAddress: PublicKey, metadatUri: string[]): Promise<boolean> {
  const txResult = await addConfigLines(umi, {
    candyMachine: candyMachineAddress,
    index: 0,
    configLines: [
      { name: "Taegit NFT #1", uri: metadatUri[0] },
      { name: "Taegit NFT #2", uri: metadatUri[1] },
      { name: "Taegit NFT #3", uri: metadatUri[2] },
    ],
  }).sendAndConfirm(umi);

  console.log(txResult);
  if (txResult.result.value.err == null) {
    return true;
  } else {
    return false;
  }
}

async function mintNft(umi: Umi, candyMachineAddress: PublicKey, collectionNftAddress: PublicKey): Promise<KeypairSigner | null> {

  const nftMint = generateSigner(umi);

  const txResult = await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))
    .add(
      mintV2(umi, {
        candyMachine: candyMachineAddress,
        nftMint: nftMint,
        collectionMint: collectionNftAddress,
        collectionUpdateAuthority: umi.identity.publicKey,
      })
    ).sendAndConfirm(umi);

  console.log(txResult);
  if (txResult.result.value.err == null) {
    return nftMint;
  } else {
    return null;
  }
}