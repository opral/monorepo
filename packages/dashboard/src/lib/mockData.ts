export const mockTranslations: MockTranslations = {
	en: {
		'some.key': 'Hello World',
		'some.other': 'How are you?',
		'click.hello': '',
		'button.welcome': ''
	},
	de: {
		'some.key': 'Hallo Welt',
		'some.other': 'Wie geht es dir?',
		'click.hello': 'Hallo',
		'button.welcome': 'Wilkommen'
	}
};

export const mockProject: MockProject = {
	id: 'some-random-id',
	name: 'mock-project',
	translations: mockTranslations,
	defaultLocale: 'en',
	locales: ['en', 'fr', 'de'],
	machineTranslations: 123
};

export const mockOrganization: MockOrganization = {
	machineTranslations: 1234,
	name: 'mockname'
};

export type MockTranslations = {
	[locale: string]:
		| undefined
		| {
				[key: string]: string | undefined;
		  };
};

export type MockProject = {
	id: string;
	name: string;
	translations: MockTranslations;
	defaultLocale: string;
	// locale includes defaultLocale
	locales: string[];
	machineTranslations: number;
};

export type MockOrganization = {
	machineTranslations: number;
	name: string;
};
