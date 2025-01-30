// interface Features {
// 	payment: boolean;
// }
type Features = object;

export default class FeatureFlags {
	static features: Features = {};

	static setFeatureflags(fileFeatureFlags: any) {
		for (const key of Object.keys(FeatureFlags.features)) {
			if (fileFeatureFlags[key]) {
				(FeatureFlags.features as any)[key] = fileFeatureFlags[key] as boolean;
			}
		}
	}
}
