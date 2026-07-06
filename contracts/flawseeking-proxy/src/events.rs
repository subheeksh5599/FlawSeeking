use odra::prelude::*;

#[odra::event]
pub struct AgentRegistered {
    pub agent: Address,
    pub policy_hash: String,
    pub timestamp: u64,
}

#[odra::event]
pub struct TransactionGuarded {
    pub agent: Address,
    pub recipient: Address,
    pub amount: U256,
    pub status: String,
    pub reason: String,
    pub violation_id: Option<U256>,
    pub deploy_hash: Option<String>,
    pub timestamp: u64,
}

#[odra::event]
pub struct PolicyUpdated {
    pub agent: Address,
    pub old_policy_hash: String,
    pub new_policy_hash: String,
    pub timestamp: u64,
}

#[odra::event]
pub struct AgentPaused {
    pub agent: Address,
    pub timestamp: u64,
}

#[odra::event]
pub struct AgentUnpaused {
    pub agent: Address,
    pub timestamp: u64,
}
