use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],  
    instruction_data: &[u8],
) -> ProgramResult {
    let (_key, rem) = instruction_data.split_first().unwrap_or((&0, &[]));

    let value: u64 = rem
        .get(0..8)
        .and_then(|slice| slice.try_into().ok())
        .map(u64::from_le_bytes)
        .unwrap_or(0);

    msg!("Value: {:?}", value);

    Ok(())
}
