<#
.SYNOPSIS
    JCCP read-only evidence collector for a Windows / Active Directory estate.

.DESCRIPTION
    Runs six queries, and writes two files:

      jccp-bundle.json      the REDUCED STATEMENT: one object per signal, with no raw record in it.
      jccp-bundle.raw.json  the RAW RECORDS, one array per signal. This file never has to leave the building.

    Read it before you run it. It is short on purpose.

    STATUS: this script has not been run against a live domain by its author (there was no
    Windows host to run it on). It has been written to be read and checked line by line;
    treat the first run as a review, in a test domain, as a user with read rights only.

    DESIGN RULES (each one is an argument you can check against the code below):

    1. READ-ONLY. Every query below is a Get-* cmdlet or a read-only native command. No cmdlet that
       changes Active Directory, a group, a policy or a setting appears in this file (a test in the
       JCCP repository searches the code for such cmdlets). The ONLY things this script writes are two
       files in $OutDir, through .NET calls, not through a cmdlet: it must hand its result to someone.

    2. NO CREDENTIALS STORED. There is no parameter for a password, no Get-Credential, no secret and no
       token. It runs as the user who invoked it, with whatever read rights that user has, and no more.

    3. RAW RECORDS ARE SEPARATE FROM THE REDUCED STATEMENT. The bundle carries, per signal,
       { signal_id, negative_capable, query_text, record_count, records_sha256, result } and nothing
       else that identifies anything. Names, distinguished names and addresses live only in the raw file.
       The hash binds the statement to the raw records: whoever holds the raw file can show that the
       statement was computed from it, and nobody else learns what is in it.

    4. A FAILED QUERY RECORDS ITSELF AS A FAILURE, NEVER AS A ZERO FINDING. If a query throws for any
       reason (permission denied, module missing, domain controller unreachable), the signal is recorded
       with result = 'failed', record_count = null and records_sha256 = null. record_count = 0 is written
       ONLY by a query that ran to the end and returned nothing. A permission error therefore reaches the
       assessment as 'insufficient_permission', which the engine treats as Unknown, never as a Gap. The
       rule is enforced here, where the data starts, so that nothing downstream has to guess.

    5. THE QUERY TEXT IS THE QUERY. query_text is the exact text that was executed: the script builds the
       string, records it, and then runs that same string. The recorded text cannot drift from the code.

    6. negative_capable IS SET CAREFULLY. It says whether an empty result can prove the negative. A complete
       directory enumeration can; a read of one host's local group cannot speak for the estate. A signal
       marked $false here can only ever lead to Unknown, never to a Gap.

    NOT DONE HERE: signing the bundle (the collector is not signed; that belongs with the platform's
    key management) and any network call (there is none: the script sends nothing anywhere).

.PARAMETER OutDir
    Where to write the two files. Defaults to a new timestamped folder under the current directory.

.PARAMETER StaleDays
    An account with no logon for this many days is "stale". Default 90. The stale-accounts query reads
    lastLogonTimestamp, which Active Directory replicates lazily: by default it can be up to 14 days behind
    the account's real last logon. A result is therefore only as fresh as that lag allows, and StaleDays
    should be well above 14; an account near the window's edge may be reported either way.

.PARAMETER PrivilegedGroups
    The groups whose members are "privileged". Defaults to the four below.

.NOTES
    Needs: Windows PowerShell 5.1 or PowerShell 7 on Windows, the ActiveDirectory module (RSAT), and
    read access to the directory. `auditpol /get` needs the right to read the audit policy on the host it
    runs on. Get-LocalGroupMember reads the LOCAL Administrators group of the host the script runs on:
    for an estate, run it on each host (for example from a logon script) and collect the bundles.
#>
#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]   $OutDir = (Join-Path -Path (Get-Location).Path -ChildPath ('jccp-bundle-' + (Get-Date -Format 'yyyyMMddTHHmmss'))),
    [int]      $StaleDays = 90,
    [string[]] $PrivilegedGroups = @('Domain Admins', 'Enterprise Admins', 'Schema Admins', 'Administrators')
)

$ErrorActionPreference = 'Stop'   # a non-terminating error is a failure, not a quiet empty result
$CollectorVersion = '0.1.0'

# ---- the six signals --------------------------------------------------------------------------
# Query text is a template: {{StaleCutoff}} and {{Groups}} are replaced before it is recorded and run.
# NeedsAD: the query needs the ActiveDirectory module. Native: the query is an external program, so its
# exit code decides success.
$Signals = @(
    [ordered]@{
        Id = 'ad_computer_objects'; NegativeCapable = $true; NeedsAD = $true; Native = $false
        Query = 'Get-ADComputer -Filter * -Properties OperatingSystem,LastLogonDate | Select-Object Name,DNSHostName,OperatingSystem,Enabled,LastLogonDate,DistinguishedName'
    },
    [ordered]@{
        Id = 'privileged_group_membership'; NegativeCapable = $true; NeedsAD = $true; Native = $false
        Query = '{{Groups}} | ForEach-Object { $g = $_; Get-ADGroupMember -Identity $g -Recursive | Select-Object @{n=''Group'';e={$g}},SamAccountName,ObjectClass,DistinguishedName }'
    },
    [ordered]@{
        Id = 'password_policy'; NegativeCapable = $true; NeedsAD = $true; Native = $false
        Query = 'Get-ADDefaultDomainPasswordPolicy | Select-Object MinPasswordLength,PasswordHistoryCount,MaxPasswordAge,MinPasswordAge,LockoutThreshold,LockoutDuration,LockoutObservationWindow,ComplexityEnabled,ReversibleEncryptionEnabled'
    },
    [ordered]@{
        Id = 'audit_policy_subcategories'; NegativeCapable = $true; NeedsAD = $false; Native = $true
        Query = 'auditpol /get /category:*'
    },
    [ordered]@{
        Id = 'local_administrators'; NegativeCapable = $false; NeedsAD = $false; Native = $false
        Query = 'Get-LocalGroupMember -Group Administrators | Select-Object Name,ObjectClass,PrincipalSource'
    },
    [ordered]@{
        Id = 'stale_accounts'; NegativeCapable = $true; NeedsAD = $true; Native = $false
        # lastLogonTimestamp is the stored attribute; the LastLogonDate property is calculated client-side and
        # cannot be filtered on the server. It is replicated lazily (up to about 14 days), so StaleDays should be
        # well above that. An account that has never logged on has no value and is not returned by this filter.
        Query = 'Get-ADUser -Filter ''Enabled -eq $true -and lastLogonTimestamp -lt {{StaleCutoff}}'' -Properties lastLogonTimestamp | Select-Object SamAccountName,Enabled,@{n=''LastLogon'';e={[DateTime]::FromFileTimeUtc($_.lastLogonTimestamp)}},DistinguishedName'
    }
)

$Tokens = @{
    '{{StaleCutoff}}' = [string](Get-Date).AddDays(-$StaleDays).ToFileTimeUtc()
    '{{Groups}}'      = (($PrivilegedGroups | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }) -join ',')
}

# ---- helpers ----------------------------------------------------------------------------------
function Get-Sha256Hex([string] $Text) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Text))
        return (($bytes | ForEach-Object { $_.ToString('x2') }) -join '')
    }
    finally { $sha.Dispose() }
}

# Only the CLASS of a failure is kept, never its message: a message can carry a name or a path.
function Get-FailureClass($ErrorRecord) {
    $e = $ErrorRecord.Exception
    $text = $e.GetType().FullName + ' ' + $e.Message
    if ($text -match 'UnauthorizedAccess|SecurityException|access is denied|insufficient access|not authorized|privilege is not held') { return 'insufficient_permission' }
    if ($text -match 'ActiveDirectory module unavailable') { return 'module_unavailable' }
    return 'query_failed'
}

$AdAvailable = $true
try { Import-Module -Name ActiveDirectory -ErrorAction Stop } catch { $AdAvailable = $false }

# ---- run each signal --------------------------------------------------------------------------
$Reduced = @()
$Raw = [ordered]@{}

foreach ($s in $Signals) {
    $queryText = $s.Query
    foreach ($k in $Tokens.Keys) { $queryText = $queryText.Replace($k, $Tokens[$k]) }

    $entry = [ordered]@{
        signal_id       = $s.Id
        negative_capable = $s.NegativeCapable
        query_text      = $queryText
        record_count    = $null
        records_sha256  = $null
        result          = 'failed'
        failure_class   = $null
    }
    $records = @()

    try {
        if ($s.NeedsAD -and -not $AdAvailable) { throw 'ActiveDirectory module unavailable' }
        $global:LASTEXITCODE = 0
        $out = @(& ([scriptblock]::Create($queryText)))
        if ($s.Native -and $global:LASTEXITCODE -ne 0) { throw ('native command failed: ' + (($out | Out-String).Trim())) }
        if ($s.Native) { $out = @($out | Where-Object { $_ -and $_.ToString().Trim() } | ForEach-Object { [ordered]@{ line = $_.ToString().TrimEnd() } }) }

        $records = $out
        $json = ConvertTo-Json -InputObject @($records) -Depth 6 -Compress
        $entry.record_count   = $records.Count          # 0 only when the query completed and returned nothing
        $entry.records_sha256 = Get-Sha256Hex $json
        $entry.result         = 'success'
    }
    catch {
        # A failure is a failure. It is never counted, hashed or reported as an empty result.
        $entry.result         = 'failed'
        $entry.failure_class  = Get-FailureClass $_
        $entry.record_count   = $null
        $entry.records_sha256 = $null
        $records = @()
    }

    $Reduced += , $entry
    $Raw[$s.Id] = @($records)
    Write-Host ('{0,-30} {1,-8} records={2}' -f $s.Id, $entry.result, $(if ($null -eq $entry.record_count) { 'n/a' } else { $entry.record_count }))
}

# ---- write the two files (the only writes in this script) -------------------------------------
$bundle = [ordered]@{
    schema       = 'jccp.windows_ad.bundle/1'
    collector    = [ordered]@{ name = 'Collect-JccpEvidence'; version = $CollectorVersion }
    run_id       = [guid]::NewGuid().ToString()
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
    signals      = $Reduced
}

[System.IO.Directory]::CreateDirectory($OutDir) | Out-Null
$utf8 = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText((Join-Path -Path $OutDir -ChildPath 'jccp-bundle.json'),     (ConvertTo-Json -InputObject $bundle -Depth 8), $utf8)
[System.IO.File]::WriteAllText((Join-Path -Path $OutDir -ChildPath 'jccp-bundle.raw.json'), (ConvertTo-Json -InputObject $Raw    -Depth 8), $utf8)

$failed = @($Reduced | Where-Object { $_.result -ne 'success' }).Count
Write-Host ('Wrote {0}. {1} of {2} signals failed; a failed signal is Unknown to the assessment, never a Gap.' -f $OutDir, $failed, $Reduced.Count)
if ($failed -gt 0) { exit 3 }
