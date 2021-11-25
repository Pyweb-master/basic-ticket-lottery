App = {
  web3Provider: null,
  contracts: {},
  LotteryArtifact: {},
  init: function() {
    return App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccounts(accounts);
      } catch (error) {
        console.error("User denied account access")
      }
    }else if (window.web3) {
      console.log("web3 is not undefined. so set as current provider")
      App.web3Provider = web3.currentProvider;
    } else {
      console.log("web3 is undefined. so set as local or infura")
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      // App.web3Provider = new Web3.providers.HttpProvider('https://mainnet.infura.io/GjyHpPqLZffsizIx6ieH');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Lottery.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      App.LotteryArtifact = data;
      App.contracts.Lottery = TruffleContract(data);

      // Set the provider for our contract.
      App.contracts.Lottery.setProvider(App.web3Provider);
      return App.getTicketPrice(), App.getTicketMapping(), App.getLotteryAddress(), App.filterEvents();
    });
    return App.bindEvents();
  },

  bindEvents: function() {
    $(".buyTicket").on("click", App.handleBuyTicket)
  },

  filterEvents: async function filterEvents () {
    // shows how to listen to  events emitted from contract
    const networkId = await web3.eth.net.getId()
    contract = new web3.eth.Contract(App.LotteryArtifact.abi, App.LotteryArtifact.networks[networkId].address);
    contract.events.LotteryTicketPurchased({ filter: { } }, async (err, event) => {
      if (err) console.error('Error on event', err)
      t_id = event.returnValues._ticketID;
      $("#buyTicket" + t_id).prop('disabled', true);
      console.log('LotteryTicketPurchased ', event.returnValues._ticketID, event.returnValues._purchaser);
    })
    contract.events.LotteryAmountPaid({ filter: { } }, async (err, event) => {
      if (err) console.error('Error on event', err)
      $('#h_winner').text(event.returnValues._winner);
      console.log('Winner selected ', event.returnValues._winner, event.returnValues._ticketID, event.returnValues._amount);
    })
  },

  handleBuyTicket:async function send() {
      var ind = $(this).attr('id').split("buyTicket")[1];
      const lottery = await App.contracts.Lottery.deployed();
      const ticketPrice = parseInt(await lottery.ticketPrice());
      console.log("get ticket price :" , ticketPrice);
      web3.eth.getAccounts(async function(error, accounts) {
        if (error) {
          console.log(error);
        }
        var account = accounts[0];
        let result = await lottery.buyTicket(ind, {from: account, value: ticketPrice, gas: 700000});
        // result shows how to catch events emitted from the called contract function
        console.log(" result : ", result.logs[0]);
      });
  },

  

  getTicketPrice: function(){
    console.log('Getting ticket price...');
    App.contracts.Lottery.deployed().then(function(instance) {
        lottery = instance;
        return lottery.ticketPrice();
    }).then(function(result){
      EthPrice = Math.round(1000 * result / 1000000000000000000) / 1000; // Result is returned in wei (10^18 per 1 ETH)
      $('#ticketPrice').text(EthPrice.toString(10));
      }).catch(function(err) {
        console.log("get ticket price error : " , err.message);
      });
  },

  getLotteryAddress: function(){
    console.log('Getting lottery address...');
    App.contracts.Lottery.deployed().then(function(instance) {
        lottery = instance;
        return lottery.address;
    }).then(function(result){
      $('#h_addr').text(result);
      }).catch(function(err) {
          console.log(err.message);
        });
  },

  getTicketMapping: function(){
    console.log('Getting ticket mapping...');
    App.contracts.Lottery.deployed().then(function(instance) {
        lottery = instance;
        return lottery.getTicketsPurchased();
    }).then(function(result){
      for(var i=0; i<result.length;i++){
        if(result[i] == "0x0000000000000000000000000000000000000000"){
          result[i]=0;
        } else {
          result[i]=1;
          $("#buyTicket" + String(i+1)).prop('disabled', true);
        }
      }
      }).catch(function(err) {
          console.log(err.message);
        });
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
