import * as core from '@actions/core';
import { GitHub } from '@actions/github/lib/utils';

type Octokit = InstanceType<typeof GitHub>;

interface LabelDefinition {
    name: string;
    color: string;
    description: string;
}

interface ApplyLabelsParams {
    owner: string;
    repo: string;
    pullNumber: number;
    sizeLabel: string;
    riskLabel: string | null;
    enableRisk: boolean;
}

const SIZE_LABELS: LabelDefinition[] = [
    { name: 'size/small', color: '2cbe4e', description: 'PR changes fewer than 100 lines' },
    { name: 'size/medium', color: 'e4a826', description: 'PR changes 100-499 lines' },
    { name: 'size/large', color: 'd93f0b', description: 'PR changes 500+ lines' }
];

const RISK_LABELS: LabelDefinition[] = [
    { name: 'risk/low', color: '0e8a16', description: 'Low-risk change' },
    { name: 'risk/medium', color: 'fbca04', description: 'Medium-risk change' },
    { name: 'risk/high', color: 'b60205', description: 'High-risk change — review carefully' }
];

/**
 * Applies size and risk labels to a pull request.
 * Removes any stale size/risk labels before adding the newly resolved ones.
 * Skips label existence check and API calls when running locally via nektos/act.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - PR coordinates, resolved label names, and risk toggle.
 */
export const applyLabels = async (octokit: Octokit, { owner, repo, pullNumber, sizeLabel, riskLabel, enableRisk }: ApplyLabelsParams): Promise<void> => {
    const isActLocal = process.env?.ACT === 'true';

    if (!isActLocal) {
        await ensureLabelsExist(octokit, { owner, repo, enableRisk });
    }

    const existingLabels = isActLocal ? [] : await fetchExistingPrLabels(octokit, { owner, repo, pullNumber });

    const sizePrefix = 'size/';
    const riskPrefix = 'risk/';

    const labelsToRemove = existingLabels.filter(l => l.startsWith(sizePrefix) || (enableRisk && l.startsWith(riskPrefix)));
    const labelsToAdd = [sizeLabel, ...(enableRisk && riskLabel ? [riskLabel] : [])].filter(l => !existingLabels.includes(l));

    if (isActLocal) {
        core.info(`[act] Skipping GitHub API label calls — would apply: ${labelsToAdd.join(', ')}`);

        return;
    }

    await Promise.all(labelsToRemove.map(label => removeLabel(octokit, { owner, repo, pullNumber, label })));

    if (labelsToAdd.length > 0) {
        await octokit.rest.issues.addLabels({ owner, repo, issue_number: pullNumber, labels: labelsToAdd });
        core.info(`Added labels: ${labelsToAdd.join(', ')}`);
    }
};

/**
 * Fetches the names of all labels currently applied to a pull request.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - Repository owner, name, and PR number.
 * @returns Array of label name strings.
 */
const fetchExistingPrLabels = async (octokit: Octokit, { owner, repo, pullNumber }: { owner: string; repo: string; pullNumber: number }): Promise<string[]> => {
    const { data: labelList } = await octokit.rest.issues.listLabelsOnIssue({ owner, repo, issue_number: pullNumber });

    return labelList.map(label => label?.name ?? '');
};

/**
 * Removes a single label from a pull request.
 * Silently ignores 404 errors — the label simply wasn't applied.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - Repository owner, name, PR number, and label name to remove.
 * @throws Re-throws any non-404 API errors.
 */
const removeLabel = async (octokit: Octokit, { owner, repo, pullNumber, label }: { owner: string; repo: string; pullNumber: number; label: string }): Promise<void> => {
    try {
        await octokit.rest.issues.removeLabel({
            owner,
            repo,
            issue_number: pullNumber,
            name: label
        });
        core.info(`Removed stale label: ${label}`);
    } catch (error) {
        const status = (error as { status?: number })?.status;

        // --| 404 means label wasn't on the PR — safe to ignore
        if (status !== 404) {
            throw error;
        }
    }
};

/**
 * Ensures all required size and risk labels exist in the repository.
 * Creates any missing labels with their predefined color and description.
 *
 * @param octokit - Authenticated Octokit instance.
 * @param params - Repository owner, name, and whether risk labels are enabled.
 */
const ensureLabelsExist = async (octokit: Octokit, { owner, repo, enableRisk }: { owner: string; repo: string; enableRisk: boolean }): Promise<void> => {
    const required = [...SIZE_LABELS, ...(enableRisk ? RISK_LABELS : [])];

    const { data: existing } = await octokit.rest.issues.listLabelsForRepo({ owner, repo, per_page: 100 });
    const existingNames = new Set(existing.map(l => l.name));

    // prettier-ignore
    await Promise.all(required?.filter(l => !existingNames.has(l.name))?.map(l =>
        octokit.rest.issues.createLabel({
            owner,
            repo,
            name: l.name,
            color: l.color,
            description: l.description
        })
        .then(() => core.info(`Created label: ${l.name}`))
    ));
};
