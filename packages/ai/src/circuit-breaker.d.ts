/**
 * Circuit Breaker for AI provider calls.
 * Prevents cascading failures by short-circuiting requests
 * to unhealthy providers after repeated failures.
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Rejecting requests (provider down)
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerConfig {
    /** Number of failures before opening circuit (default: 5) */
    failureThreshold?: number;
    /** Time in ms to wait before testing recovery (default: 30000) */
    resetTimeoutMs?: number;
    /** Number of successes in half-open needed to close (default: 2) */
    successThreshold?: number;
}
export declare class CircuitBreaker {
    private readonly name;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private readonly failureThreshold;
    private readonly resetTimeoutMs;
    private readonly successThreshold;
    constructor(name: string, config?: CircuitBreakerConfig);
    get currentState(): CircuitState;
    canExecute(): boolean;
    recordSuccess(): void;
    recordFailure(): void;
    execute<T>(fn: () => Promise<T>): Promise<T>;
    getStats(): {
        name: string;
        state: CircuitState;
        failureCount: number;
        lastFailureTime: number;
    };
}
//# sourceMappingURL=circuit-breaker.d.ts.map