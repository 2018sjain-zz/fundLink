var Donation = artifacts.require("./Donation.sol");

contract("Donation", function(accounts){
	var donationInstance;

	it("initializes with two candidates", function(){
		return Donation.deployed().then(function(instance){
			return instance.candidatesCount();
		}).then(function(count) {
			assert.equal(count, 2);
		});
	});

	it("it initializes the candidates with the correct values", function(){
		return Donation.deployed().then(function(instance){
			donationInstance = instance;
			return donationInstance.candidates(1);
		}).then(function(candidate) {
			assert.equal(candidate[0], 1, "contains the correct id");
			assert.equal(candidate[1], "Candidate 1", "contains the correct name");
			assert.equal(candidate[2], "Democrat", "contains the party");
			assert.equal(candidate[3], 0, "contains the vote count");
			return donationInstance.candidates(2);
		}).then(function(candidate) {
			assert.equal(candidate[0], 2, "contains the correct id");
			assert.equal(candidate[1], "Candidate 2", "contains the correct name");
			assert.equal(candidate[2], "Republican", "contains the party");
			assert.equal(candidate[3], 0, "contains the vote count");
		});
	});

	it("allows a voter to cast a vote", function(){
		return Donation.deployed().then(function(instance){
			donationInstance = instance;
			candidateId = 1;
			return donationInstance.donate(candidateId, { from: accounts[0] });
		}).then(function (receipt) {
			assert.equal(receipt.logs.length, 1, "an event was triggered");
			assert.equal(receipt.logs[0].event, "donatedEvent", "the event type is correct");
			assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
			return donationInstance.voters(accounts[0]);
		}).then(function (voted) {
			assert(voted, "the voter was marked as voted");
			return donationInstance.candidates(candidateId);
		}).then(function (candidate) {
			var donationTotal = candidate[3];
			assert.equal(donationTotal, 1, "increments the candidate's donation total");
		})
	});

	it("throws an exception for invalid candidates", function() {
		return Donation.deployed().then(function(instance){
			donationInstance = instance;
			return donationInstance.donate(99, {from: accounts[1]})
		}).then(assert.fail).catch(function(error){
			assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
			return donationInstance.candidates(1);
		}).then(function(candidate1) {
			var donateAmount = candidate1[3];
			assert.equal(donateAmount, 1, "candidate 1 did not recieve any money");
			return donationInstance.candidates(2);
		}).then(function (candidate2) {
			var donateAmount = candidate2[3];
			assert.equal(donateAmount, 0, "candidate 2 ddi not recieve any money");
		});
	});

	it("throws an exception for double voting", function() {
		return Donation.deployed().then(function(instance) {
			donationInstance = instance;
			candidateId = 2;
			donationInstance.donate(candidateId, {from: accounts[1] });
			return donationInstance.candidates(candidateId);
		}).then(function(candidate){
			var donateAmount = candidate[3];
			assert.equal(donateAmount, 1, "accepts first vote");
			return donationInstance.donate(candidateId, {from: accounts[1]});
		}).then(assert.fail).catch(function (error) {
			assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
			return donationInstance.candidates(1);
		}).then(function(candidate1){
			var donateAmount = candidate1[3];
			assert.equal(donateAmount, 1, "candidate 1 did not recieve any votes");
			return donationInstance.candidates(2);
		}).then(function (candidate2) {
			var donateAmount = candidate2[3];
			assert.equal(donateAmount, 1, "candidate 2 did not recieve any votes");
		});
	});

});