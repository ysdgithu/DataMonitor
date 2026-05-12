import type { RuleEngine } from './ruleEngine';

let ruleEngineRef: RuleEngine | null = null;

export function setRuleEngineInstance(engine: RuleEngine): void {
  ruleEngineRef = engine;
}

export function getRuleEngineInstance(): RuleEngine | null {
  return ruleEngineRef;
}
