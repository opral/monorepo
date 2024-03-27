export type SetSettingsEvent = CustomEvent<Record<PropertyKey, never>>

declare global {
	interface GlobalEventHandlersEventMap {
		setSettings: SetSettingsEvent
	}
}
