#![no_std]

use odra::prelude::*;

#[odra::module]
pub struct FlawSeekingValidator {
    owner: Variable<Address>,
    validators: Mapping<Address, ValidatorState>,
    staking_token: Variable<Address>,
    min_stake: Variable<U256>,
    review_fee: Variable<U256>,
    verdicts: Mapping<U256, VerdictRecord>,
    verdict_count: Variable<U256>,
}

#[derive(odra::OdraType)]
pub struct ValidatorState {
    pub active: bool,
    pub staked_amount: U256,
    pub total_reviews: U256,
    pub correct_verdicts: U256,
    pub reputation_score: u8,
    pub joined_at: u64,
}

#[derive(odra::OdraType)]
pub struct VerdictRecord {
    pub id: U256,
    pub validator: Address,
    pub violation_id: U256,
    pub verdict: String,
    pub reasoning_hash: String,
    pub timestamp: u64,
}

#[odra::module]
impl FlawSeekingValidator {
    pub fn init(&mut self, min_stake: U256, review_fee: U256) {
        self.owner.set(odra::contract_api::caller());
        self.min_stake.set(min_stake);
        self.review_fee.set(review_fee);
        self.verdict_count.set(U256::zero());
    }

    pub fn register_validator(&mut self) {
        let validator = odra::contract_api::caller();
        let existing = self.validators.get(&validator).unwrap_or_default();
        assert!(!existing.active, "Validator already registered");

        let min = self.min_stake.get_or_default();
        assert!(
            odra::contract_api::transferred_value() >= min,
            "Insufficient stake"
        );

        self.validators.set(
            &validator,
            ValidatorState {
                active: true,
                staked_amount: odra::contract_api::transferred_value(),
                total_reviews: U256::zero(),
                correct_verdicts: U256::zero(),
                reputation_score: 100u8,
                joined_at: odra::contract_api::get_block_time(),
            },
        );
    }

    pub fn submit_verdict(
        &mut self,
        violation_id: U256,
        verdict: String,
        reasoning_hash: String,
    ) {
        let validator = odra::contract_api::caller();
        let mut state = self.validators.get(&validator).unwrap_or_default();
        assert!(state.active, "Validator not registered");

        let verdict_id = self.verdict_count.get_or_default();
        self.verdict_count
            .set(U256::from(verdict_id.as_u64() + 1));

        self.verdicts.set(
            &verdict_id,
            VerdictRecord {
                id: verdict_id,
                validator,
                violation_id,
                verdict: verdict.clone(),
                reasoning_hash,
                timestamp: odra::contract_api::get_block_time(),
            },
        );

        state.total_reviews = U256::from(state.total_reviews.as_u64() + 1);
        if verdict == "CONFIRMED" || verdict == "OVERTURNED" {
            state.correct_verdicts = U256::from(state.correct_verdicts.as_u64() + 1);
        }

        state.reputation_score = self.calculate_reputation(&state);
        self.validators.set(&validator, state);
    }

    pub fn slash_validator(&mut self, validator: Address) {
        assert!(
            odra::contract_api::caller() == self.owner.get_or_default(),
            "Only owner can slash"
        );

        let mut state = self.validators.get(&validator).unwrap_or_default();
        state.active = false;
        state.reputation_score = 0u8;
        self.validators.set(&validator, state);
    }

    pub fn get_validator(&self, validator: Address) -> Option<ValidatorState> {
        self.validators.get(&validator)
    }

    pub fn get_verdict(&self, verdict_id: U256) -> Option<VerdictRecord> {
        self.verdicts.get(&verdict_id)
    }

    pub fn get_verdict_count(&self) -> U256 {
        self.verdict_count.get_or_default()
    }

    pub fn get_reputation(&self, validator: Address) -> u8 {
        self.validators
            .get(&validator)
            .map(|s| s.reputation_score)
            .unwrap_or(0u8)
    }

    pub fn update_review_fee(&mut self, new_fee: U256) {
        assert!(
            odra::contract_api::caller() == self.owner.get_or_default(),
            "Only owner"
        );
        self.review_fee.set(new_fee);
    }

    fn calculate_reputation(&self, state: &ValidatorState) -> u8 {
        let total = state.total_reviews.as_u64();
        let correct = state.correct_verdicts.as_u64();
        if total == 0 {
            return 100u8;
        }
        let score = ((correct * 100) / total) as u8;
        if score < 50 {
            50u8
        } else {
            score
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::test_env;

    #[test]
    fn test_register_validator() {
        let mut validator = FlawSeekingValidator::deploy(
            &test_env(),
            U256::from(100),
            U256::from(1),
        );

        validator.register_validator();

        let state = validator
            .get_validator(test_env::get_account(0))
            .unwrap();
        assert!(state.active);
        assert_eq!(state.reputation_score, 100u8);
    }

    #[test]
    fn test_submit_verdict() {
        let mut validator = FlawSeekingValidator::deploy(
            &test_env(),
            U256::from(100),
            U256::from(1),
        );

        validator.register_validator();

        validator.submit_verdict(
            U256::from(1),
            String::from("CONFIRMED"),
            String::from("sha256-hash-abc123"),
        );

        let verdict = validator.get_verdict(U256::from(0)).unwrap();
        assert_eq!(verdict.verdict, "CONFIRMED");
        assert_eq!(verdict.reasoning_hash, "sha256-hash-abc123");
    }

    #[test]
    fn test_reputation_decays_on_wrong_verdicts() {
        let mut validator = FlawSeekingValidator::deploy(
            &test_env(),
            U256::from(100),
            U256::from(1),
        );

        validator.register_validator();

        for _ in 0..6 {
            validator.submit_verdict(
                U256::from(1),
                String::from("CONFIRMED"),
                String::from("hash"),
            );
        }

        for _ in 0..4 {
            validator.submit_verdict(
                U256::from(2),
                String::from("WRONG"),
                String::from("hash"),
            );
        }

        let state = validator
            .get_validator(test_env::get_account(0))
            .unwrap();
        assert_eq!(state.reputation_score, 60u8);
    }

    #[test]
    fn test_slash_validator() {
        let mut validator = FlawSeekingValidator::deploy(
            &test_env(),
            U256::from(100),
            U256::from(1),
        );

        validator.register_validator();
        validator.slash_validator(test_env::get_account(0));

        let state = validator
            .get_validator(test_env::get_account(0))
            .unwrap();
        assert!(!state.active);
        assert_eq!(state.reputation_score, 0u8);
    }
}
