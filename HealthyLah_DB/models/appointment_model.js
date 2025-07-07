const sql = require("mssql");
const dbConfig = require("../dbConfig");

//Get All Appointments
async function getAllAppointments(){
    console.log("getAllAppointments() was called");
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        console.log("DB conntected");
        const query = "SELECT * FROM Appointments ORDER BY appointmentDate, appointmentTime";
        const result = await connection.request().query(query);
        return result.recordset;
    }
    catch(error){
        console.error("Database error", error);
        throw error;
    }
    finally{
        if(connection){
            try{
                await connection.close();
            }
            catch(error){
                console.error("Error closing connection:", error);
            }
        }
    }
}

// //Get All Appointments by UserId
// async function getAppointmentsByUserId(userId) {
//     let connection;
//     try{
//         connection = await sql.connect(dbConfig);
//         const query = "SELECT * FROM Appointments WHERE user_id = @userId ORDER BY appointment_date, appointment_time";
//         const request = connection.request();
//         request.input("userId", sql.Int, userId);
//         const result = await request.query(query);

//         if(result.recordset.length === 0){
//             return null;
//         }

//         return result.recordset;
//     }
//     catch(error){
//         console.error("Database error:", error);
//         throw error;
//     }
//     finally{
//         if(connection){
//             try{
//                 await connection.close();
//             }
//             catch(error){
//                 console.error("Error closing connection:", error);
//             }
//         }
//     }
// }

// //Add Appointment
// async function createAppointment(appointment){
//     let connection;
//     try{
//         connection = await sql.connect(dbConfig);
//         const query = 
//         `INSERT INTO Appointments 
//         (user_id, doctor_name, clinic_name, appointment_date, appointment_time, purpose, reminder_date, created_at)
//         VALUES (@user_id, @doctor_name, @clinic_name, @appointment_date, @appointment_time, @purpose, @reminder_date, @created_at)
//         `;
        
//         // Default reminder date = one day before the appointment date        
//         const reminderDate = appointment.reminder_date
//         ? appointment.reminder_date: new Date(new Date(appointment.appointment_date).getTime() - 24 * 60 * 60 * 1000);

//         //Convert "14:00" string to Date for sql.Time
//         const timeParts = appointment.appointment_time.split(":");
//         const appointmentTime = new Date();
//         appointmentTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
        
//         const request = connection.request();
//         request.input("user_id", sql.Int, appointment.user_id);
//         request.input("doctor_name", sql.VarChar, appointment.doctor_name);
//         request.input("clinic_name", sql.VarChar, appointment.clinic_name);
//         request.input("appointment_date", sql.Date, appointment.appointment_date);
//         request.input("appointment_time", sql.Time, appointmentTime);
//         request.input("purpose", sql.VarChar, appointment.purpose);
//         request.input("reminder_date", sql.Date, reminderDate);
//         request.input("created_at", sql.DateTime, new Date());

//        await request.query(query);

//         return{message: "Appointment created successfully"};

//     }
//     catch(error){
//         console.error("Database error:", error);
//         throw error;
//     }
//     finally{
//         if(connection){
//             try{
//                 await connection.close();
//             }
//             catch(error){
//                 console.error("Error closing connection:", err);
//             }
//         }
//     }
// }

// //Delete Appointment
// async function deleteAppointment(appointmentId) {
//     let connection;
//     try{
//         connection = await sql.connect(dbConfig);
//         const query = `
//             DELETE FROM Appointments WHERE appointment_id = @appointmentId;
//         `;
//         const request = connection.request();
//         request.input("appointmentId", sql.Int, appointmentId);
//         const result = await request.query(query);
       
//         if(result.rowsAffected[0] === 0){
//             return false;
//         }
//         return true;
//     }
//     catch(error){
//         console.error("Database error:", error);
//         throw error;
//     }
//     finally{
//         if(connection){
//             try{
//                 await connection.close();
//             }
//             catch(error){
//                 console.error("Error closing connection:",error);
//             }
//         }
//     }
    
// }

module.exports = {
    getAllAppointments,
};