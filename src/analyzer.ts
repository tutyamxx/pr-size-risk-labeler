import * as core from '@actions/core';
import { GitHub } from '@actions/github/lib/utils';

interface PrParams {
    owner: string;
    repo: string;
    pullNumber: number;
}

interface PrAnalysis {
    additions: number;
    deletions: number;
    totalLines: number;
    filesChanged: number;
    fileNames: string[];
}

type Octokit = InstanceType<typeof GitHub>;

/**
 * Analyzes a pull request and returns a summary of its diff size and affected files.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - Repository owner, name, and PR number.
 * @returns A {@link PrAnalysis} object with line counts and file names.
 * @throws If the GitHub API request fails.
 */
export const analyzePullRequest = async (octokit: Octokit, { owner, repo, pullNumber }: PrParams): Promise<PrAnalysis> => {
    try {
        const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
        const files = await fetchAllChangedFiles(octokit, { owner, repo, pullNumber });

        const additions = pr?.additions ?? 0;
        const deletions = pr?.deletions ?? 0;
        const totalLines = additions + deletions;

        const filesChanged = pr?.changed_files ?? files.length;
        const fileNames = files.map(f => f?.filename ?? '');

        core.debug(`Fetched ${files?.length ?? 0} changed files for PR #${pullNumber}`);

        return { additions, deletions, totalLines, filesChanged, fileNames };
    } catch (error) {
        throw new Error(`Failed to analyze PR #${pullNumber}: ${error instanceof Error ? error?.message : String(error)}`);
    }
};

/**
 * Fetches all changed files for a pull request, automatically paginating through results.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - Repository owner, name, and PR number.
 * @returns An array of objects containing the filename of each changed file.
 */
const fetchAllChangedFiles = async (octokit: Octokit, { owner, repo, pullNumber }: PrParams): Promise<Array<{ filename: string }>> => {
    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100
    });

    return files?.map(f => ({ filename: f?.filename ?? '' }));
};
