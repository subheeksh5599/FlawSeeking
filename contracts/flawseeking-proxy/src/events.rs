use odra::prelude::*;
use odra::Event;

#[derive(Event)]
pub struct AgentRegistered {
    pub agent: Address,
    pub policy_hash: String,
    pub timestamp: u64,
}

#[derive(Event)]
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

#[derive(Event)]
pub struct PolicyUpdated {
    pub agent: Address,
    pub old_policy_hash: String,
    pub new_policy_hash: String,
    pub timestamp: u64,
}

#[derive(Event)]
pub struct AgentPaused {
    pub agent: Address,
    pub timestamp: u64,
}

#[derive(Event)]
pub struct AgentUnpaused {
    pub agent: Address,
    pub timestamp: u64,
}
