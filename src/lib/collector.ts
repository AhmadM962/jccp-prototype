// What the Windows/AD collector runs, as the Intake transcript panel shows it. The query texts are the script's own
// (`collectors/windows_ad/Collect-JccpEvidence.ps1`; a test holds each one to the script), and the controls each signal
// serves are read from the evidence plan, so nothing about a query's purpose is typed twice.
//
// The `engineSignal` column is the collector's signal mapped onto the engine's signal vocabulary. That mapping is a
// proposal for the owner to confirm: authoring evidence paths and signals is the owner's, not the prototype's.

import { planSignals } from './plan';

export interface CollectorSignal {
  id: string;
  negativeCapable: boolean;
  /** the query template, exactly as written in the script ({{…}} tokens are replaced at run time) */
  query: string;
  /** the fields of each raw record (the raw file only; none of them is in the reduced statement) */
  shape: string[];
  /** the engine's signal this feeds (proposed) */
  engineSignal: string;
  why: string;
}

export const COLLECTOR_SIGNALS: CollectorSignal[] = [
  {
    id: 'ad_computer_objects',
    negativeCapable: true,
    query: 'Get-ADComputer -Filter * -Properties OperatingSystem,LastLogonDate | Select-Object Name,DNSHostName,OperatingSystem,Enabled,LastLogonDate,DistinguishedName',
    shape: ['Name', 'DNSHostName', 'OperatingSystem', 'Enabled', 'LastLogonDate', 'DistinguishedName'],
    engineSignal: 'asset.discovered_component.enumeration',
    why: 'a complete enumeration of the directory’s computers: what is on the network to reconcile an inventory against',
  },
  {
    id: 'privileged_group_membership',
    negativeCapable: true,
    query: "{{Groups}} | ForEach-Object { $g = $_; Get-ADGroupMember -Identity $g -Recursive | Select-Object @{n='Group';e={$g}},SamAccountName,ObjectClass,DistinguishedName }",
    shape: ['Group', 'SamAccountName', 'ObjectClass', 'DistinguishedName'],
    engineSignal: 'iam.directory.group_membership',
    why: 'who holds privileged membership, nested groups included',
  },
  {
    id: 'password_policy',
    negativeCapable: true,
    query: 'Get-ADDefaultDomainPasswordPolicy | Select-Object MinPasswordLength,PasswordHistoryCount,MaxPasswordAge,MinPasswordAge,LockoutThreshold,LockoutDuration,LockoutObservationWindow,ComplexityEnabled,ReversibleEncryptionEnabled',
    shape: ['MinPasswordLength', 'PasswordHistoryCount', 'MaxPasswordAge', 'MinPasswordAge', 'LockoutThreshold', 'LockoutDuration', 'LockoutObservationWindow', 'ComplexityEnabled', 'ReversibleEncryptionEnabled'],
    engineSignal: 'iam.authenticator.policy_configuration',
    why: 'the domain’s default authenticator settings',
  },
  {
    id: 'audit_policy_subcategories',
    negativeCapable: true,
    query: 'auditpol /get /category:*',
    shape: ['line'],
    engineSignal: 'audit.event_selection.configuration',
    why: 'which audit subcategories are enabled on the host it runs on',
  },
  {
    id: 'local_administrators',
    negativeCapable: false,
    query: 'Get-LocalGroupMember -Group Administrators | Select-Object Name,ObjectClass,PrincipalSource',
    shape: ['Name', 'ObjectClass', 'PrincipalSource'],
    engineSignal: 'iam.entitlement.assignment',
    why: 'one host’s local administrators: it cannot speak for the estate, so an empty result proves nothing',
  },
  {
    id: 'stale_accounts',
    negativeCapable: true,
    query: "Get-ADUser -Filter 'Enabled -eq $true -and lastLogonTimestamp -lt {{StaleCutoff}}' -Properties lastLogonTimestamp | Select-Object SamAccountName,Enabled,@{n='LastLogon';e={[DateTime]::FromFileTimeUtc($_.lastLogonTimestamp)}},DistinguishedName",
    shape: ['SamAccountName', 'Enabled', 'LastLogon', 'DistinguishedName'],
    engineSignal: 'iam.directory.account_inventory',
    why: 'enabled accounts with no logon inside the window',
  },
];

/** The controls whose evidence requirement names the signal, in the active assessment (empty if it does not name it). */
export const controlsFor = (engineSignal: string): string[] => planSignals().find((s) => s.signal === engineSignal)?.controls ?? [];

/** What a failure is recorded as: never a zero finding. */
export const FAILURE_RULE = 'A query that fails (permission denied, module missing, unreachable) is recorded as failed with record_count null. record_count 0 is written only by a query that ran to the end and returned nothing.';
