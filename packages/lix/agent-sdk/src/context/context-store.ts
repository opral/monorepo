/**
 * Lightweight key-value store for contextual metadata injected into the agent prompt.
 */
export class ContextStore {
	private readonly entries = new Map<string, string>();

	set(key: string, value: string): void {
		if (!key) {
			throw new Error("context key must be a non-empty string");
		}
		this.entries.set(key, value);
	}

	get(key: string): string | undefined {
		return this.entries.get(key);
	}

	delete(key: string): void {
		this.entries.delete(key);
	}

	clear(): void {
		this.entries.clear();
	}

	toOverlayBlock(): string | null {
		if (this.entries.size === 0) {
			return null;
		}
		const lines = Array.from(this.entries.entries()).map(
			([key, value]) => `${key}: ${value}`
		);
		return lines.join("\n");
	}
}
