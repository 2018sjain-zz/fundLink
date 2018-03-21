pragma solidity ^0.4.2;

contract Donation {

	struct Candidate {
		uint id;
		string name;
		string party;
		uint amount;
		// address addr;
	}

	mapping (address => bool) public voters;
	mapping(uint => Candidate) public candidates;
	uint public candidatesCount;

	event donatedEvent(
		uint indexed _candidateId
	);


	//Constuctor
	function Donation () public {
		addCandidate("Candidate 1", "Democrat");
		addCandidate("Candidate 2", "Republican");
	}

	function addCandidate (string _name, string _party) private {
		candidatesCount ++;
		candidates[candidatesCount] = Candidate(candidatesCount, _name, _party, 0);
	}
	
	function donate(uint _candidateId, uint _donationAmount) public payable {
		require (!voters[msg.sender]);
		require(_candidateId > 0 && _candidateId <= candidatesCount);
		voters[msg.sender] = true;
		candidates[_candidateId].amount += _donationAmount;
		donatedEvent(_candidateId);
	}
}
