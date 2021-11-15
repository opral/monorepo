import { SvelteI18nAdapter } from '../../src/adapters/svelteI18nAdapter';

const mockFile = JSON.stringify({
    page: {
        home: {
            title: 'Homepage',
            nav: 'Home',
        },
        about: {
            title: 'About',
            nav: 'About',
        },
        contact: {
            title: 'Contact',
            nav: 'Contact Us',
        },
    },
});

describe('SvelteI18nAdapter', () => {
    const adapter = new SvelteI18nAdapter();
    it('should parse a mock file without an error', () => {
        const result = adapter.parse(mockFile);
        expect(result.data).not.toBeNull();
        expect(result.error).toBeNull();
    });

    it('should serialize without an error', () => {
        const parsing = adapter.parse(mockFile);
        if (parsing.data === null) {
            throw parsing.error;
        }
        const serialization = adapter.serialize(parsing.data);
        expect(serialization.data).not.toBeNull();
        expect(serialization.error).toBeNull();
        console.log(serialization);
    });
});
