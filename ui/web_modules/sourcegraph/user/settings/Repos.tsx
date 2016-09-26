// tslint:disable: typedef ordered-imports

import * as React from "react";
import * as styles from "sourcegraph/user/settings/styles/Repos.css";
import * as base from "sourcegraph/components/styles/_base.css";
import {Input, Heading, Button, ToggleSwitch} from "sourcegraph/components";
import {RepoLink} from "sourcegraph/components/RepoLink";
import * as Dispatcher from "sourcegraph/Dispatcher";
import * as RepoActions from "sourcegraph/repo/RepoActions";
import * as debounce from "lodash/debounce";
import {GitHubAuthButton} from "sourcegraph/components/GitHubAuthButton";
import {privateGitHubOAuthScopes, adminRepoGitHubOAuthScopes} from "sourcegraph/util/urlTo";
import {context} from "sourcegraph/app/context";

interface Props {
	repos: any[];
	location?: any;
}

type State = any;

export class Repos extends React.Component<Props, State> {
	static contextTypes: React.ValidationMap<any> = {
	};

	_filterInput: any;

	constructor(props: Props) {
		super(props);
		this._filterInput = null;
		this._handleFilter = this._handleFilter.bind(this);
		this._handleFilter = debounce(this._handleFilter, 25);
		this._showRepo = this._showRepo.bind(this);
		this._enableWebhook = this._enableWebhook.bind(this);
	}

	// _repoSort is a comparison function that sorts more recently
	// pushed repos first.
	_repoSort(a, b) {
		if (a.PushedAt < b.PushedAt) {
			return 1;
		}
		if (a.PushedAt > b.PushedAt) {
			return -1;
		}
		return 0;
	}

	_handleFilter() {
		this.forceUpdate();
	}

	_showRepo(repo) {
		if (this._filterInput && this._filterInput.value &&
			this._qualifiedName(repo).indexOf(this._filterInput.value.trim().toLowerCase()) === -1) {
			return false;
		}

		return true; // no filter; return all
	}

	_qualifiedName(repo) {
		return (`${repo.Owner}/${repo.Name}`).toLowerCase();
	}

	_toggleRepo(remoteRepo: any) {
		Dispatcher.Backends.dispatch(new RepoActions.WantCreateRepo(remoteRepo.URI, remoteRepo, true));
	}

	_enableWebhook(uri) {
		Dispatcher.Backends.dispatch(new RepoActions.WantCreateRepoHook(uri));
	}

	render(): JSX.Element | null {
		let repos = (this.props.repos || []).filter(this._showRepo).sort(this._repoSort);

		return (
			<div className={base.pb6}>
				<header className={styles.header}>
					<Heading level={7} color="gray">Your repositories</Heading>
					<p>To get jump-to-definition, search, and code examples, enable indexing on your repositories using the toggle. Private code indexed on Sourcegraph is only available to you and those with permissions to the underlying GitHub repository.</p>
					<div className={styles.input_bar}>
						{!context.gitHubToken && <GitHubAuthButton returnTo={this.props.location} className={styles.github_button}>Add public repositories</GitHubAuthButton>}
						{!context.hasPrivateGitHubToken() && <GitHubAuthButton scopes={privateGitHubOAuthScopes} returnTo={this.props.location} className={styles.github_button}>Add private repositories</GitHubAuthButton>}
						{!context.hasHookGitHubToken() && false && <GitHubAuthButton scopes={adminRepoGitHubOAuthScopes} returnTo={this.props.location} className={styles.github_button}>Add webhook notification</GitHubAuthButton>}
					</div>
				</header>
				<div className={styles.settings}>
					{context.gitHubToken &&
					<div className={styles.list_heading}>
						<Input type="text"
							placeholder="Find a repository..."
							domRef={(e) => this._filterInput = e}
							spellCheck={false}
							className={styles.filter_input}
							onChange={this._handleFilter} />
						<span className={styles.list_label}>Enable Indexing</span>
					</div>}
					<div className={styles.repos_list}>
						{repos.length > 0 && repos.map((repo, i) =>
							<div className={styles.row} key={i}>
								<div className={styles.info}>
									{repo.ID ?
										<RepoLink repo={repo.URI || `github.com/${repo.Owner}/${repo.Name}`} /> :
										(repo.URI && repo.URI.replace("github.com/", "").replace("/", " / ", 1)) || `${repo.Owner} / ${repo.Name}`
									}
									{repo.Description && <p className={styles.description}>
									{context.hasHookGitHubToken() && <button onClick={() => this._enableWebhook(repo.URI || `github.com/${repo.Owner}/${repo.Name}`)}>Enable Webhook</button>}
										{repo.Description.length > 100 ? `${repo.Description.substring(0, 100)}...` : repo.Description}
									</p>}
								</div>
								<div className={styles.toggle}>
									<ToggleSwitch defaultChecked={Boolean(repo.ID)} onChange={(checked) => {
										this._toggleRepo(repo);
									}}/>
								</div>
							</div>
						)}
					</div>
					{context.gitHubToken && repos.length === 0 && (!this._filterInput || !this._filterInput.value) &&
						<p className={styles.indicator}>Loading...</p>
					}

					{context.gitHubToken && this._filterInput && this._filterInput.value && repos.length === 0 &&
						<p className={styles.indicator}>No matching repositories</p>
					}
				</div>
				{this.props.location && this.props.location.query.onboarding &&
					<footer className={styles.footer}>
						<a className={styles.footer_link} href="/integrations?onboarding=t">
							<Button color="green" className={styles.footer_btn}>Continue</Button>
						</a>
					</footer>
				}
			</div>
		);
	}
}
