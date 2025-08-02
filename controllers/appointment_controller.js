//Name - Shein Wai Oo
//ID - 10269743C
const appointmentModel = require("../models/appointment_model");

//Get Appointments by UserID
async function getAppointmentsByUserID(req, res){
    const userID = req.user.userID;
    try{
        const appointment = await appointmentModel.getAppointmentsByUserID(userID);
          if(!appointment || appointment.length === 0){
            return res.status(200).json({appointments: []});
        }
        res.status(200).json(appointment);
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

//delete appointment
async function deleteAppointment(req, res) {
    try{
        const appointmentID = parseInt(req.params.appointmentID);
        const deleted = await appointmentModel.deleteAppointment(appointmentID);

        if(!deleted){
            return res.status(404).json({error: "Appointment not found or already deleted"});
        }

        res.json({message: "Appointment deleted successfully"});
    }
    catch(error){
        console.error("Controller error:", error);
        res.status(500).json({error: "Error deleting Appointment"});
    } 
}

//Search Appointments
async function searchAppointments(req, res) {
    //Notice this part
    const searchTerm = req.query.searchTerm || "";
    const userID = req.user.userID; //Extract from decoded JWT
    const appointmentDate = req.query.appointmentDate || null; //Optional date filter
    try{
        const appointments = await appointmentModel.searchAppointments(searchTerm, userID, appointmentDate);
        //If no appointments found, return an empty array with a message
        if(appointments.length === 0){
            return res.status(200).json({message: "No matching appointments", data: []});
        }
        res.json(appointments);
    }
    catch(error){
        console.error("Controller error in searchAppointments:", error);
        res.status(500).json({message: "Error searching appointments"});
    }
}

module.exports = {
    getAppointmentsByUserID,
    createAppointment,
    updateAppointmentByAppointmentID,
    deleteAppointment,
    searchAppointments,
};