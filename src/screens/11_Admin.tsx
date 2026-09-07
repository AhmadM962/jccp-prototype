import { Link } from 'react-router-dom';
import { Check, Minus, ShieldHalf } from 'lucide-react';
import { Card, Pill } from '../components/ui';

// RBAC is itself an implementation of several JNCSF access-control requirements — this
// panel makes that explicit. It is a defence artifact, not decoration.

type Perm = 'full' | 'some' | 'none';

const ROLES = ['Assessment Owner', 'Analyst', 'Executive', 'Contributor', 'Regulator', 'Appliance Admin'] as const;

interface FeatureRow {
  feature: string;
  jncsf: { id: string; name: string };
  perms: Record<(typeof ROLES)[number], Perm>;
  note?: string;
}

const P = (
  owner: Perm,
  analyst: Perm,
  exec: Perm,
  contrib: Perm,
  reg: Perm,
  admin: Perm,
): FeatureRow['perms'] => ({
  'Assessment Owner': owner,
  Analyst: analyst,
  Executive: exec,
  Contributor: contrib,
  Regulator: reg,
  'Appliance Admin': admin,
});

const FEATURES: FeatureRow[] = [
  {
    feature: 'Read assessment content (controls, evidence, personal data in excerpts)',
    jncsf: { id: 'JNCSF-102', name: 'Least privilege' },
    perms: P('full', 'full', 'none', 'none', 'none', 'none'),
    note: 'Appliance Admin operates the box but is cryptographically walled off from assessment content.',
  },
  {
    feature: 'View interval, coverage and assurance only (no drill-down)',
    jncsf: { id: 'JNCSF-440', name: 'Enforce access restrictions' },
    perms: P('full', 'full', 'full', 'none', 'some', 'none'),
  },
  {
    feature: 'Set organisation profile and scope exclusions',
    jncsf: { id: 'JNCSF-100', name: 'Separation of duties' },
    perms: P('full', 'some', 'none', 'none', 'none', 'none'),
    note: 'Owner sets scope; Analyst can challenge but not silently change it.',
  },
  {
    feature: 'Override a control verdict (analyst-signed, audit-logged)',
    jncsf: { id: 'JNCSF-30', name: 'Generate audit records' },
    perms: P('some', 'full', 'none', 'none', 'none', 'none'),
  },
  {
    feature: 'Submit evidence against an assigned artifact slot',
    jncsf: { id: 'JNCSF-146', name: 'Session lock / least function' },
    perms: P('full', 'full', 'none', 'some', 'none', 'none'),
    note: 'Contributor sees only their own assigned slots and submission status.',
  },
  {
    feature: 'Approve the OSCAL submission package for the regulator',
    jncsf: { id: 'JNCSF-435', name: 'Multi-factor authentication' },
    perms: P('full', 'none', 'none', 'none', 'none', 'none'),
    note: 'Sign-off requires the Owner and step-up MFA.',
  },
  {
    feature: 'Manage appliance: updates, backups, TLS certificates, log forwarding',
    jncsf: { id: 'JNCSF-107', name: 'Separate privileged IDs' },
    perms: P('none', 'none', 'none', 'none', 'none', 'full'),
    note: 'A separate privileged identity; cannot read a single control.',
  },
];

const cell = (p: Perm) =>
  p === 'full' ? (
    <Check size={14} className="mx-auto text-emerald-600" />
  ) : p === 'some' ? (
    <span className="mx-auto block text-[11px] font-semibold text-amber-600">scoped</span>
  ) : (
    <Minus size={14} className="mx-auto text-slate-300" />
  );

export default function Admin() {
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <ShieldHalf size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Roles &amp; access</h2>
            <p className="mt-1 text-sm text-slate-500">
              Every role boundary in JCCP implements a JNCSF access-control requirement. The
              <strong> Appliance Admin</strong> can run the box but cannot read one line of assessment
              content — separation of duties by design. Use the{' '}
              <span className="font-medium text-slate-700">Viewing as</span> switcher (top right) to see each
              view.
            </p>
          </div>
        </div>
      </Card>

      <Card title="RBAC matrix" subtitle="feature × role, with the control each boundary implements">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Feature</th>
                <th className="py-2 pr-4">Implements</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-2 py-2 text-center">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.feature} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 text-slate-700">
                    {f.feature}
                    {f.note && <div className="mt-0.5 text-[11px] text-slate-400">{f.note}</div>}
                  </td>
                  <td className="py-3 pr-4">
                    <Link to={`/control/${f.jncsf.id}`} className="whitespace-nowrap">
                      <Pill tone="blue">{f.jncsf.id}</Pill>
                    </Link>
                    <div className="mt-0.5 text-[11px] text-slate-400">{f.jncsf.name}</div>
                  </td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-2 py-3 text-center">{cell(f.perms[r])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          <Check size={11} className="inline text-emerald-600" /> full ·{' '}
          <span className="font-semibold text-amber-600">scoped</span> partial / own-records only ·{' '}
          <Minus size={11} className="inline text-slate-300" /> none
        </p>
      </Card>
    </div>
  );
}
