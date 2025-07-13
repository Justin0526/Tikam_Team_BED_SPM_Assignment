const appointmentModel = require("../models/appointment_model");

//Get All Appointments
async function getAllAppointments(req, res){
    console.log("Controller: getAllAppointments() was called");
    try{
        const appointments = await appointmentModel.getAllAppointments();
        res.json(appointments);
    }
    catch(error){
        console.error("Controller error:", error);
        res.status(500).json({error: "Error retrieving appointments"});
    }
}

//Get Appointments by UserID
async function getAppointmentsByUserID(req, res){
    const userID = req.user.userID;
    try{
        const appointment = await appointmentModel.getAppointmentsByUserID(userID);

        if(!appointment || appointment.length === 0){
            return res.status(404).json({error: "No appointments found for this user"});
        }
        res.json(appointment);
    }
    catch(error){
        console.error("Controller error:", error);
        res.status(500).json({error: "Error retrieving appointments"});
    }
}

//Create appointment
async function createAppointment(req, res){
    //Log the incoming request body
    console.log("Incoming appointment:");
    try{
        const appointment = {
            ... req.body,
            userID: req.user.userID
        }
        const newAppointment = await appointmentModel.createAppointment(appointment);

        //Optional: validate required fields ( not implemented here yet)
        
        res.status(201).json({message: "Appointment created successfully"});
    }
    catch(error){
        console.error("Controller error:", error);
        res.status(500).json({error: "Failed to add appointment"});
    }
}

// Update appointment by appointmentID
async function updateAppointmentByAppointmentID(req, res){
  try {
    const appointmentID = parseInt(req.params.appointmentID);
    const userID = req.user.userID; //Extract from decoded JWT

    const success = await appointmentModel.updateAppointmentByAppointmentID(appointmentID, userID, req.body);
    if (!success) {
      return res.status(404).json({error: "Appointment not found"});

    }
    const updatedAppointment = await appointmentModel.getAppointmentsByUserID(userID);
    res.json({
      message: `Appointment with ID ${appointmentID} updated successfully`,
      appointment: updatedAppointment,
    });
  }catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error updating appointment" });
  }
};

module.exports = {
    getAllAppointments,
    getAppointmentsByUserID,
    createAppointment,
    updateAppointmentByAppointmentID,
};