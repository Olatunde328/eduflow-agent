import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import hre from "hardhat";
import { getAddress, keccak256, parseUnits, stringToHex } from "viem";

const { viem } = await hre.network.create();

const THIRTY_USDC = parseUnits("30", 6);
const TEN_USDC = parseUnits("10", 6);
const FIFTEEN_USDC = parseUnits("15", 6);

describe("EduFlowAgreement", function () {
  async function deployFixture() {
    const [payer, executor, provider, attacker] =
      await viem.getWalletClients();

    const mockUsdc = await viem.deployContract(
      "MockUSDC",
      [payer.account.address, parseUnits("1000", 6)],
      { account: payer.account },
    );

    const eduFlow = await viem.deployContract(
      "EduFlowAgreement",
      [mockUsdc.address, executor.account.address],
      { account: payer.account },
    );

    await mockUsdc.write.approve(
      [eduFlow.address, THIRTY_USDC],
      { account: payer.account },
    );

    const publicClient = await viem.getPublicClient();
    const latestBlock = await publicClient.getBlock();
    const expiresAt = latestBlock.timestamp + 7n * 24n * 60n * 60n;

    await eduFlow.write.createAgreement(
      [
        provider.account.address,
        THIRTY_USDC,
        TEN_USDC,
        expiresAt,
      ],
      { account: payer.account },
    );

    return {
      payer,
      executor,
      provider,
      attacker,
      mockUsdc,
      eduFlow,
    };
  }

  let fixture: Awaited<ReturnType<typeof deployFixture>>;

  beforeEach(async function () {
    fixture = await deployFixture();
  });

  it("creates and fully funds an agreement", async function () {
    const { eduFlow, mockUsdc, payer, provider } = fixture;

    const agreement = await eduFlow.read.getAgreement([1n]);
    const contractBalance = await mockUsdc.read.balanceOf([
      eduFlow.address,
    ]);

    assert.equal(getAddress(agreement.payer), getAddress(payer.account.address));
    assert.equal(getAddress(agreement.provider), getAddress(provider.account.address));
    assert.equal(agreement.totalBudget, THIRTY_USDC);
    assert.equal(agreement.amountPaid, 0n);
    assert.equal(agreement.maxPerMilestone, TEN_USDC);
    assert.equal(agreement.active, true);
    assert.equal(contractBalance, THIRTY_USDC);
  });

  it("allows the authorized executor to pay a verified milestone", async function () {
    const { eduFlow, mockUsdc, executor, provider } = fixture;

    const milestoneId = keccak256(stringToHex("lesson_001"));
    const evidenceHash = keccak256(
      stringToHex("duration:52|confirmed:true|score:80"),
    );

    await eduFlow.write.releaseMilestone(
      [1n, milestoneId, TEN_USDC, evidenceHash],
      { account: executor.account },
    );

    const providerBalance = await mockUsdc.read.balanceOf([
      provider.account.address,
    ]);

    const remaining = await eduFlow.read.remainingBudget([1n]);
    const paid = await eduFlow.read.paidMilestones([
      1n,
      milestoneId,
    ]);

    assert.equal(providerBalance, TEN_USDC);
    assert.equal(remaining, parseUnits("20", 6));
    assert.equal(paid, true);
  });

  it("blocks callers that are not the authorized executor", async function () {
    const { eduFlow, attacker } = fixture;

    await viem.assertions.revertWith(
      eduFlow.write.releaseMilestone(
        [
          1n,
          keccak256(stringToHex("lesson_001")),
          TEN_USDC,
          keccak256(stringToHex("valid evidence")),
        ],
        { account: attacker.account },
      ),
      "ONLY_EXECUTOR",
    );
  });

  it("prevents duplicate milestone payments", async function () {
    const { eduFlow, executor } = fixture;

    const milestoneId = keccak256(stringToHex("lesson_001"));
    const evidenceHash = keccak256(stringToHex("valid evidence"));

    await eduFlow.write.releaseMilestone(
      [1n, milestoneId, TEN_USDC, evidenceHash],
      { account: executor.account },
    );

    await viem.assertions.revertWith(
      eduFlow.write.releaseMilestone(
        [1n, milestoneId, TEN_USDC, evidenceHash],
        { account: executor.account },
      ),
      "MILESTONE_ALREADY_PAID",
    );
  });

  it("blocks payments above the milestone limit", async function () {
    const { eduFlow, executor } = fixture;

    await viem.assertions.revertWith(
      eduFlow.write.releaseMilestone(
        [
          1n,
          keccak256(stringToHex("lesson_002")),
          FIFTEEN_USDC,
          keccak256(stringToHex("valid evidence")),
        ],
        { account: executor.account },
      ),
      "MILESTONE_LIMIT_EXCEEDED",
    );
  });

  it("blocks payment while the agreement is paused", async function () {
    const { eduFlow, payer, executor } = fixture;

    await eduFlow.write.pauseAgreement(
      [1n],
      { account: payer.account },
    );

    await viem.assertions.revertWith(
      eduFlow.write.releaseMilestone(
        [
          1n,
          keccak256(stringToHex("lesson_001")),
          TEN_USDC,
          keccak256(stringToHex("valid evidence")),
        ],
        { account: executor.account },
      ),
      "AGREEMENT_NOT_ACTIVE",
    );
  });

  it("allows only the payer to pause the agreement", async function () {
    const { eduFlow, attacker } = fixture;

    await viem.assertions.revertWith(
      eduFlow.write.pauseAgreement(
        [1n],
        { account: attacker.account },
      ),
      "ONLY_PAYER",
    );
  });

  it("refunds unused USDC when the payer cancels", async function () {
    const { eduFlow, mockUsdc, payer, executor } = fixture;

    await eduFlow.write.releaseMilestone(
      [
        1n,
        keccak256(stringToHex("lesson_001")),
        TEN_USDC,
        keccak256(stringToHex("valid evidence")),
      ],
      { account: executor.account },
    );

    const balanceBefore = await mockUsdc.read.balanceOf([
      payer.account.address,
    ]);

    await eduFlow.write.cancelAgreement(
      [1n],
      { account: payer.account },
    );

    const balanceAfter = await mockUsdc.read.balanceOf([
      payer.account.address,
    ]);

    const agreement = await eduFlow.read.getAgreement([1n]);

    assert.equal(
      balanceAfter - balanceBefore,
      parseUnits("20", 6),
    );

    assert.equal(agreement.cancelled, true);
    assert.equal(agreement.active, false);
  });
});
