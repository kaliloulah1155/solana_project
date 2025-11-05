use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    pub counter: u32,
}
entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
)-> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    msg!("start decode");
    let data_received = GreetingAccount::try_from_slice(_instruction_data).map_err(|err| {
        msg!("err, {:?}", err);
        ProgramError::InvalidInstructionData
    })?;
    msg!("greeting passed is : {:?}", data_received);
    if account.owner != program_id {
        msg!("wrong permissions");
        return Err(ProgramError::IncorrectProgramId);
    }
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
    greeting_account.counter += data_received.counter;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;
    msg!("Greeted: {}, time(s)", greeting_account.counter);

    Ok(())
}
