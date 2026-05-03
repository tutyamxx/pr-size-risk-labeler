import { resolveLabels } from '../main';
import { getConfig } from '../config';

jest.mock('@actions/core');
jest.mock('@actions/github');

const mockConfig = (): ReturnType<typeof getConfig> => ({
    enableRiskLabels: true,
    sizeThresholds: { small: 99, medium: 499 },
    riskThresholds: { low: 99, lowFiles: 5, medium: 499, mediumFiles: 15 }
});

describe('resolveLabels', () => {
    it('Resolves size/small and risk/low for tiny PR', () => {
        const result = resolveLabels({ totalLines: 50, filesChanged: 3 }, mockConfig());

        expect(result.sizeLabel).toBe('size/small');
        expect(result.riskLabel).toBe('risk/low');
    });

    it('Resolves size/medium and risk/medium for moderate PR', () => {
        const result = resolveLabels({ totalLines: 150, filesChanged: 8 }, mockConfig());

        expect(result.sizeLabel).toBe('size/medium');
        expect(result.riskLabel).toBe('risk/medium');
    });

    it('Resolves size/large and risk/high for large PR', () => {
        const result = resolveLabels({ totalLines: 800, filesChanged: 20 }, mockConfig());

        expect(result.sizeLabel).toBe('size/large');
        expect(result.riskLabel).toBe('risk/high');
    });

    it('Resolves risk/high when files exceed threshold even if lines are low', () => {
        const result = resolveLabels({ totalLines: 50, filesChanged: 20 }, mockConfig());
        expect(result.riskLabel).toBe('risk/high');
    });

    it('Resolves risk/high when lines exceed threshold even if files are low', () => {
        const result = resolveLabels({ totalLines: 600, filesChanged: 2 }, mockConfig());
        expect(result.riskLabel).toBe('risk/high');
    });

    it('Resolves size/small at exact boundary', () => {
        const result = resolveLabels({ totalLines: 99, filesChanged: 1 }, mockConfig());
        expect(result.sizeLabel).toBe('size/small');
    });

    it('Resolves size/medium at exact boundary', () => {
        const result = resolveLabels({ totalLines: 499, filesChanged: 1 }, mockConfig());
        expect(result.sizeLabel).toBe('size/medium');
    });

    it('Resolves size/large just above medium boundary', () => {
        const result = resolveLabels({ totalLines: 500, filesChanged: 1 }, mockConfig());
        expect(result.sizeLabel).toBe('size/large');
    });
});
