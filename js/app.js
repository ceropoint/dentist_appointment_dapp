if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

const dentists = ['DoctorPetrov','DoctorKaludova'];
let accountIdx = 0;
let accounts;

web3.eth.getAccounts()
    .then(function(result) {
        accounts = result;
    });

// Every modification requires redeployment
const abi = [
    {
        "constant":true,
        "inputs":[
            {
                "name":"dentist",
                "type":"uint256"
            },
            {
                "name":"timeSlot",
                "type":"uint256"
            }
        ],
        "name":"isTimeAvailable",
        "outputs":[
            {
                "name":"",
                "type":"bool"
            }
        ],
        "payable":false,
        "stateMutability":"view",
        "type":"function"
    },
    {
        "constant":false,
        "inputs":[
            {
                "name":"dentist",
                "type":"uint256"
            },
            {
                "name":"timeSlots",
                "type":"uint256[]"
            }
        ],
        "name":"cancel",
        "outputs":[],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"function"
    },
    {
        "constant":true,
        "inputs":[
            {
                "name":"dentist",
                "type":"uint256"
            },
            {
                "name":"timeSlot",
                "type":"uint256"
            }
        ],
        "name":"isTimeBookedBySender",
        "outputs":[
            {
                "name":"",
                "type":"bool"
            }
        ],
        "payable":false,
        "stateMutability":"view",
        "type":"function"
    },
    {
        "constant":true,
        "inputs":[
            {
                "name":"",
                "type":"uint256"
            }
        ],
        "name":"dentists",
        "outputs":[
            {
                "name":"name",
                "type":"bytes32"
            }
        ],
        "payable":false,
        "stateMutability":"view",
        "type":"function"
    },
    {
        "constant":false,
        "inputs":[
            {
                "name":"dentist",
                "type":"uint256"
            },
            {
                "name":"timeSlots",
                "type":"uint256[]"
            }
        ],
        "name":"book",
        "outputs":[],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"function"
    },
    {
        "inputs":[
            {
                "name":"names",
                "type":"bytes32[]"
            }
        ],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"constructor"
    },
    {
        "anonymous":false,
        "inputs":[
            {
                "indexed":false,
                "name":"patient",
                "type":"address"
            },
            {
                "indexed":false,
                "name":"dentist",
                "type":"uint256"
            },
            {
                "indexed":false,
                "name":"timeSlots",
                "type":"uint256[]"
            }
        ],
        "name":"Booked",
        "type":"event"
    },
    {
        "anonymous":false,
        "inputs":[
            {
                "indexed":false,
                "name":"patient",
                "type":"address"
            },
            {
                "indexed":false,
                "name":"dentist",
                "type":"uint256"
            },
            {
                "indexed":false,
                "name":"timeSlots",
                "type":"uint256[]"
            }
        ],
        "name":"Canceled",
        "type":"event"
    }
];

// CONTRACT ADDRESS HERE
const contract = new web3.eth.Contract(abi, 'CONTRACT-ADDRESS');

// Events listeners was added for example purpose only but they don't work with Web3.providers.HttpProvider
// With web3 1.0.0 it's required a Web Socket provider to listen events
contract.events.Booked(
    function(error, event){ 
        console.log('error',error); 
        console.log('event',event); 
    })
    .on('data', function(event){
        console.log(event); // same results as the optional callback above
    })
    .on('changed', function(event){
        // remove event from local database
    })
    .on('error', console.error);

contract.events.Canceled(
    function(error, event){ 
        console.log('error',error); 
        console.log('event',event); 
    })
    .on('data', function(event){
        console.log(event);
    })
    .on('changed', function(event){
        // remove event from local database
    })
    .on('error', console.error);

function setTimeSlots() {
    for (let i = 0; i < meetingRooms.length; i++) {
        for (let j = 0; j < 8; j++) {
            let $time = $(`[data-cabinet="${i}"]`).find(`li[data-time="${j}"]`);
        
            contract.methods.isTimeAvailable(i, j)
                .call()
                .then(function(result) {
                    if (!result) {
                        contract.methods.isTimeBookedBySender(i, j)
                            .call({from: accounts[accountIdx]})
                            .then(function(result) {
                                let removeClass = result ? 'danger' : 'warning';
                                let addClass = result ? 'warning' : 'danger';
                                $time.removeClass(`list-group-item-${removeClass}`).addClass(`list-group-item-${addClass}`);
                            });
                    }
                    else {
                        $time.removeClass('list-group-item-warning list-group-item-danger');
                    }
                });
        }
    }
}

function cancel(dentist, selectedTimeSlots) {
    contract.methods.cancel(dentist, selectedTimeSlots)
       .send({from: accounts[accountIdx]})
       .then(function(result) {
           console.log('CANCEL', result);
            
           $(`.alert[data-dentist="${dentist}"]`).removeClass('alert-danger').addClass('alert-success').text('Cancelation was successful');
            
           setTimeSlots();
       })
       .catch(function(error) {
           console.log(error.message);
            
           $(`.alert[data-dentist="${dentist}"]`).removeClass('alert-success').addClass('alert-danger').text('There was a problem with your cancel request');        
       });
}

function book(dentist, selectedTimeSlots) {
    contract.methods.book(dentist, selectedTimeSlots)
        .send({from: accounts[accountIdx]})
        .then(function(result) {
            console.log('BOOK', result);
            
            $(`.alert[data-dentist="${dentist}"]`).removeClass('alert-danger').addClass('alert-success').text('Booking was successful');
            
            setTimeSlots();
        })
        .catch(function(error) {
            console.log(error.message);
            
            $(`.alert[data-dentist="${dentist}"]`).removeClass('alert-success').addClass('alert-danger').text('There was a problem with your booking request');        
        });
}

function unlockBtn(dentist) {
    const $startTime = $(`.start-time[data-dentist="${dentist}"]`);
    const startTimeValue = $startTime.val();
    const $endTime = $(`.end-time[data-dentist="${dentist}"]`);
    const endTimeValue = $endTime.val();
    const $btnBook = $(`.btn[data-dentist="${dentist}"]`);
    
    if (startTimeValue !== '' && endTimeValue !== '' && startTimeValue < endTimeValue) {
        $btnBook.prop('disabled', false);
    }
    else {
        $btnBook.prop('disabled', true);
    }
}

function getTimeSlots(dentist) {
    const $startTime = $(`.start-time[data-dentist="${dentist}"]`);
    const startTimeValue = parseInt($startTime.val());
    const $endTime = $(`.end-time[data-dentist="${dentist}"]`);
    const endTimeValue = parseInt($endTime.val());
    
    let timeSlots = [];
    
    for (let i = startTimeValue; i < endTimeValue; i++) {
        timeSlots.push(i);
    }
    
    return timeSlots;
}

function setAccountIndex(idx) {
    accountIdx = idx;
}

$(document).ready(function() {
    setTimeSlots();
    
    $(document).on('click', '.eth-account', function(e) {
        e.preventDefault();
        const $this = $(this);
        
        $('#accountsSwitcher').text($this.text());
        setAccountIndex($this.data('account'));
        setTimeSlots();
    });
    
    $(document).on('change', '.start-time', function() {
        const $this = $(this);
        const dentist = $this.data('dentist');
        const startTimeValue = $this.val();
        const $endSelect = $(`.end-time[data-dentist="${dentist}"]`);
        
        if (startTimeValue !== '') {
            
            $endSelect.prop('disabled', false);
            
            const endValue = $endSelect.val();
            if (endValue <= startTimeValue) {
                $endSelect.val('');
            }
                        
            $endSelect.find('option').each(function() {
                if (this.value > startTimeValue || this.value == '') {
                    $(this).prop('disabled', false);
                }
                else {
                    $(this).prop('disabled', true);
                }
            });
        }
        else {
            $endSelect.val('').prop('disabled', true);
        }
        
        unlockBtn(dentist);
    });
    
    $(document).on('change', '.end-time', function() { 
        const $this = $(this);
        const dentist = $this.data('dentist');
        
        unlockBtn(dentist);
    });
    
    $(document).on('click', '.btn[data-action="book"]', function() { 
        const $this = $(this);
        const dentist = $this.data('dentist');
        const timeSlots = getTimeSlots(dentist);
        
        book(dentist, timeSlots);
    });
    
    $(document).on('click', '.btn[data-action="free"]', function() { 
        const $this = $(this);
        const dentist = $this.data('dentist');
        const timeSlots = getTimeSlots(dentist);
        
        cancel(dentist, timeSlots);
    });
});