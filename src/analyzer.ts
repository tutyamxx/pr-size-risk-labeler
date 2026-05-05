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
 * Fetches all changed files for a pull request, automatically paginating through results.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - Repository owner, name, and PR number.
 * @returns An array of objects containing the filename of each changed file.
 */
const fetchAllChangedFiles = async (octokit: Octokit, { owner, repo, pullNumber }: PrParams): Promise<{ filename: string }[]> => {
    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100
    });

    return files?.map(f => ({ filename: f?.filename ?? '' }));
};

/**
 * Analyzes a pull request and returns a summary of its diff size and affected files.
 * When a `prPayload` is provided (e.g. from a mock event), it skips the GitHub API call
 * and uses the payload data directly — useful for local testing with nektos/act.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - Repository owner, name, and PR number.
 * @param prPayload - Optional PR payload from the event context to skip the API call.
 * @returns A {@link PrAnalysis} object with line counts and file names.
 * @throws If the GitHub API request fails.
 */
export const analyzePullRequest = async (octokit: Octokit, { owner, repo, pullNumber }: PrParams, prPayload?: Record<string, number>): Promise<PrAnalysis> => {
    try {
        const additions = prPayload?.additions ?? (await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber })).data?.additions ?? 0;
        const deletions = prPayload?.deletions ?? (await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber })).data?.deletions ?? 0;
        const filesChanged = prPayload?.changed_files ?? (await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber })).data?.changed_files ?? 0;

        const files = prPayload ? [] : await fetchAllChangedFiles(octokit, { owner, repo, pullNumber });
        const totalLines = additions + deletions;
        const fileNames = files?.map(f => f?.filename ?? '') ?? [];

        core.debug(`Fetched ${files?.length ?? 0} changed files for PR #${pullNumber}`);

        return { additions, deletions, totalLines, filesChanged, fileNames };
    } catch (error) {
        const err = new Error(`Failed to analyze PR #${pullNumber}: ${error instanceof Error ? error?.message : String(error)}`);
        Object.assign(err, { cause: error });

        throw err;
    }
};
