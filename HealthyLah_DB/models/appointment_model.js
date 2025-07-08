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

//Get All Appointments by UserId
async function getAppointmentsByUserID(userID) {
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT 
                appointmentID,
                userID,
                doctorName,
                clinicName,
                appointmentDate,
                CAST(appointmentTime AS VARCHAR(5)) AS appointmentTime,
                purpose,
                reminderDate
            FROM Appointments
            WHERE userID = @userID
            ORDER BY appointmentDate, appointmentTime;
        `;
        const request = connection.request();
        request.input("userID", sql.Int, userID);
        const result = await request.query(query);

        if(result.recordset.length === 0){
            return null;
        }

        //Format time and date form properly
        return result.recordset.map(row => ({
            ...row,
            appointmentTime: row.appointmentTime,
            appointmentDate: row.appointmentDate?.toISOString().split('T')[0],
            reminderDate: row.reminderDate?.toISOString().split('T')[0]
        }));

    }
    catch(error){
        console.error("Database error:", error);
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

//Add Appointment
async function createAppointment(appointment){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = 
        `INSERT INTO Appointments 
        (userID, doctorName, clinicName, appointmentDate, appointmentTime, purpose, reminderDate)
        VALUES (@userID, @doctorName, @clinicName, @appointmentDate, @appointmentTime, @purpose, @reminderDate);
        `;
        
        // Default reminder date = one day before the appointment date        
        const reminderDate = appointment.reminderDate
        ? appointment.reminderDate: new Date(new Date(appointment.appointmentDate).getTime() - 24 * 60 * 60 * 1000);

        const request = connection.request();
        request.input("userID", sql.Int, appointment.userID);
        request.input("doctorName", sql.VarChar, appointment.doctorName);
        request.input("clinicName", sql.VarChar, appointment.clinicName);
        request.input("appointmentDate", sql.Date, appointment.appointmentDate);
        request.input("appointmentTime", sql.VarChar, appointment.appointmentTime);
        request.input("purpose", sql.VarChar, appointment.purpose);
        request.input("reminderDate", sql.Date, reminderDate);

        await request.query(query);
        return{message: "Appointment created successfully"};

    }
    catch(error){
        console.error("Database error:", error);
        throw error;
    }
    finally{
        if(connection){
            try{
                await connection.close();
            }
            catch(error){
                console.error("Error closing connection:", err);
            }
        }
    }
}

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
    getAppointmentsByUserID,
    createAppointment,
};