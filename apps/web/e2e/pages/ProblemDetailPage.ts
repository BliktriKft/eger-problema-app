import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** /problems/[id] — the detail shell. Vote + wiki compose inside. */
export class ProblemDetailPage extends BasePage {
  readonly shell: Locator;
  readonly voteButtons: Locator;
  readonly voteUp: Locator;
  readonly voteDown: Locator;
  readonly voteScore: Locator;
  readonly wikiSection: Locator;

  constructor(page: Page, private readonly id: string) {
    super(page);
    this.shell = this.byTestId(`problem-detail-${id}`);
    this.voteButtons = this.byTestId('vote-buttons');
    this.voteUp = this.byTestId('vote-up');
    this.voteDown = this.byTestId('vote-down');
    this.voteScore = this.byTestId('vote-score');
    this.wikiSection = this.byTestId(`wiki-section-${id}`);
  }

  async goto(): Promise<void> {
    await this.page.goto(`/problems/${this.id}`);
    await expect(this.shell).toBeVisible({ timeout: 10_000 });
  }

  async upvote(): Promise<void> {
    await this.voteUp.click();
  }

  async downvote(): Promise<void> {
    await this.voteDown.click();
  }

  async currentScore(): Promise<number> {
    const txt = await this.voteScore.textContent();
    if (!txt) return NaN;
    const trimmed = txt.trim();
    return Number(trimmed.replace(/^\+/, ''));
  }
}
