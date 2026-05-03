import * as core from '@actions/core';
import { getConfig } from '../config';

jest.mock('@actions/core');

const mockGetInput = core.getInput as jest.Mock;

describe('getConfig', () => {
    beforeEach(() => jest.clearAllMocks());

    it('Returns defaults when inputs are empty', () => {
        mockGetInput.mockReturnValue('');

        const config = getConfig();

        expect(config.enableRiskLabels).toBe(true);
        expect(config.sizeThresholds.small).toBe(99);
        expect(config.sizeThresholds.medium).toBe(499);
        expect(config.riskThresholds.low).toBe(99);
        expect(config.riskThresholds.lowFiles).toBe(5);
        expect(config.riskThresholds.medium).toBe(499);
        expect(config.riskThresholds.mediumFiles).toBe(15);
    });

    it('Parses custom thresholds from inputs', () => {
        mockGetInput.mockImplementation((name: string) => {
            const map: Record<string, string> = {
                'enable-risk-labels': 'true',
                'size-small-threshold': '50',
                'size-medium-threshold': '200',
                'risk-low-lines': '40',
                'risk-low-files': '3',
                'risk-medium-lines': '150',
                'risk-medium-files': '10'
            };

            return map[name] ?? '';
        });

        const config = getConfig();

        expect(config.sizeThresholds.small).toBe(50);
        expect(config.sizeThresholds.medium).toBe(200);
        expect(config.riskThresholds.low).toBe(40);
        expect(config.riskThresholds.lowFiles).toBe(3);
    });

    it('Disables risk labels when enable-risk-labels is false', () => {
        mockGetInput.mockImplementation((name: string) => (name === 'enable-risk-labels' ? 'false' : ''));

        const config = getConfig();
        expect(config.enableRiskLabels).toBe(false);
    });

    it('Falls back to default when input is not a valid number', () => {
        mockGetInput.mockImplementation((name: string) => (name === 'size-small-threshold' ? 'abc' : ''));

        const config = getConfig();
        expect(config.sizeThresholds.small).toBe(99);
    });
});
