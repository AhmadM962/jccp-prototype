import { Component, type ReactNode } from 'react';
import { IntervalConsistencyError } from '../lib/scoring';

/** Shown in place of a single figure that failed an internal consistency check. */
export const WITHHELD_MESSAGE =
  'This figure could not be displayed because it failed an internal consistency check. The assessment data is unchanged; the number was withheld rather than shown unverified.';

/** Shown in place of a whole screen. A screen withheld is a different event from one figure
 *  withheld, so it does not borrow the figure wording. */
export const WITHHELD_SCREEN_MESSAGE =
  'This screen could not be displayed because a figure failed an internal consistency check. The assessment data is unchanged. Other screens are unaffected.';

interface Props {
  children: ReactNode;
  /** when this changes the boundary tries again (the data behind the figure has changed) */
  resetKey?: string;
  /** what is being withheld: one figure (default) or a whole screen */
  scope?: 'figure' | 'screen';
}

/** Fails honestly. A guard that stops a wrong number must not take the page with it: this catches
 *  only the consistency error, shows the message, keeps everything else on the page rendering, and
 *  logs which guard fired. Any other error is not ours to hide and is rethrown to the next boundary. */
export default class FigureBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (error instanceof IntervalConsistencyError) {
      console.error(`[consistency] figure withheld by guard "${error.where}": ${error.message}`);
    }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!(error instanceof IntervalConsistencyError)) throw error;
    return (
      <div
        role="alert"
        data-testid={this.props.scope === 'screen' ? 'screen-withheld' : 'figure-withheld'}
        data-where={error.where}
        className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-[12px] leading-snug text-slate-600"
      >
        {this.props.scope === 'screen' ? WITHHELD_SCREEN_MESSAGE : WITHHELD_MESSAGE}
      </div>
    );
  }
}
