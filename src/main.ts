import * as core from '@actions/core';
import { shouldSkipBranch } from './utils';
import { getInputs } from './action-inputs';
import { GithubConnector } from './github-connector';
import { JiraConnector } from './jira-connector';

async function run(): Promise<void> {
  const { FAIL_WHEN_JIRA_ISSUE_NOT_FOUND } = getInputs();
  try {
    const { BRANCH_IGNORE_PATTERN } = getInputs();

    const githubConnector = new GithubConnector();
    const jiraConnector = new JiraConnector();

    if (!githubConnector.isPRAction) {
      console.log('This action meant to be run only on PRs');
      process.exit(0);
    }

    if (shouldSkipBranch(githubConnector.headBranch, BRANCH_IGNORE_PATTERN)) {
      process.exit(0);
    }

    const issueKey = githubConnector.getIssueKeyFromTitle();

    if (!issueKey) {
      console.log(`JIRA key was not found`);
      if (FAIL_WHEN_JIRA_ISSUE_NOT_FOUND) {
        console.log('Action failed');
        process.exit(1);
      } else process.exit(0);
    }

    console.log(`JIRA key -> ${issueKey}`);

    await jiraConnector.getTicketDetails(issueKey);
  } catch (error) {
    console.log('Something went wrong!');
    console.log({ error });
    core.setFailed(error.message);
  }
}

run();
