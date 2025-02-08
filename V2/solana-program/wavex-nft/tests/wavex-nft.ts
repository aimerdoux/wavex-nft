import * as anchor from '@project-serum/anchor';
import { Program, Idl } from '@project-serum/anchor';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { assert } from 'chai';
import { Keypair, PublicKey } from '@solana/web3.js';

// Account interfaces
interface ProgramState {
  authority: PublicKey;
  templateCount: anchor.BN;
  eventCount: anchor.BN;
}

interface Template {
  name: string;
  baseBalance: anchor.BN;
  price: anchor.BN;
  discount: number;
  isVip: boolean;
  metadataUri: string;
  active: boolean;
  authority: PublicKey;
}

interface Event {
  name: string;
  price: anchor.BN;
  capacity: number;
  soldCount: number;
  active: boolean;
  eventType: number;
  authority: PublicKey;
}

interface Balance {
  amount: anchor.BN;
  owner: PublicKey;
  tokenAccount: PublicKey;
}

// IDL interface definition
interface WavexNftIdl extends Idl {
  version: "0.1.0";
  name: "wavex_nft";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "programState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "createTemplate";
      accounts: [
        {
          name: "template";
          isMut: true;
          isSigner: false;
        },
        {
          name: "programState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "name";
          type: "string";
        },
        {
          name: "baseBalance";
          type: "u64";
        },
        {
          name: "price";
          type: "u64";
        },
        {
          name: "discount";
          type: "u8";
        },
        {
          name: "isVip";
          type: "bool";
        },
        {
          name: "metadataUri";
          type: "string";
        }
      ];
    },
    {
      name: "createEvent";
      accounts: [
        {
          name: "event";
          isMut: true;
          isSigner: false;
        },
        {
          name: "programState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "name";
          type: "string";
        },
        {
          name: "price";
          type: "u64";
        },
        {
          name: "capacity";
          type: "u32";
        },
        {
          name: "eventType";
          type: "u8";
        }
      ];
    },
    {
      name: "mintNft";
      accounts: [
        {
          name: "mint";
          isMut: true;
          isSigner: true;
        },
        {
          name: "metadata";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "template";
          isMut: false;
          isSigner: false;
        },
        {
          name: "balance";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "templateId";
          type: "u64";
        },
        {
          name: "name";
          type: "string";
        },
        {
          name: "symbol";
          type: "string";
        },
        {
          name: "uri";
          type: "string";
        }
      ];
    },
    {
      name: "initializeBalance";
      accounts: [
        {
          name: "balance";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "transferBalance";
      accounts: [
        {
          name: "fromBalance";
          isMut: true;
          isSigner: false;
        },
        {
          name: "toBalance";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "programState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "templateCount";
            type: "u64";
          },
          {
            name: "eventCount";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "template";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            type: "string";
          },
          {
            name: "baseBalance";
            type: "u64";
          },
          {
            name: "price";
            type: "u64";
          },
          {
            name: "discount";
            type: "u8";
          },
          {
            name: "isVip";
            type: "bool";
          },
          {
            name: "metadataUri";
            type: "string";
          },
          {
            name: "active";
            type: "bool";
          },
          {
            name: "authority";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "event";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            type: "string";
          },
          {
            name: "price";
            type: "u64";
          },
          {
            name: "capacity";
            type: "u32";
          },
          {
            name: "soldCount";
            type: "u32";
          },
          {
            name: "active";
            type: "bool";
          },
          {
            name: "eventType";
            type: "u8";
          },
          {
            name: "authority";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "balance";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "owner";
            type: "publicKey";
          },
          {
            name: "tokenAccount";
            type: "publicKey";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidDiscount";
      msg: "Invalid discount percentage";
    },
    {
      code: 6001;
      name: "EmptyName";
      msg: "Name cannot be empty";
    },
    {
      code: 6002;
      name: "EmptySymbol";
      msg: "Symbol cannot be empty";
    },
    {
      code: 6003;
      name: "EmptyUri";
      msg: "URI cannot be empty";
    },
    {
      code: 6004;
      name: "InvalidCapacity";
      msg: "Invalid capacity";
    },
    {
      code: 6005;
      name: "TemplateNotFound";
      msg: "Template not found";
    },
    {
      code: 6006;
      name: "TemplateInactive";
      msg: "Template is inactive";
    },
    {
      code: 6007;
      name: "EventNotFound";
      msg: "Event not found";
    },
    {
      code: 6008;
      name: "EventFull";
      msg: "Event is full";
    },
    {
      code: 6009;
      name: "InsufficientBalance";
      msg: "Insufficient balance";
    },
    {
      code: 6010;
      name: "NotAuthorized";
      msg: "Not authorized";
    }
  ];
}

describe('WaveX NFT Tests', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.WavexNft as Program<WavexNftIdl>;
  
  // Test accounts
  let programStatePDA: anchor.web3.PublicKey;
  let templatePDA: anchor.web3.PublicKey;
  let eventPDA: anchor.web3.PublicKey;
  let mint: anchor.web3.PublicKey;
  let tokenAccount: anchor.web3.PublicKey;
  
  // Create a new keypair for testing
  const testKeypair = Keypair.generate();
  
  before(async () => {
    // Setup test accounts
    [programStatePDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('program_state')],
      program.programId
    );
    
    [templatePDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('template'), Buffer.from([0])],
      program.programId
    );
    
    [eventPDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from('event'), Buffer.from([0])],
      program.programId
    );

    // Fund the test account
    const signature = await provider.connection.requestAirdrop(
      testKeypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  describe('Program Initialization', () => {
    it('Initializes program state', async () => {
      await program.methods
        .initialize()
        .accounts({
          programState: programStatePDA,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const programState = await program.account.programState.fetch(programStatePDA) as ProgramState;
      assert(programState.authority.equals(provider.wallet.publicKey));
      assert.equal(programState.templateCount.toNumber(), 0);
      assert.equal(programState.eventCount.toNumber(), 0);
    });
  });

  describe('Template Management', () => {
    const templateName = 'Test Template';
    const baseBalance = new anchor.BN(1000);
    const price = new anchor.BN(100);
    const discount = 10;
    const isVip = false;
    const metadataUri = 'https://test.uri/metadata.json';

    it('Creates template with valid parameters', async () => {
      await program.methods
        .createTemplate(
          templateName,
          baseBalance,
          price,
          discount,
          isVip,
          metadataUri
        )
        .accounts({
          template: templatePDA,
          programState: programStatePDA,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const template = await program.account.template.fetch(templatePDA) as Template;
      assert.equal(template.name, templateName);
      assert.equal(template.baseBalance.toNumber(), baseBalance.toNumber());
      assert.equal(template.price.toNumber(), price.toNumber());
      assert.equal(template.discount, discount);
      assert.equal(template.isVip, isVip);
      assert.equal(template.metadataUri, metadataUri);
      assert.equal(template.active, true);
    });

    it('Updates template count in program state', async () => {
      const programState = await program.account.programState.fetch(programStatePDA) as ProgramState;
      assert.equal(programState.templateCount.toNumber(), 1);
    });

    it('Fails with invalid discount', async () => {
      try {
        await program.methods
          .createTemplate(
            templateName,
            baseBalance,
            price,
            101, // Invalid discount > 100
            isVip,
            metadataUri
          )
          .accounts({
            template: templatePDA,
            programState: programStatePDA,
            authority: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        assert.fail('Should have failed with invalid discount');
      } catch (error: any) {
        assert.include(error.toString(), 'Invalid discount percentage');
      }
    });
  });

  describe('Event Management', () => {
    const eventName = 'Test Event';
    const eventPrice = new anchor.BN(200);
    const capacity = 100;
    const eventType = 1;

    it('Creates event with valid parameters', async () => {
      await program.methods
        .createEvent(
          eventName,
          eventPrice,
          capacity,
          eventType
        )
        .accounts({
          event: eventPDA,
          programState: programStatePDA,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const event = await program.account.event.fetch(eventPDA) as Event;
      assert.equal(event.name, eventName);
      assert.equal(event.price.toNumber(), eventPrice.toNumber());
      assert.equal(event.capacity, capacity);
      assert.equal(event.soldCount, 0);
      assert.equal(event.active, true);
      assert.equal(event.eventType, eventType);
    });

    it('Updates event count in program state', async () => {
      const programState = await program.account.programState.fetch(programStatePDA) as ProgramState;
      assert.equal(programState.eventCount.toNumber(), 1);
    });

    it('Fails with invalid capacity', async () => {
      try {
        await program.methods
          .createEvent(
            eventName,
            eventPrice,
            0, // Invalid capacity
            eventType
          )
          .accounts({
            event: eventPDA,
            programState: programStatePDA,
            authority: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        assert.fail('Should have failed with invalid capacity');
      } catch (error: any) {
        assert.include(error.toString(), 'Invalid capacity');
      }
    });
  });

  describe('NFT Minting', () => {
    const nftName = 'Test NFT';
    const symbol = 'TEST';
    const uri = 'https://test.uri/nft.json';
    let mintKeypair: Keypair;

    beforeEach(async () => {
      // Create new mint keypair for each test
      mintKeypair = Keypair.generate();
      
      // Create mint account
      await createMint(
        provider.connection,
        testKeypair,
        provider.wallet.publicKey,
        provider.wallet.publicKey,
        0,
        mintKeypair
      );

      // Create associated token account
      tokenAccount = await createAssociatedTokenAccount(
        provider.connection,
        testKeypair,
        mintKeypair.publicKey,
        provider.wallet.publicKey
      );
    });

    it('Mints NFT from template', async () => {
      const [balancePDA] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('balance'), tokenAccount.toBuffer()],
        program.programId
      );

      await program.methods
        .mintNft(
          new anchor.BN(0), // template_id
          nftName,
          symbol,
          uri
        )
        .accounts({
          mint: mintKeypair.publicKey,
          metadata: anchor.web3.PublicKey.findProgramAddressSync(
            [
              Buffer.from('metadata'),
              TOKEN_PROGRAM_ID.toBuffer(),
              mintKeypair.publicKey.toBuffer(),
            ],
            program.programId
          )[0],
          tokenAccount,
          template: templatePDA,
          balance: balancePDA,
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.web3.SystemProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mintKeypair])
        .rpc();

      // Verify NFT was minted
      const balance = await provider.connection.getTokenAccountBalance(tokenAccount);
      assert.equal(balance.value.uiAmount, 1);

      // Verify balance was initialized
      const balanceAccount = await program.account.balance.fetch(balancePDA) as Balance;
      assert.equal(balanceAccount.amount.toNumber(), 1000); // baseBalance from template
    });
  });

  describe('Balance Management', () => {
    let fromBalance: anchor.web3.PublicKey;
    let toBalance: anchor.web3.PublicKey;
    const transferAmount = new anchor.BN(100);

    before(async () => {
      // Setup balance accounts for testing
      [fromBalance] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('balance'), Buffer.from('from')],
        program.programId
      );
      
      [toBalance] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from('balance'), Buffer.from('to')],
        program.programId
      );

      // Initialize balance accounts
      await program.methods
        .initializeBalance(new anchor.BN(1000))
        .accounts({
          balance: fromBalance,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .initializeBalance(new anchor.BN(0))
        .accounts({
          balance: toBalance,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    });

    it('Transfers balance between accounts', async () => {
      await program.methods
        .transferBalance(transferAmount)
        .accounts({
          fromBalance,
          toBalance,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify balances
      const fromBalanceAccount = await program.account.balance.fetch(fromBalance) as Balance;
      const toBalanceAccount = await program.account.balance.fetch(toBalance) as Balance;
      
      assert.equal(fromBalanceAccount.amount.toNumber(), 900);
      assert.equal(toBalanceAccount.amount.toNumber(), 100);
    });

    it('Fails with insufficient balance', async () => {
      try {
        await program.methods
          .transferBalance(new anchor.BN(1000))
          .accounts({
            fromBalance,
            toBalance,
            authority: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        assert.fail('Should have failed with insufficient balance');
      } catch (error: any) {
        assert.include(error.toString(), 'Insufficient balance');
      }
    });

    it('Verifies balance ownership', async () => {
      const unauthorizedKeypair = Keypair.generate();
      try {
        await program.methods
          .transferBalance(transferAmount)
          .accounts({
            fromBalance,
            toBalance,
            authority: unauthorizedKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([unauthorizedKeypair])
          .rpc();
        assert.fail('Should have failed with unauthorized access');
      } catch (error: any) {
        assert.include(error.toString(), 'Not authorized');
      }
    });
  });
});