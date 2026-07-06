#![no_std]

mod events;

use events::*;
use odra::prelude::*;
use odra::Variable;

#[odra::module]
pub struct FlawSeekingProxy {
    owner: Variable<Address>,
    agents: Mapping<Address, AgentState>,
    violation_count: Variable<U256>,
    violations: Mapping<U256, ViolationRecord>,
    is_paused: Variable<bool>,
}

#[derive(odra::OdraType)]
pub struct AgentState {
    pub registered: bool,
    pub policy_hash: String,
    pub total_tx_count: U256,
    pub violation_count: U256,
    pub total_volume_cspr: U256,
    pub paused: bool,
    pub created_at: u64,
}

#[derive(odra::OdraType)]
pub struct ViolationRecord {
    pub id: U256,
    pub agent: Address,
    pub attempted_recipient: Address,
    pub attempted_amount: U256,
    pub block_reason: String,
    pub timestamp: u64,
    pub resolved: bool,
    pub validator_verdict: Option<String>,
}

#[odra::module]
impl FlawSeekingProxy {
    pub fn init(&mut self) {
        self.owner.set(odra::contract_api::caller());
        self.violation_count.set(U256::zero());
        self.is_paused.set(false);
    }

    pub fn register_agent(&mut self, policy_hash: String) {
        assert!(!self.is_paused.get_or_default(), "FlawSeeking is paused");
        let agent = odra::contract_api::caller();
        assert!(
            !self.agents.get(&agent).unwrap_or_default().registered,
            "Agent already registered"
        );

        self.agents.set(
            &agent,
            AgentState {
                registered: true,
                policy_hash,
                total_tx_count: U256::zero(),
                violation_count: U256::zero(),
                total_volume_cspr: U256::zero(),
                paused: false,
                created_at: odra::contract_api::get_block_time(),
            },
        );

        AgentRegistered {
            agent,
            policy_hash: self.agents.get(&agent).unwrap_or_default().policy_hash,
            timestamp: odra::contract_api::get_block_time(),
        }
        .emit();
    }

    pub fn execute_guarded_tx(
        &mut self,
        recipient: Address,
        amount: U256,
        purpose: String,
    ) -> GuardResult {
        assert!(!self.is_paused.get_or_default(), "FlawSeeking is paused");

        let agent = odra::contract_api::caller();
        let mut state = self
            .agents
            .get(&agent)
            .unwrap_or_default();

        assert!(state.registered, "Agent not registered");
        assert!(!state.paused, "Agent is paused");

        let policy_hash = state.policy_hash.clone();

        let policy_result = self.evaluate_policy(&policy_hash, &state, amount);

        state.total_tx_count = U256::from(state.total_tx_count.as_u64() + 1);
        state.total_volume_cspr =
            U256::from(state.total_volume_cspr.as_u64() + amount.as_u64());

        match &policy_result {
            PolicyResult::Allow => {
                self.agents.set(&agent, state);

                TransactionGuarded {
                    agent,
                    recipient,
                    amount,
                    status: String::from("ALLOWED"),
                    reason: String::from("Policy passed"),
                    violation_id: None,
                    deploy_hash: Some(String::new()),
                    timestamp: odra::contract_api::get_block_time(),
                }
                .emit();

                GuardResult {
                    status: String::from("ALLOWED"),
                    reason: String::from("Policy passed"),
                    violation_id: None,
                }
            }
            PolicyResult::Violation(reason) => {
                state.violation_count =
                    U256::from(state.violation_count.as_u64() + 1);

                let violation_id = self.violation_count.get_or_default();
                self.violation_count.set(U256::from(violation_id.as_u64() + 1));

                self.violations.set(
                    &violation_id,
                    ViolationRecord {
                        id: violation_id,
                        agent,
                        attempted_recipient: recipient,
                        attempted_amount: amount,
                        block_reason: reason.clone(),
                        timestamp: odra::contract_api::get_block_time(),
                        resolved: false,
                        validator_verdict: None,
                    },
                );

                self.agents.set(&agent, state);

                TransactionGuarded {
                    agent,
                    recipient,
                    amount,
                    status: String::from("BLOCKED"),
                    reason: reason.clone(),
                    violation_id: Some(violation_id),
                    deploy_hash: None,
                    timestamp: odra::contract_api::get_block_time(),
                }
                .emit();

                GuardResult {
                    status: String::from("BLOCKED"),
                    reason,
                    violation_id: Some(violation_id),
                }
            }
        }
    }

    pub fn update_policy(&mut self, new_policy_hash: String) {
        let agent = odra::contract_api::caller();
        let mut state = self.agents.get(&agent).unwrap_or_default();
        assert!(state.registered, "Agent not registered");

        let old_hash = state.policy_hash.clone();
        state.policy_hash = new_policy_hash.clone();
        self.agents.set(&agent, state);

        PolicyUpdated {
            agent,
            old_policy_hash: old_hash,
            new_policy_hash,
            timestamp: odra::contract_api::get_block_time(),
        }
        .emit();
    }

    pub fn pause_agent(&mut self) {
        let agent = odra::contract_api::caller();
        let mut state = self.agents.get(&agent).unwrap_or_default();
        assert!(state.registered, "Agent not registered");
        state.paused = true;
        self.agents.set(&agent, state);

        AgentPaused {
            agent,
            timestamp: odra::contract_api::get_block_time(),
        }
        .emit();
    }

    pub fn unpause_agent(&mut self) {
        let agent = odra::contract_api::caller();
        let mut state = self.agents.get(&agent).unwrap_or_default();
        assert!(state.registered, "Agent not registered");
        state.paused = false;
        self.agents.set(&agent, state);

        AgentUnpaused {
            agent,
            timestamp: odra::contract_api::get_block_time(),
        }
        .emit();
    }

    pub fn resolve_violation(&mut self, violation_id: U256, verdict: String) {
        let caller = odra::contract_api::caller();
        assert!(
            caller == self.owner.get_or_default(),
            "Only owner can resolve violations"
        );

        let mut record = self.violations.get(&violation_id).unwrap_or_default();
        assert!(!record.resolved, "Violation already resolved");

        record.resolved = true;
        record.validator_verdict = Some(verdict);
        self.violations.set(&violation_id, record);
    }

    pub fn get_agent_state(&self, agent: Address) -> Option<AgentState> {
        self.agents.get(&agent)
    }

    pub fn get_violation(&self, violation_id: U256) -> Option<ViolationRecord> {
        self.violations.get(&violation_id)
    }

    pub fn get_violation_count(&self) -> U256 {
        self.violation_count.get_or_default()
    }

    pub fn is_agent_registered(&self, agent: Address) -> bool {
        self.agents.get(&agent).unwrap_or_default().registered
    }

    pub fn pause_protocol(&mut self) {
        assert!(
            odra::contract_api::caller() == self.owner.get_or_default(),
            "Only owner"
        );
        self.is_paused.set(true);
    }

    pub fn unpause_protocol(&mut self) {
        assert!(
            odra::contract_api::caller() == self.owner.get_or_default(),
            "Only owner"
        );
        self.is_paused.set(false);
    }

    fn evaluate_policy(
        &self,
        _policy_hash: &String,
        state: &AgentState,
        amount: U256,
    ) -> PolicyResult {
        if state.total_volume_cspr.as_u64() + amount.as_u64() > 50 {
            return PolicyResult::Violation(String::from(
                "TX_VALUE_EXCEEDS_MAX: amount exceeds per-transaction limit of 50 CSPR",
            ));
        }
        PolicyResult::Allow
    }
}

#[derive(odra::OdraType)]
pub struct GuardResult {
    pub status: String,
    pub reason: String,
    pub violation_id: Option<U256>,
}

#[derive(odra::OdraType)]
pub enum PolicyResult {
    Allow,
    Violation(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::test_env;

    #[test]
    fn test_register_agent() {
        let mut proxy = FlawSeekingProxy::deploy(&test_env(), ());
        proxy.register_agent(String::from("policy-hash-001"));
        let state = proxy
            .get_agent_state(test_env::get_account(0))
            .unwrap();
        assert!(state.registered);
        assert_eq!(state.policy_hash, "policy-hash-001");
    }

    #[test]
    fn test_guarded_tx_allows_small_amount() {
        let mut proxy = FlawSeekingProxy::deploy(&test_env(), ());
        proxy.register_agent(String::from("policy-hash-001"));

        let result = proxy.execute_guarded_tx(
            test_env::get_account(1),
            U256::from(30),
            String::from("Buy data"),
        );
        assert_eq!(result.status, "ALLOWED");
    }

    #[test]
    fn test_guarded_tx_blocks_large_amount() {
        let mut proxy = FlawSeekingProxy::deploy(&test_env(), ());
        proxy.register_agent(String::from("policy-hash-001"));

        let result = proxy.execute_guarded_tx(
            test_env::get_account(1),
            U256::from(500),
            String::from("Drain attempt"),
        );
        assert_eq!(result.status, "BLOCKED");
    }

    #[test]
    fn test_agent_can_pause_and_unpause() {
        let mut proxy = FlawSeekingProxy::deploy(&test_env(), ());
        proxy.register_agent(String::from("policy-hash-001"));
        proxy.pause_agent();
        proxy.unpause_agent();

        let result = proxy.execute_guarded_tx(
            test_env::get_account(1),
            U256::from(30),
            String::from("After unpause"),
        );
        assert_eq!(result.status, "ALLOWED");
    }
}
