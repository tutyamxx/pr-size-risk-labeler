import { analyzePullRequest } from '../analyzer';

jest.mock('@actions/core');

const mockOctokit = () => ({
    rest: {
        pulls: {
            get: jest.fn().mockResolvedValue({ data: { additions: 100, deletions: 50, changed_files: 10 } }),
            listFiles: jest.fn().mockResolvedValue({ data: [] })
        }
    },
    paginate: jest.fn().mockResolvedValue([{ filename: 'src/main.ts' }, { filename: 'src/config.ts' }])
});

describe('analyzePullRequest', () => {
    beforeEach(() => jest.clearAllMocks());

    it('Uses prPayload when provided and skips API', async () => {
        const octokit = mockOctokit() as any;
        const payload = { additions: 120, deletions: 30, changed_files: 8 };

        const result = await analyzePullRequest(octokit, { owner: 'org', repo: 'repo', pullNumber: 1 }, payload);

        expect(result.additions).toBe(120);
        expect(result.deletions).toBe(30);
        expect(result.filesChanged).toBe(8);
        expect(result.totalLines).toBe(150);
        expect(result.fileNames).toEqual([]);
        expect(octokit.paginate).not.toHaveBeenCalled();
    });

    it('Calls GitHub API when no payload provided', async () => {
        const octokit = mockOctokit() as any;
        const result = await analyzePullRequest(octokit, { owner: 'org', repo: 'repo', pullNumber: 1 });

        expect(result.additions).toBe(100);
        expect(result.deletions).toBe(50);
        expect(result.totalLines).toBe(150);
        expect(octokit.paginate).toHaveBeenCalled();
    });

    it('Returns fileNames from paginated files', async () => {
        const octokit = mockOctokit() as any;
        const result = await analyzePullRequest(octokit, { owner: 'org', repo: 'repo', pullNumber: 1 });

        expect(result.fileNames).toEqual(['src/main.ts', 'src/config.ts']);
    });

    it('Throws a wrapped error on API failure', async () => {
        const octokit = mockOctokit() as any;
        octokit.rest.pulls.get.mockRejectedValue(new Error('Not Found'));

        await expect(analyzePullRequest(octokit, { owner: 'org', repo: 'repo', pullNumber: 1 })).rejects.toThrow('Failed to analyze PR #1: Not Found');
    });
});
