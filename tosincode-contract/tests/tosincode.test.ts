
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const CONTRACT_NAME = "tosincode";

describe("Tosincode Smart Contract Tests", () => {
  beforeEach(() => {
    // Reset simnet state before each test
    simnet.setEpoch("3.0");
  });

  describe("Contract Initialization", () => {
    it("should initialize with correct default values", () => {
      const { result: totalUsers } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-users",
        [],
        deployer
      );
      expect(totalUsers).toBeUint(0);

      const { result: platformFee } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-platform-fee",
        [],
        deployer
      );
      expect(platformFee).toBeUint(100); // 1% default fee

      const { result: owner } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-contract-owner",
        [],
        deployer
      );
      expect(owner).toBePrincipal(deployer);
    });
  });

  describe("User Profile Management", () => {
    it("should create a user profile successfully", () => {
      const username = "alice_dev";
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii(username)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));

      // Check if user profile was created
      const { result: profile } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-profile",
        [Cl.principal(wallet1)],
        wallet1
      );
      
      expect(profile).toBeSome(
        Cl.tuple({
          username: Cl.stringAscii(username),
          reputation: Cl.uint(0),
          "total-contributions": Cl.uint(0),
          "join-date": Cl.uint(simnet.blockHeight),
          "is-verified": Cl.bool(false)
        })
      );

      // Check total users incremented
      const { result: totalUsers } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-users",
        [],
        deployer
      );
      expect(totalUsers).toBeUint(1);
    });

    it("should not allow duplicate user profiles", () => {
      const username = "bob_dev";
      
      // Create first profile
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii(username)],
        wallet1
      );

      // Try to create duplicate profile
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii("another_name")],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(409)); // ERR_USER_EXISTS
    });

    it("should not allow empty username", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii("")],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_INPUT
    });

    it("should check if user exists correctly", () => {
      // User doesn't exist initially
      const { result: existsBefore } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "user-exists",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(existsBefore).toBeBool(false);

      // Create user
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii("charlie_dev")],
        wallet1
      );

      // User exists now
      const { result: existsAfter } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "user-exists",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(existsAfter).toBeBool(true);
    });
  });

  describe("Reputation Management", () => {
    beforeEach(() => {
      // Create user profile for testing
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii("test_user")],
        wallet1
      );
    });

    it("should allow owner to update user reputation", () => {
      const points = 100;
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-reputation",
        [Cl.principal(wallet1), Cl.uint(points)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Check reputation was updated
      const { result: reputation } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-reputation",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(reputation).toBeSome(Cl.uint(points));
    });

    it("should not allow non-owner to update reputation", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-reputation",
        [Cl.principal(wallet1), Cl.uint(100)],
        wallet2 // Non-owner
      );
      expect(result).toBeErr(Cl.uint(401)); // ERR_NOT_AUTHORIZED
    });

    it("should not update reputation for non-existent user", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-reputation",
        [Cl.principal(wallet2), Cl.uint(100)], // wallet2 has no profile
        deployer
      );
      expect(result).toBeErr(Cl.uint(404)); // ERR_USER_NOT_FOUND
    });
  });

  describe("Achievement System", () => {
    beforeEach(() => {
      // Create user profile for testing
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii("achievement_user")],
        wallet1
      );
    });

    it("should allow owner to add achievement to user", () => {
      const achievementId = 1;
      const title = "First Contribution";
      const description = "Made your first code contribution";
      const points = 50;

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-achievement",
        [
          Cl.principal(wallet1),
          Cl.uint(achievementId),
          Cl.stringAscii(title),
          Cl.stringAscii(description),
          Cl.uint(points)
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Check achievement was added
      const { result: achievement } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-achievement",
        [Cl.principal(wallet1), Cl.uint(achievementId)],
        deployer
      );
      
      expect(achievement).toBeSome(
        Cl.tuple({
          title: Cl.stringAscii(title),
          description: Cl.stringAscii(description),
          "earned-date": Cl.uint(simnet.blockHeight),
          points: Cl.uint(points)
        })
      );

      // Check reputation was updated with points
      const { result: reputation } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-reputation",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(reputation).toBeSome(Cl.uint(points));
    });

    it("should not allow non-owner to add achievements", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-achievement",
        [
          Cl.principal(wallet1),
          Cl.uint(1),
          Cl.stringAscii("Test Achievement"),
          Cl.stringAscii("Test Description"),
          Cl.uint(50)
        ],
        wallet2 // Non-owner
      );
      expect(result).toBeErr(Cl.uint(401)); // ERR_NOT_AUTHORIZED
    });

    it("should not add achievement for non-existent user", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-achievement",
        [
          Cl.principal(wallet2), // No profile
          Cl.uint(1),
          Cl.stringAscii("Test Achievement"),
          Cl.stringAscii("Test Description"),
          Cl.uint(50)
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(404)); // ERR_USER_NOT_FOUND
    });
  });

  describe("User Verification", () => {
    beforeEach(() => {
      // Create user profile for testing
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii("verify_user")],
        wallet1
      );
    });

    it("should allow owner to verify user", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "verify-user",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Check user is verified
      const { result: profile } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-profile",
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(profile).toBeSome(
        Cl.tuple({
          username: Cl.stringAscii("verify_user"),
          reputation: Cl.uint(0),
          "total-contributions": Cl.uint(0),
          "join-date": Cl.uint(simnet.blockHeight - 1), // Created in beforeEach
          "is-verified": Cl.bool(true)
        })
      );
    });

    it("should not allow non-owner to verify user", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "verify-user",
        [Cl.principal(wallet1)],
        wallet2 // Non-owner
      );
      expect(result).toBeErr(Cl.uint(401)); // ERR_NOT_AUTHORIZED
    });

    it("should not verify non-existent user", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "verify-user",
        [Cl.principal(wallet2)], // No profile
        deployer
      );
      expect(result).toBeErr(Cl.uint(404)); // ERR_USER_NOT_FOUND
    });
  });

  describe("Platform Fee Management", () => {
    it("should allow owner to set platform fee", () => {
      const newFee = 250; // 2.5%
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(newFee)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Check fee was updated
      const { result: fee } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-platform-fee",
        [],
        deployer
      );
      expect(fee).toBeUint(newFee);
    });

    it("should not allow non-owner to set platform fee", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(200)],
        wallet1 // Non-owner
      );
      expect(result).toBeErr(Cl.uint(401)); // ERR_NOT_AUTHORIZED
    });

    it("should not allow fee greater than 10%", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(1500)], // 15% - exceeds max
        deployer
      );
      expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_INPUT
    });

    it("should allow maximum fee of 10%", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(1000)], // 10% - maximum allowed
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete user lifecycle", () => {
      // 1. Create user profile
      const username = "lifecycle_user";
      const createResult = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-profile",
        [Cl.stringAscii(username)],
        wallet1
      );
      expect(createResult.result).toBeOk(Cl.bool(true));

      // 2. Add achievement (increases reputation)
      const achievementResult = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-achievement",
        [
          Cl.principal(wallet1),
          Cl.uint(1),
          Cl.stringAscii("Lifecycle Test"),
          Cl.stringAscii("Test achievement for lifecycle"),
          Cl.uint(100)
        ],
        deployer
      );
      expect(achievementResult.result).toBeOk(Cl.bool(true));

      // 3. Verify user
      const verifyResult = simnet.callPublicFn(
        CONTRACT_NAME,
        "verify-user",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(verifyResult.result).toBeOk(Cl.bool(true));

      // 4. Check final state
      const { result: finalProfile } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-profile",
        [Cl.principal(wallet1)],
        deployer
      );
      
      expect(finalProfile).toBeSome(
        Cl.tuple({
          username: Cl.stringAscii(username),
          reputation: Cl.uint(100),
          "total-contributions": Cl.uint(0),
          "join-date": Cl.uint(simnet.blockHeight - 3),
          "is-verified": Cl.bool(true)
        })
      );

      // Check total users
      const { result: totalUsers } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-users",
        [],
        deployer
      );
      expect(totalUsers).toBeUint(1);
    });

    it("should handle multiple users", () => {
      // Create multiple users
      const users = [
        { wallet: wallet1, username: "user1" },
        { wallet: wallet2, username: "user2" },
        { wallet: wallet3, username: "user3" }
      ];

      users.forEach(({ wallet, username }) => {
        const result = simnet.callPublicFn(
          CONTRACT_NAME,
          "create-profile",
          [Cl.stringAscii(username)],
          wallet
        );
        expect(result.result).toBeOk(Cl.bool(true));
      });

      // Check total users
      const { result: totalUsers } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-users",
        [],
        deployer
      );
      expect(totalUsers).toBeUint(3);

      // Verify all users exist
      users.forEach(({ wallet }) => {
        const { result: exists } = simnet.callReadOnlyFn(
          CONTRACT_NAME,
          "user-exists",
          [Cl.principal(wallet)],
          deployer
        );
        expect(exists).toBeBool(true);
      });
    });
  });
});
