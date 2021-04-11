const { assert } = require("chai");
const Web3 = require("web3");

const web3 = new Web3();

const SafexMain = artifacts.require("./SafexMain.sol");
const AutoAppealableArbitrator = artifacts.require("./AutoAppealableArbitrator.sol");

require("chai").use(require("chai-as-promised")).should();

contract("SafexMain & AutoAppealableArbitrator", async (accounts) => {
  let safexMain, autoAppealableArbitrator, safexMainResult, autoAppealableArbitratorResult;

  before(async () => {
    safexMain = await SafexMain.deployed();
    autoAppealableArbitrator = await AutoAppealableArbitrator.deployed();
  });

  describe("Deployment", async () => {
    it("SafexMain has an address", async () => {
      const address = await safexMain.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("AutoAppealableArbitrator has an address", async () => {
      const address = await autoAppealableArbitrator.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
  });

  describe("Interactions", async () => {
    it("SafexMain allows users to create a plan", async () => {
      let planExists;
      planExists = await safexMain.planExists(1);
      assert.equal(planExists, false);

      let safexMainContractBalance;
      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 0); // 0 eth

      const arbitrationFee = await autoAppealableArbitrator.arbitrationCost(123); // 1000000000000000 (0.001 eth)

      // SUCCESS : create a plan
      safexMainResult = await safexMain.createPlan(
        accounts[9], // inheritor
        "https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/", // metaEvidence
        { from: accounts[0], value: arbitrationFee }
      );

      planExists = await safexMain.planExists(1);
      assert.equal(planExists, true);

      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 1000000000000000); // 0.001 eth

      const plan = await safexMain.plans(1);
      assert.equal(plan.planCreatedBy, accounts[0]);
      assert.equal(plan.planCurrentOwner, accounts[0]);
      assert.equal(plan.planInheritor, accounts[9]);
      assert.equal(plan.metaEvidenceId.toNumber(), 1);
      assert.equal(plan.claimsCount.toNumber(), 0);
      assert.equal(plan.planFunds.toNumber(), 1000000000000000); // 0.001 eth

      // FAILURE : paying inadequate or no fee(arbitration fee) for plan creation
      safexMainResult = await safexMain.createPlan(
        accounts[9],
        "https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/",
        { from: accounts[0], value: arbitrationFee - 100000000000000 }
      ).should.be.rejected;

      // FAILURE : plan creator has already created a plan
      await safexMain.createPlan(
        accounts[8],
        "https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/",
        {
          from: accounts[0],
        }
      ).should.be.rejected;

      // FAILURE : metaEvidence is not passed
      await safexMain.createPlan(accounts[8], "", { from: accounts[1] }).should.be.rejected;

      // FAILURE : inheritor is an zero address
      await safexMain.createPlan(
        "0x0000000000000000000000000000000000000000",
        "https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/",
        { from: accounts[1] }
      ).should.be.rejected;

      // FAILURE : plan creator and inheritor are same
      await safexMain.createPlan(
        accounts[1],
        "https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/",
        {
          from: accounts[1],
        }
      ).should.be.rejected;
    });

    it("SafexMain allows inheritors to create a claim", async () => {
      let safexMainContractBalance;
      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 1000000000000000); // 0.001 eth

      let plan;
      plan = await safexMain.plans(1);
      assert.equal(plan.planFunds.toNumber(), 1000000000000000); // 0.001 eth

      // FAILURE : only inheritor of the plan can create the claim
      await safexMain.createClaim(
        1,
        "https://bafybeicqyzscj4g43dyauiyubvi3cvqbfax2bhrvbdnw6obhmzxyhzfiky.ipfs.infura-ipfs.io/",
        { from: accounts[8] }
      ).should.be.rejected;

      // SUCCESS : create a claim
      safexMainResult = await safexMain.createClaim(
        1, // planId
        "https://bafybeicqyzscj4g43dyauiyubvi3cvqbfax2bhrvbdnw6obhmzxyhzfiky.ipfs.infura-ipfs.io/", // evidence
        { from: accounts[9] }
      );

      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 0); // 0 eth

      plan = await safexMain.plans(1);
      assert.equal(plan.planFunds.toNumber(), 0); // 0 eth
      assert.equal(plan.claimsCount.toNumber(), 1);

      const claim = await safexMain.claims(0);
      assert.equal(claim.claimedBy, accounts[9]);
      assert.equal(claim.disputeId.toNumber(), 0);
      assert.equal(claim.metaEvidenceId.toNumber(), 1);
      assert.equal(claim.evidenceGroupId.toNumber(), 1);
      assert.equal(claim.status.toNumber(), 0); // Active
      assert.equal(claim.result, "");

      // FAILURE : plan does not exist
      await safexMain.createClaim(
        4,
        "https://bafybeicqyzscj4g43dyauiyubvi3cvqbfax2bhrvbdnw6obhmzxyhzfiky.ipfs.infura-ipfs.io/",
        { from: accounts[9] }
      ).should.be.rejected;

      // FAILURE : total number of claims on a plan has reached the limit
      await safexMain.createClaim(
        1,
        "https://bafybeicqyzscj4g43dyauiyubvi3cvqbfax2bhrvbdnw6obhmzxyhzfiky.ipfs.infura-ipfs.io/",
        { from: accounts[9] }
      ).should.be.rejected;

      // FAILURE : the arbitration fee paid by the plan creator has already been utilised
      await safexMain.createClaim(
        1,
        "https://bafybeicqyzscj4g43dyauiyubvi3cvqbfax2bhrvbdnw6obhmzxyhzfiky.ipfs.infura-ipfs.io/",
        { from: accounts[9] }
      ).should.be.rejected;
    });

    it("SafexMain allows arbitrator to give ruling on a claim", async () => {
      // FAILURE : Invalid ruling (only 2 options are available, but giving 3rd option as a ruling is invalid) - as per autoAppealableArbitrator
      await autoAppealableArbitrator.giveRuling(0, 3, { from: accounts[0] }).should.be.rejected;

      // FAILURE : Can only be called by the owner - as per autoAppealableArbitrator
      await autoAppealableArbitrator.giveRuling(0, 2, { from: accounts[5] }).should.be.rejected;

      // SUCCESS : give a ruling
      autoAppealableArbitratorResult = await autoAppealableArbitrator.giveRuling(0, 2, { from: accounts[0] });

      const claim = await safexMain.claims(0);
      assert.equal(claim.status.toNumber(), 2); // Failed
      assert.equal(claim.result, "Do not initiate reconstruction"); // Do not initiate reconstruction
    });

    it("SafexMain allows users to deposit funds in a plan", async () => {
      let safexMainContractBalance;
      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 0); // 0 eth

      // SUCCESS : deposit funds in a plan
      safexMainResult = await safexMain.depositPlanFunds(1, { from: accounts[4], value: 2000000000000000000 }); // 2 eth

      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 2000000000000000000); // 0.001 eth

      // FAILURE : plan does not exist
      await safexMain.depositPlanFunds(4, { from: accounts[4], value: 1000000000000000000 }).should.be.rejected; // 1 eth
    });

    it("SafexMain allows plan owner to recover funds in the plan", async () => {
      let safexMainContractBalance;
      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 2000000000000000000); // 2 eth

      // FAILURE : plan does not exist
      await safexMain.recoverPlanFunds(4, { from: accounts[0] }).should.be.rejected;

      // FAILURE : only plan owner can recover the funds
      await safexMain.recoverPlanFunds(1, { from: accounts[3] }).should.be.rejected;

      // SUCCESS : recover funds from a plan
      safexMainResult = await safexMain.recoverPlanFunds(1, { from: accounts[0] });

      safexMainContractBalance = await safexMain.getSafexMainContractBalance();
      assert.equal(Number(safexMainContractBalance), 0); // 0 eth

      // FAILURE : no funds remaining in the plan
      await safexMain.recoverPlanFunds(1, { from: accounts[0] }).should.be.rejected;
    });

    it("SafexMain allows it's admin to set the total number of claims allowed on a plan", async () => {
      let totalClaimsAllowed;
      totalClaimsAllowed = await safexMain.getTotalClaimsAllowed({ from: accounts[2] });
      assert.equal(totalClaimsAllowed.toNumber(), 2);

      // FAILURE : only SafexMain contract's admin can execute this
      await safexMain.setTotalClaimsAllowed(4, { from: accounts[2] }).should.be.rejected;

      // SUCCESS : set total number of claims allowed on a plan
      safexMainResult = await safexMain.setTotalClaimsAllowed(3, { from: accounts[0] });

      totalClaimsAllowed = await safexMain.getTotalClaimsAllowed({ from: accounts[2] });
      assert.equal(totalClaimsAllowed.toNumber(), 3);
    });
  });
});
