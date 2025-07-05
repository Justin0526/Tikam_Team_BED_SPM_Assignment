const appointmentModel = require("../models/appointment_model");

//Get All Appointments
async function getAllAppointments(req, res){
    try{
        const appointments = await appointmentModel.getAllAppointments();
        res.json(appointments);
    }
    catch(error){
        console.error("Controller error:", error);
        res.status(500).json({error: "Error retrieving appointments"});
    }
}

// async function getAppointmentsByUserId(req, res){
//     try{
//         const userId = parseInt(req.params.id);
//         const appointment = await appointmentModel.getAppointmentsByUserId(userId);

//         if(!appointment || appointment.length === 0){
//             return res.status(404).json({error: "No appointments found for this user"});

//         }
//         res.json(appointment);
//     }
//     catch(error){
//         console.error("Controller error:", error);
//         res.status(500).json({error: "Error retrieving user"});
//     }
// }

// //create appointment
// async function createAppointment(req, res){
//     try{
//         const newAppointment = await appointmentModel.createAppointment(req.body);

//         //Optional: validate required fields ( not implemented here yet)
        
//         res.status(201).json({message: "Appointment created successfully"});
//     }
//     catch(error){
//         console.error("Controller error:", error);
//         res.status(500).json({error: "Failed to add appointment"});
//     }
// }

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
};