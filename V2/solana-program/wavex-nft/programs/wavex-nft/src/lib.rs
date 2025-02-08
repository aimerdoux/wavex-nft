use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use mpl_token_metadata::state::DataV2;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // Replace with actual program ID

#[program]
pub mod wavex_nft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.authority = ctx.accounts.authority.key();
        program_state.template_count = 0;
        program_state.event_count = 0;
        Ok(())
    }

    // Template Management
    pub fn create_template(
        ctx: Context<CreateTemplate>,
        name: String,
        base_balance: u64,
        price: u64,
        discount: u8,
        is_vip: bool,
        metadata_uri: String,
    ) -> Result<()> {
        require!(discount <= 100, WavexError::InvalidDiscount);
        require!(!name.is_empty(), WavexError::EmptyName);

        let template = &mut ctx.accounts.template;
        let program_state = &mut ctx.accounts.program_state;

        program_state.template_count += 1;
        
        template.name = name;
        template.base_balance = base_balance;
        template.price = price;
        template.discount = discount;
        template.is_vip = is_vip;
        template.metadata_uri = metadata_uri;
        template.active = true;
        template.authority = ctx.accounts.authority.key();

        Ok(())
    }

    // Event Management
    pub fn create_event(
        ctx: Context<CreateEvent>,
        name: String,
        price: u64,
        capacity: u32,
        event_type: u8,
    ) -> Result<()> {
        require!(!name.is_empty(), WavexError::EmptyName);
        require!(capacity > 0, WavexError::InvalidCapacity);

        let event = &mut ctx.accounts.event;
        let program_state = &mut ctx.accounts.program_state;

        program_state.event_count += 1;

        event.name = name;
        event.price = price;
        event.capacity = capacity;
        event.sold_count = 0;
        event.active = true;
        event.event_type = event_type;
        event.authority = ctx.accounts.authority.key();

        Ok(())
    }

    // NFT Minting
    pub fn mint_nft(
        ctx: Context<MintNFT>,
        template_id: u64,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        require!(!name.is_empty(), WavexError::EmptyName);
        require!(!symbol.is_empty(), WavexError::EmptySymbol);
        require!(!uri.is_empty(), WavexError::EmptyUri);

        let template = &ctx.accounts.template;
        require!(template.active, WavexError::TemplateInactive);

        // Create metadata account
        let metadata_infos = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];

        let creator = vec![
            mpl_token_metadata::state::Creator {
                address: ctx.accounts.authority.key(),
                verified: true,
                share: 100,
            }
        ];

        // Create metadata
        let data = DataV2 {
            name: name.clone(),
            symbol: symbol.clone(),
            uri: uri.clone(),
            seller_fee_basis_points: 0,
            creators: Some(creator),
            collection: None,
            uses: None,
        };

        // Create token account
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );

        // Mint token
        token::mint_to(cpi_ctx, 1)?;

        // Initialize balance based on template
        let balance_seeds = &[
            b"balance",
            ctx.accounts.token_account.key().as_ref(),
            &[ctx.bumps.balance],
        ];
        let balance_signer = &[&balance_seeds[..]];

        let balance = &mut ctx.accounts.balance;
        balance.amount = template.base_balance;
        balance.owner = ctx.accounts.authority.key();
        balance.token_account = ctx.accounts.token_account.key();

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ProgramState::LEN
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTemplate<'info> {
    #[account(
        init,
        payer = authority,
        space = Template::LEN
    )]
    pub template: Account<'info, Template>,

    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateEvent<'info> {
    #[account(
        init,
        payer = authority,
        space = Event::LEN
    )]
    pub event: Account<'info, Event>,

    #[account(mut)]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(template_id: u64)]
pub struct MintNFT<'info> {
    #[account(mut)]
    pub mint: Signer<'info>,

    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"template", template_id.to_le_bytes().as_ref()],
        bump,
        constraint = template.active @ WavexError::TemplateInactive
    )]
    pub template: Account<'info, Template>,

    #[account(
        init,
        payer = authority,
        space = Balance::LEN,
        seeds = [b"balance", token_account.key().as_ref()],
        bump
    )]
    pub balance: Account<'info, Balance>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub template_count: u64,
    pub event_count: u64,
}

#[account]
pub struct Template {
    pub name: String,
    pub base_balance: u64,
    pub price: u64,
    pub discount: u8,
    pub is_vip: bool,
    pub metadata_uri: String,
    pub active: bool,
    pub authority: Pubkey,
}

#[account]
pub struct Event {
    pub name: String,
    pub price: u64,
    pub capacity: u32,
    pub sold_count: u32,
    pub active: bool,
    pub event_type: u8,
    pub authority: Pubkey,
}

impl ProgramState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // template_count
        8; // event_count
}

impl Template {
    pub const LEN: usize = 8 + // discriminator
        32 + // name (max)
        8 + // base_balance
        8 + // price
        1 + // discount
        1 + // is_vip
        64 + // metadata_uri (max)
        1 + // active
        32; // authority
}

impl Event {
    pub const LEN: usize = 8 + // discriminator
        32 + // name (max)
        8 + // price
        4 + // capacity
        4 + // sold_count
        1 + // active
        1 + // event_type
        32; // authority
}

#[account]
pub struct Balance {
    pub amount: u64,
    pub owner: Pubkey,
    pub token_account: Pubkey,
}

impl Balance {
    pub const LEN: usize = 8 + // discriminator
        8 + // amount
        32 + // owner
        32; // token_account
}

#[error_code]
pub enum WavexError {
    #[msg("Invalid discount percentage")]
    InvalidDiscount,
    #[msg("Name cannot be empty")]
    EmptyName,
    #[msg("Symbol cannot be empty")]
    EmptySymbol,
    #[msg("URI cannot be empty")]
    EmptyUri,
    #[msg("Invalid capacity")]
    InvalidCapacity,
    #[msg("Template not found")]
    TemplateNotFound,
    #[msg("Template is inactive")]
    TemplateInactive,
    #[msg("Event not found")]
    EventNotFound,
    #[msg("Event is full")]
    EventFull,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Not authorized")]
    NotAuthorized,
}