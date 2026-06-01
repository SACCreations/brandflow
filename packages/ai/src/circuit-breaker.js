"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
/**
 * Circuit Breaker for AI provider calls.
 * Prevents cascading failures by short-circuiting requests
 * to unhealthy providers after repeated failures.
 */
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    name;
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    lastFailureTime = 0;
    failureThreshold;
    resetTimeoutMs;
    successThreshold;
    constructor(name, config = {}) {
        this.name = name;
        this.failureThreshold = config.failureThreshold ?? 5;
        this.resetTimeoutMs = config.resetTimeoutMs ?? 30_000;
        this.successThreshold = config.successThreshold ?? 2;
    }
    get currentState() {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
                this.state = CircuitState.HALF_OPEN;
                this.successCount = 0;
            }
        }
        return this.state;
    }
    canExecute() {
        const state = this.currentState;
        return state === CircuitState.CLOSED || state === CircuitState.HALF_OPEN;
    }
    recordSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.failureCount = 0;
                console.log(`[CircuitBreaker:${this.name}] Circuit CLOSED — provider recovered`);
            }
        }
        else {
            this.failureCount = 0;
        }
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            console.log(`[CircuitBreaker:${this.name}] Circuit OPEN — recovery test failed`);
        }
        else if (this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
            console.log(`[CircuitBreaker:${this.name}] Circuit OPEN — ${this.failureCount} consecutive failures`);
        }
    }
    async execute(fn) {
        if (!this.canExecute()) {
            throw new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN — request rejected`);
        }
        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        }
        catch (error) {
            this.recordFailure();
            throw error;
        }
    }
    getStats() {
        return {
            name: this.name,
            state: this.currentState,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
        };
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map