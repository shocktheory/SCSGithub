<?php
declare(strict_types=1);

namespace Scs\Tests;

use PHPUnit\Framework\TestCase;
use Scs\Derivation;
use Scs\VersionException;

/**
 * Phase 7 — Constitutional derivation engine (pure, no DB).
 * Verifies determinism, reproducibility, versioning, and constitutional correctness. The client
 * parity of the SAME rules is verified end-to-end in app/tests/derivation.e2e.test.ts.
 */
final class DerivationTest extends TestCase
{
    private Derivation $d;

    protected function setUp(): void { $this->d = new Derivation(); }

    /** Full approved activation evidence set (mirrors the client golden fixture). */
    private function full(): array
    {
        return [
            'agentName' => '#X',
            'standingDirective' => ['id' => 'ST-SD-005', 'version' => 'v1', 'status' => 'Current'],
            'productOwnerAuthority' => ['id' => 'ST-DEC-2026-008', 'approved' => true],
            'activationEventIds' => ['ST-OPH-2026-004'],
            'teamMembership' => ['label' => 'TEAM-001 — Active', 'active' => true],
        ];
    }

    // ---- Constitutional correctness (parity with the client engine) -------------------------
    public function testAvailableWithFullEvidenceNoAssignment(): void
    {
        $s = $this->d->deriveAgentState($this->full());
        $this->assertTrue($s['activated']);
        $this->assertSame('Available', $s['status']);
        $this->assertSame('Awaiting Assignment', $s['currentGate']);
        $this->assertSame('Not Required', $s['synchronization']);
        $this->assertSame('Full', $s['directiveCoverage']);
        $this->assertSame('Not Applicable — Awaiting Assignment', $s['assignmentDirectiveStatus']);
        $this->assertSame([], $s['missingLinks']);
    }

    public function testMissingStandingDirectiveIsPendingOnboarding(): void
    {
        $in = $this->full(); unset($in['standingDirective']);
        $s = $this->d->deriveAgentState($in);
        $this->assertFalse($s['activated']);
        $this->assertContains('Current Standing Directive', $s['missingEvidence']);
        $this->assertSame('Pending Onboarding', $s['status']);
    }

    public function testWorkingWithActiveAssignmentDirective(): void
    {
        $in = $this->full();
        $in['activeAssignmentDirective'] = ['directiveId' => 'ST-ADR-2026-005', 'title' => 'Research', 'status' => 'Active', 'deliverable' => 'D', 'reviewGate' => 'Gate'];
        $s = $this->d->deriveAgentState($in);
        $this->assertTrue($s['activated']);
        $this->assertSame('Working', $s['status']);
        $this->assertSame('Gate', $s['currentGate']);
        $this->assertSame('Synchronized', $s['synchronization']);
    }

    public function testContradictoryMembershipSurfacedNotResolved(): void
    {
        $in = $this->full();
        $in['membershipConflict'] = true;
        $in['conflictingMemberships'] = ['TM-1 → TEAM-001', 'TM-2 → TEAM-002'];
        $s = $this->d->deriveAgentState($in);
        $this->assertFalse($s['activated']);
        $this->assertNotEmpty($s['contradictions']);
        $this->assertStringContainsString('requires Product Owner resolution', $s['contradictions'][0]);
    }

    // ---- Determinism + reproducibility (constitutional requirements) ------------------------
    public function testDerivationIsDeterministic(): void
    {
        $a = $this->d->deriveAgentState($this->full());
        $b = $this->d->deriveAgentState($this->full());
        $this->assertSame(Derivation::canonicalize($a), Derivation::canonicalize($b), 'identical inputs must produce identical output');
    }

    public function testInputHashStableAndInputSensitive(): void
    {
        $h1 = $this->d->inputHash($this->full());
        $h2 = $this->d->inputHash($this->full());
        $this->assertSame($h1, $h2, 'same input → same hash (replay key stability)');
        $changed = $this->full(); $changed['agentName'] = '#Y';
        $this->assertNotSame($h1, $this->d->inputHash($changed), 'changed input → different hash (old derivation is stale)');
    }

    public function testCanonicalizationIsKeyOrderIndependent(): void
    {
        $x = ['b' => 1, 'a' => ['d' => 4, 'c' => 3]];
        $y = ['a' => ['c' => 3, 'd' => 4], 'b' => 1];
        $this->assertSame(Derivation::canonicalize($x), Derivation::canonicalize($y));
    }

    // ---- Version governance (independent version systems) -----------------------------------
    public function testCompatibleSameMajorAndSelf(): void
    {
        $this->d->assertCompatible(Derivation::DERIVATION_VERSION, null);
        $this->d->assertCompatible(null, null);
        $this->addToAssertionCount(1);
    }

    public function testIncompatibleDerivationVersionThrows(): void
    {
        $this->expectException(VersionException::class);
        $this->d->assertCompatible('99.0.0', null);
    }

    public function testIncompatibleSchemaVersionThrows(): void
    {
        $this->expectException(VersionException::class);
        $this->d->assertCompatible(null, '99.0.0');
    }

    // ---- Whole-team derivation from authoritative records -----------------------------------
    public function testDeriveTeamActivatesFromApprovedEvidence(): void
    {
        $c = [
            'aiCollaborators' => [['id' => 'a1', 'name' => '#X', 'role' => 'r']],
            'decisions' => [['id' => 'd1', 'decisionId' => 'ST-DEC-2026-008', 'authorityStatus' => 'approved']],
            'standingDirectives' => [['id' => 'sd1', 'agent' => 'a1', 'directiveId' => 'ST-SD-005', 'version' => 'v1', 'status' => 'Current', 'governingDecision' => 'd1']],
            'assignmentDirectives' => [],
            'operationalHistory' => [['id' => 'oh1', 'agent' => 'a1', 'entryId' => 'ST-OPH-2026-004', 'evidenceType' => 'Constitutional activation', 'authorityStatus' => 'approved']],
            'teams' => [['id' => 't1', 'teamId' => 'TEAM-001']],
            'teamMemberships' => [['id' => 'tm1', 'agent' => 'a1', 'team' => 't1', 'membershipId' => 'TM-001', 'status' => 'Active']],
            'deliverables' => [],
            'gates' => [],
        ];
        $out = $this->d->deriveTeam($c);
        $this->assertCount(1, $out['agents']);
        $this->assertTrue($out['agents'][0]['activated']);
        $this->assertSame(1, $out['metrics']['activeAgents']);
        $this->assertSame(0, $out['metrics']['contradictions']);
    }
}
