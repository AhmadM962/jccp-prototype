import { Link } from 'react-router-dom';
import { Card } from './ui';
import { useAssessment } from '../store/useAssessment';

/** A real organisation has been chosen as the entity. No assessment has been run for it, and none is shown. */
export default function NoAssessment() {
  const name = useAssessment((s) => s.profile.entityName);
  return (
    <Card>
      <div data-testid="no-assessment">
        <h2 className="text-lg font-bold text-slate-900">{name || 'This organisation'}</h2>
        <p className="mt-2 text-sm text-slate-700">No assessment has been run for this organisation.</p>
        <p className="mt-2 text-[12px] text-slate-500">
          The assessments in this prototype are of fictional demonstration organisations only. The{' '}
          <Link to="/profile" className="font-semibold text-accent underline">Organisation Profile</Link> still shows this organisation&rsquo;s sector and scoping; choose the
          demonstration organisation under Entity to see an assessment.
        </p>
      </div>
    </Card>
  );
}
