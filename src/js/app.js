App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Donation.json", function(donation) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Donation = TruffleContract(donation);
      // Connect provider to interact with contract
      App.contracts.Donation.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  listenForEvents: function(){
    App.contracts.Donation.deployed().then(function(instance){
      instance.donatedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        App.render();
      });
    });
  },

  render: function() {
    var donationInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Donation.deployed().then(function(instance) {
      donationInstance = instance;
      return donationInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        donationInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var party = candidate[2];
          var donation = candidate[3];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + party + "</td><td>Ξ " + donation +"</td></tr>"
          candidatesResults.append(candidateTemplate);

          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }

      return donationInstance.voters(App.account);
    }).then(function (hasDonated) {
      if (hasDonated){
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castDonation: function(){
    var candidateId = $('#candidatesSelect').val();
    var donationAmountInput = $('#donationAmountInput').val();
    App.contracts.Donation.deployed().then(function(instance) {
      return instance.donate(candidateId, donationAmountInput, {from: App.account});
    }).then(function(result){
      $('#content').hide();
      $('#loader').show();
    }).catch(function(err){
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});