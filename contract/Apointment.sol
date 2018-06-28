pragma solidity ^0.4.22;

//Apointment smart contract

contract Apointment {

    event Booked(address patient, uint dentist, uint[] timeSlots);
    event Canceled(address patient, uint dentist, uint[] timeSlots);

    struct Dentist {
        bytes32 name;
        mapping(uint => address) patientPerSlots;
    }

    Dentist[] public dentists;

    // Dont go to the neighbor :)
    modifier beLoyal(uint dentist, uint[] timeSlots) {
        bool loyalty = false;

        for (uint i = 0; i < dentists.length && !loyalty; i++) {
            if (i != dentist) {
                for (uint j = 0; j < timeSlots.length && !loyalty; j++) {				
		    loyalty = isTimeBookedBySender(i, timeSlots[j]);
                }
            }
        }
        
        require(!loyalty); // Not coool!
        _;
    }

    modifier timesAvailable(uint dentist, uint[] timeSlots) {
        bool available = true;
        
        for (uint i = 0; i < timeSlots.length && available; i++) {
	    available = isTimeAvailable(dentist, timeSlots[i]);
        }
        
        require(available); // Sorry, time not available
        _;
    }

    modifier canCancel(uint dentist, uint[] timeSlots) {
	    bool bookedBySender = true;
        
        for (uint i = 0; i < timeSlots.length && bookedBySender; i++) {
	    bookedBySender = isTimeBookedBySender(dentist, timeSlots[i]);
        }
        
        require(bookedBySender); // You're trying to cancel apointment that is not yours!
        _;
    }

    function getTimeSlotBookerAddress(uint dentist, uint timeSlot) private view returns (address) {
        return dentists[dentist].patientPerSlots[timeSlot];
    }

    function isTimeAvailable(uint dentist, uint timeSlot) public view returns (bool) {
        return getTimeSlotBookerAddress(dentist, timeSlot) == address(0x0);
    }

    function isTimeBookedBySender(uint dentist, uint timeSlot) public view returns (bool) {
        return getTimeSlotBookerAddress(dentist, timeSlot) == msg.sender;
    }

    function cancel(uint dentist, uint[] timeSlots) public canCancel(dentist, timeSlots) {
        for (uint i = 0; i < timeSlots.length; i++) {
            dentists[dentist].patientPerSlots[timeSlots[i]] = address(0x0);
        }

        Canceled(msg.sender, dentist, timeSlots);
    }

    function book(uint dentist, uint[] timeSlots) public timesAvailable(dentist, timeSlots) beLoyal(dentist, timeSlots) {
        for (uint i = 0; i < timeSlots.length; i++) {
            dentists[dentist].patientPerSlots[timeSlots[i]] = msg.sender;
        }

        Booked(msg.sender, dentist, timeSlots);
    }

    // Contract constructor
    function Apointment(bytes32[] names) public {
        for (uint i = 0; i < names.length; i++) {
            dentists.push(dentist({ name: names[i] }));
        }      
    }
}