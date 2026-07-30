// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EduFlowAgreement
 * @notice Policy-controlled USDC escrow for verified learning milestones.
 *
 * The AI agent never receives unrestricted control of funds.
 * It may only execute payments that satisfy the immutable onchain policy.
 */
contract EduFlowAgreement is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Agreement {
        address payer;
        address provider;
        uint256 totalBudget;
        uint256 amountPaid;
        uint256 maxPerMilestone;
        uint64 expiresAt;
        bool active;
        bool cancelled;
    }

    IERC20 public immutable usdc;
    address public owner;
    address public executor;
    uint256 public nextAgreementId = 1;

    mapping(uint256 => Agreement) private agreements;
    mapping(uint256 => mapping(bytes32 => bool)) public paidMilestones;

    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed payer,
        address indexed provider,
        uint256 totalBudget,
        uint256 maxPerMilestone,
        uint64 expiresAt
    );

    event MilestonePaid(
        uint256 indexed agreementId,
        bytes32 indexed milestoneId,
        address indexed provider,
        uint256 amount,
        bytes32 evidenceHash,
        uint256 remainingBudget
    );

    event AgreementPaused(uint256 indexed agreementId);
    event AgreementResumed(uint256 indexed agreementId);
    event AgreementCancelled(
        uint256 indexed agreementId,
        uint256 refundedAmount
    );
    event ExecutorUpdated(
        address indexed previousExecutor,
        address indexed newExecutor
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyExecutor() {
        require(msg.sender == executor, "ONLY_EXECUTOR");
        _;
    }

    modifier agreementExists(uint256 agreementId) {
        require(
            agreementId > 0 && agreementId < nextAgreementId,
            "AGREEMENT_NOT_FOUND"
        );
        _;
    }

    constructor(address usdcAddress, address initialExecutor) {
        require(usdcAddress != address(0), "INVALID_USDC");
        require(initialExecutor != address(0), "INVALID_EXECUTOR");

        usdc = IERC20(usdcAddress);
        owner = msg.sender;
        executor = initialExecutor;

        emit OwnershipTransferred(address(0), msg.sender);
        emit ExecutorUpdated(address(0), initialExecutor);
    }

    /**
     * @notice Creates and fully funds a learning agreement.
     * @dev The payer must first approve this contract to transfer totalBudget.
     */
    function createAgreement(
        address provider,
        uint256 totalBudget,
        uint256 maxPerMilestone,
        uint64 expiresAt
    ) external nonReentrant returns (uint256 agreementId) {
        require(provider != address(0), "INVALID_PROVIDER");
        require(provider != msg.sender, "PAYER_EQUALS_PROVIDER");
        require(totalBudget > 0, "INVALID_BUDGET");
        require(maxPerMilestone > 0, "INVALID_MILESTONE_LIMIT");
        require(maxPerMilestone <= totalBudget, "LIMIT_EXCEEDS_BUDGET");
        require(expiresAt > block.timestamp, "INVALID_EXPIRY");

        agreementId = nextAgreementId++;

        agreements[agreementId] = Agreement({
            payer: msg.sender,
            provider: provider,
            totalBudget: totalBudget,
            amountPaid: 0,
            maxPerMilestone: maxPerMilestone,
            expiresAt: expiresAt,
            active: true,
            cancelled: false
        });

        usdc.safeTransferFrom(msg.sender, address(this), totalBudget);

        emit AgreementCreated(
            agreementId,
            msg.sender,
            provider,
            totalBudget,
            maxPerMilestone,
            expiresAt
        );
    }

    /**
     * @notice Releases a policy-approved milestone payment.
     * @dev Only the authorized SkillPay executor may call this function.
     */
    function releaseMilestone(
        uint256 agreementId,
        bytes32 milestoneId,
        uint256 amount,
        bytes32 evidenceHash
    )
        external
        onlyExecutor
        agreementExists(agreementId)
        nonReentrant
    {
        Agreement storage agreement = agreements[agreementId];

        require(agreement.active, "AGREEMENT_NOT_ACTIVE");
        require(!agreement.cancelled, "AGREEMENT_CANCELLED");
        require(block.timestamp <= agreement.expiresAt, "AGREEMENT_EXPIRED");
        require(milestoneId != bytes32(0), "INVALID_MILESTONE");
        require(evidenceHash != bytes32(0), "INVALID_EVIDENCE_HASH");
        require(!paidMilestones[agreementId][milestoneId], "MILESTONE_ALREADY_PAID");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= agreement.maxPerMilestone, "MILESTONE_LIMIT_EXCEEDED");

        uint256 availableBudget = agreement.totalBudget - agreement.amountPaid;

        require(amount <= availableBudget, "BUDGET_EXCEEDED");

        paidMilestones[agreementId][milestoneId] = true;
        agreement.amountPaid += amount;

        usdc.safeTransfer(agreement.provider, amount);

        emit MilestonePaid(
            agreementId,
            milestoneId,
            agreement.provider,
            amount,
            evidenceHash,
            agreement.totalBudget - agreement.amountPaid
        );
    }

    function pauseAgreement(
        uint256 agreementId
    ) external agreementExists(agreementId) {
        Agreement storage agreement = agreements[agreementId];

        require(msg.sender == agreement.payer, "ONLY_PAYER");
        require(!agreement.cancelled, "AGREEMENT_CANCELLED");
        require(agreement.active, "ALREADY_PAUSED");

        agreement.active = false;

        emit AgreementPaused(agreementId);
    }

    function resumeAgreement(
        uint256 agreementId
    ) external agreementExists(agreementId) {
        Agreement storage agreement = agreements[agreementId];

        require(msg.sender == agreement.payer, "ONLY_PAYER");
        require(!agreement.cancelled, "AGREEMENT_CANCELLED");
        require(!agreement.active, "ALREADY_ACTIVE");
        require(block.timestamp <= agreement.expiresAt, "AGREEMENT_EXPIRED");

        agreement.active = true;

        emit AgreementResumed(agreementId);
    }

    function cancelAgreement(
        uint256 agreementId
    )
        external
        agreementExists(agreementId)
        nonReentrant
    {
        Agreement storage agreement = agreements[agreementId];

        require(msg.sender == agreement.payer, "ONLY_PAYER");
        require(!agreement.cancelled, "AGREEMENT_CANCELLED");

        agreement.active = false;
        agreement.cancelled = true;

        uint256 refund =
            agreement.totalBudget - agreement.amountPaid;

        if (refund > 0) {
            usdc.safeTransfer(agreement.payer, refund);
        }

        emit AgreementCancelled(agreementId, refund);
    }

    function updateExecutor(address newExecutor) external onlyOwner {
        require(newExecutor != address(0), "INVALID_EXECUTOR");

        address previousExecutor = executor;
        executor = newExecutor;

        emit ExecutorUpdated(previousExecutor, newExecutor);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "INVALID_OWNER");

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function getAgreement(
        uint256 agreementId
    )
        external
        view
        agreementExists(agreementId)
        returns (Agreement memory)
    {
        return agreements[agreementId];
    }

    function remainingBudget(
        uint256 agreementId
    )
        external
        view
        agreementExists(agreementId)
        returns (uint256)
    {
        Agreement memory agreement = agreements[agreementId];
        return agreement.totalBudget - agreement.amountPaid;
    }
}
