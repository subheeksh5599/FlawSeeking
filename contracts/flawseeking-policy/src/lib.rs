#![no_std]
extern crate alloc;

use odra::prelude::*;

#[odra::module]
pub struct FlawSeekingPolicy {
    owner: Variable<Address>,
    agent: Variable<Address>,
    max_cspr_per_tx: Variable<U256>,
    max_cspr_per_hour: Variable<U256>,
    max_cspr_per_day: Variable<U256>,
    cooldown_seconds: Variable<u64>,
    allowlist: Mapping<Address, bool>,
    blocklist: Mapping<Address, bool>,
    last_tx_timestamp: Variable<u64>,
    hourly_volume: Variable<U256>,
    daily_volume: Variable<U256>,
    hourly_window_start: Variable<u64>,
    daily_window_start: Variable<u64>,
}

#[derive(odra::OdraType)]
pub struct PolicyConfig {
    pub max_cspr_per_tx: U256,
    pub max_cspr_per_hour: U256,
    pub max_cspr_per_day: U256,
    pub cooldown_seconds: u64,
    pub allowlist: Vec<Address>,
    pub blocklist: Vec<Address>,
}

#[derive(odra::OdraType)]
pub struct PolicyEvaluation {
    pub passed: bool,
    pub reason: String,
    pub checks: Vec<String>,
}

#[odra::module]
impl FlawSeekingPolicy {
    pub fn init(&mut self, agent: Address, config: PolicyConfig) {
        let caller = odra::contract_api::caller();
        self.owner.set(caller);
        self.agent.set(agent);

        self.max_cspr_per_tx.set(config.max_cspr_per_tx);
        self.max_cspr_per_hour.set(config.max_cspr_per_hour);
        self.max_cspr_per_day.set(config.max_cspr_per_day);
        self.cooldown_seconds.set(config.cooldown_seconds);

        for addr in &config.allowlist {
            self.allowlist.set(addr, true);
        }
        for addr in &config.blocklist {
            self.blocklist.set(addr, true);
        }

        let now = odra::contract_api::get_block_time();
        self.last_tx_timestamp.set(0u64);
        self.hourly_volume.set(U256::zero());
        self.daily_volume.set(U256::zero());
        self.hourly_window_start.set(now);
        self.daily_window_start.set(now);
    }

    pub fn evaluate_tx(
        &mut self,
        recipient: &Address,
        amount: U256,
    ) -> PolicyEvaluation {
        let now = odra::contract_api::get_block_time();
        let mut checks: Vec<String> = Vec::new();

        if self.blocklist.get(recipient).unwrap_or(false) {
            return PolicyEvaluation {
                passed: false,
                reason: String::from("RECIPIENT_BLOCKED: address is on blocklist"),
                checks,
            };
        }
        checks.push(String::from("BLOCKLIST: ok"));

        let max_tx = self.max_cspr_per_tx.get_or_default();
        if amount > max_tx {
            return PolicyEvaluation {
                passed: false,
                reason: String::from("TX_SIZE_EXCEEDED: amount exceeds per-tx cap"),
                checks,
            };
        }
        checks.push(String::from("SIZE_CAP: ok"));

        let cooldown = self.cooldown_seconds.get_or_default();
        let last = self.last_tx_timestamp.get_or_default();
        if cooldown > 0 && last > 0 && (now - last) < cooldown {
            let remaining = cooldown - (now - last);
            return PolicyEvaluation {
                passed: false,
                reason: alloc::format!(
                    "COOLDOWN_ACTIVE: {}s remaining of {}s cooldown",
                    remaining,
                    cooldown
                ),
                checks,
            };
        }
        checks.push(String::from("COOLDOWN: ok"));

        let hourly_max = self.max_cspr_per_hour.get_or_default();
        if hourly_max > U256::zero() {
            let h_start = self.hourly_window_start.get_or_default();
            if now - h_start > 3600 {
                self.hourly_window_start.set(now);
                self.hourly_volume.set(U256::zero());
            }
            let vol = self.hourly_volume.get_or_default();
            if vol + amount > hourly_max {
                return PolicyEvaluation {
                    passed: false,
                    reason: alloc::format!(
                        "HOURLY_LIMIT: {} CSPR would exceed {} CSPR/hour cap",
                        (vol + amount).as_u64(),
                        hourly_max.as_u64()
                    ),
                    checks,
                };
            }
            self.hourly_volume
                .set(U256::from(vol.as_u64() + amount.as_u64()));
        }
        checks.push(String::from("HOURLY_LIMIT: ok"));

        let daily_max = self.max_cspr_per_day.get_or_default();
        if daily_max > U256::zero() {
            let d_start = self.daily_window_start.get_or_default();
            if now - d_start > 86400 {
                self.daily_window_start.set(now);
                self.daily_volume.set(U256::zero());
            }
            let vol = self.daily_volume.get_or_default();
            if vol + amount > daily_max {
                return PolicyEvaluation {
                    passed: false,
                    reason: alloc::format!(
                        "DAILY_LIMIT: {} CSPR would exceed {} CSPR/day cap",
                        (vol + amount).as_u64(),
                        daily_max.as_u64()
                    ),
                    checks,
                };
            }
            self.daily_volume
                .set(U256::from(vol.as_u64() + amount.as_u64()));
        }
        checks.push(String::from("DAILY_LIMIT: ok"));

        self.last_tx_timestamp.set(now);

        PolicyEvaluation {
            passed: true,
            reason: String::from("PASSED"),
            checks,
        }
    }

    pub fn update_config(&mut self, config: PolicyConfig) {
        assert!(
            odra::contract_api::caller() == self.owner.get_or_default(),
            "Only owner"
        );
        self.max_cspr_per_tx.set(config.max_cspr_per_tx);
        self.max_cspr_per_hour.set(config.max_cspr_per_hour);
        self.max_cspr_per_day.set(config.max_cspr_per_day);
        self.cooldown_seconds.set(config.cooldown_seconds);
    }

    pub fn get_config(&self) -> PolicyConfig {
        PolicyConfig {
            max_cspr_per_tx: self.max_cspr_per_tx.get_or_default(),
            max_cspr_per_hour: self.max_cspr_per_hour.get_or_default(),
            max_cspr_per_day: self.max_cspr_per_day.get_or_default(),
            cooldown_seconds: self.cooldown_seconds.get_or_default(),
            allowlist: Vec::new(),
            blocklist: Vec::new(),
        }
    }

    pub fn get_agent(&self) -> Address {
        self.agent.get_or_default()
    }

    pub fn get_owner(&self) -> Address {
        self.owner.get_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::test_env;

    fn default_config(_agent: Address) -> PolicyConfig {
        PolicyConfig {
            max_cspr_per_tx: U256::from(50),
            max_cspr_per_hour: U256::from(200),
            max_cspr_per_day: U256::from(1000),
            cooldown_seconds: 60,
            allowlist: Vec::new(),
            blocklist: Vec::new(),
        }
    }

    #[test]
    fn test_allows_valid_tx() {
        let env = test_env();
        let mut policy = FlawSeekingPolicy::deploy(
            &env,
            env.get_account(0),
            default_config(env.get_account(0)),
        );

        let result = policy.evaluate_tx(&env.get_account(1), U256::from(30));
        assert!(result.passed);
        assert_eq!(result.reason, "PASSED");
    }

    #[test]
    fn test_blocks_size_exceeded() {
        let env = test_env();
        let mut policy = FlawSeekingPolicy::deploy(
            &env,
            env.get_account(0),
            default_config(env.get_account(0)),
        );

        let result = policy.evaluate_tx(&env.get_account(1), U256::from(500));
        assert!(!result.passed);
        assert!(result.reason.contains("TX_SIZE_EXCEEDED"));
    }

    #[test]
    fn test_blocks_blocklisted_recipient() {
        let env = test_env();
        let mut config = default_config(env.get_account(0));
        let bad_addr = env.get_account(2);
        config.blocklist.push(bad_addr);

        let mut policy =
            FlawSeekingPolicy::deploy(&env, env.get_account(0), config);

        let result = policy.evaluate_tx(&bad_addr, U256::from(5));
        assert!(!result.passed);
        assert!(result.reason.contains("RECIPIENT_BLOCKED"));
    }

    #[test]
    fn test_hourly_limit_enforced() {
        let env = test_env();
        let mut config = default_config(env.get_account(0));
        config.max_cspr_per_hour = U256::from(100);

        let mut policy =
            FlawSeekingPolicy::deploy(&env, env.get_account(0), config);

        let result1 = policy.evaluate_tx(&env.get_account(1), U256::from(80));
        assert!(result1.passed);

        let result2 = policy.evaluate_tx(&env.get_account(1), U256::from(80));
        assert!(!result2.passed);
        assert!(result2.reason.contains("HOURLY_LIMIT"));
    }
}
