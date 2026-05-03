import * as core from '@actions/core';
import { applyLabels } from '../labeler';

jest.mock('@actions/core');

const mockOctokit = () => ({
    rest: {
        issues: {
            listLabelsForRepo: jest.fn().mockResolvedValue({ data: [] }),
            listLabelsOnIssue: jest.fn().mockResolvedValue({ data: [] }),
            addLabels: jest.fn().mockResolvedValue({}),
            removeLabel: jest.fn().mockResolvedValue({}),
            createLabel: jest.fn().mockResolvedValue({})
        }
    }
});

const baseParams = { owner: 'org', repo: 'repo', pullNumber: 1, enableRisk: true };

describe('applyLabels', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.ACT;
    });

    describe('When running locally via act', () => {
        beforeEach(() => {
            process.env.ACT = 'true';
        });

        it('Skips all API calls and logs what would be applied', async () => {
            const octokit = mockOctokit() as any;
            await applyLabels(octokit, { ...baseParams, sizeLabel: 'size/medium', riskLabel: 'risk/medium' });

            expect(octokit.rest.issues.listLabelsForRepo).not.toHaveBeenCalled();
            expect(octokit.rest.issues.listLabelsOnIssue).not.toHaveBeenCalled();
            expect(octokit.rest.issues.addLabels).not.toHaveBeenCalled();
            expect(core.info).toHaveBeenCalledWith(expect.stringContaining('size/medium'));
            expect(core.info).toHaveBeenCalledWith(expect.stringContaining('risk/medium'));
        });
    });

    describe('When running on real GitHub', () => {
        it('Creates missing labels and adds resolved ones', async () => {
            const octokit = mockOctokit() as any;
            await applyLabels(octokit, { ...baseParams, sizeLabel: 'size/small', riskLabel: 'risk/low' });

            expect(octokit.rest.issues.listLabelsForRepo).toHaveBeenCalled();
            expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({ labels: expect.arrayContaining(['size/small', 'risk/low']) }));
        });

        it('Removes stale size and risk labels before adding new ones', async () => {
            const octokit = mockOctokit() as any;
            octokit.rest.issues.listLabelsOnIssue.mockResolvedValue({
                data: [{ name: 'size/large' }, { name: 'risk/high' }]
            });

            await applyLabels(octokit, { ...baseParams, sizeLabel: 'size/small', riskLabel: 'risk/low' });

            expect(octokit.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({ name: 'size/large' }));
            expect(octokit.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({ name: 'risk/high' }));
            expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({ labels: expect.arrayContaining(['size/small', 'risk/low']) }));
        });

        it('Does not add labels that already exist on the PR', async () => {
            const octokit = mockOctokit() as any;
            octokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ data: [{ name: 'size/medium' }, { name: 'risk/medium' }] });

            await applyLabels(octokit, { ...baseParams, sizeLabel: 'size/medium', riskLabel: 'risk/medium' });
            expect(octokit.rest.issues.addLabels).not.toHaveBeenCalled();
        });

        it('Skips risk labels when enableRisk is false', async () => {
            const octokit = mockOctokit() as any;
            await applyLabels(octokit, { ...baseParams, enableRisk: false, sizeLabel: 'size/small', riskLabel: 'risk/low' });

            expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({ labels: ['size/small'] }));
        });

        it('Silently ignores 404 when removing a label that is not on the PR', async () => {
            const octokit = mockOctokit() as any;
            octokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ data: [{ name: 'size/large' }] });
            octokit.rest.issues.removeLabel.mockRejectedValue({ status: 404 });

            await expect(applyLabels(octokit, { ...baseParams, sizeLabel: 'size/small', riskLabel: 'risk/low' })).resolves.not.toThrow();
        });

        it('Rethrows non-404 errors from removeLabel', async () => {
            const octokit = mockOctokit() as any;
            octokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ data: [{ name: 'size/large' }] });
            octokit.rest.issues.removeLabel.mockRejectedValue({ status: 500 });

            await expect(applyLabels(octokit, { ...baseParams, sizeLabel: 'size/small', riskLabel: 'risk/low' })).rejects.toMatchObject({ status: 500 });
        });
    });
});
