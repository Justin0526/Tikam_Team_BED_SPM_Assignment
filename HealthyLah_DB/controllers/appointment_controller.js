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

//Get My Appointments for verifyJWT (authorization)
// async function getMyAppointments(req, res) {
//   const userID = req.user.id;
//   try{
//     const appointment = await appointmentModel.getMyAppointments(userID);
//     res.status(200).json(appointment);
//   }
//   catch(error){
//     console.error("Error fetching borrowed books:", error);
//     res.status(500).json({
//       message: "Failed to get borrowed books"
//     });
//   }
// }

async function getAppointmentsByUserID(req, res){
    const userID = parseInt(req.params.userID);//have to change this line if you want to put authorization
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

//create appointment
async function createAppointment(req, res){
    //Log the incoming request body
    console.log("Incoming appointment:");
    
    try{
        const newAppointment = await appointmentModel.createAppointment(req.body);

        //Optional: validate required fields ( not implemented here yet)
        
        res.status(201).json({message: "Appointment created successfully"});
    }
    catch(error){
        console.error("Controller error:", error);
        res.status(500).json({error: "Failed to add appointment"});
    }
}

// //delete appointment
// async function deleteAppointment(req, res) {
//     try{
//         const id = parseInt(req.params.appointmentId);
//         const deleted = await appointmentModel.deleteAppointment(id);

//         if(!deleted){
//             return res.status(404).json({error: "Appointment not found or already deleted"});
//         }

//         res.json({message: "Appointment deleted successfully"});
//     }
//     catch(error){
//         console.error("Controller error:", error);
//         res.status(500).json({error: "Error deleting Appointment"});
//     } 
// }

module.exports = {
    getAllAppointments,
    getAppointmentsByUserID,
    createAppointment,
};