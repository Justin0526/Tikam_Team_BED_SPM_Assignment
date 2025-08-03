# Tikam_Team_BED_SPM_Assignment
# 🏢 Healthy Lah — Web-Based Wellness App for Seniors

**Client:** Lions Befrienders Service Association (Singapore)

**Product Goal:**  
To provide a web-based application tailored to the needs of elderly users in Singapore. The app helps seniors confidently manage appointments, health, and social activities while supporting independence and active ageing.

**Problem Statement:**  
While seniors may turn to technology for support, most digital platforms are not designed with their physical, cognitive, or cultural needs in mind. As a result, these tools often create more barriers than solutions. Healthy Lah aims to bridge this gap by offering an intuitive, senior-friendly interface.

---

## 📃 Key Features

Each feature includes a user story to describe the functionality and purpose.

### 📍 Transport & Nearby Facilities  
**User Story:**  
_As a senior navigating the city, I want to find nearby facilities and transport stops, so that I can travel safely and access essential services._

- Browse nearby clinics, hawkers, bus stops  
- Filter by facility type  
- View name, hours, and location with Google Maps  
- Bookmark facilities or bus stops
- Search bookmarks  
- Create category to add bookmarks
- View Bus stops and Bus arrivals
- "Take me there" to the facility/bus stop desired

---

### 🌤️ Weather & Outfit Suggestions  
**User Story:**  
_As a user planning my day, I want to see weather updates and outfit suggestions, so that I can dress appropriately and avoid health risks._

- Live weather data (e.g. temperature, humidity, UV Index)
- Outfit suggestions with weather conditions
- Hourly and 3-day forecast  
- Favourite an outfit for reference in the future

---

### 📉 Health Monitoring (Vitals & BMI)  
**User Story:**  
_As a user managing chronic conditions, I want to record and view trends in my vital signs and BMI, so that I can share accurate data with my doctor and also maintain a healthier lifestyle.

- Log blood pressure, sugar level, and weight  
- Interactive charts for viewing trends  
- BMI calculator with age-sensitive interpretation  
- Stores BMI history with feedback  
- Edit/delete logs  

---

### 📆 Health Reminders  
**User Story:**  
_As a senior, I want to set reminders for health tasks like drinking water or taking medication, so that I stay on track with my wellness routines._

- Add custom health tasks  
- View active and upcoming reminders  
- Sync to calendar  
- Edit/delete reminders  

---

### 📅 Appointment Management  
**User Story:**  
_As a senior user, I want to add and view my health appointments, so that I don’t forget important medical visits._

- Add doctor name, clinic, date/time, and purpose  
- Reminder automatically set to 1 day before and can be customised as well 
- Alert shown on every page on the website if it’s reminder day  
- Search appointments by keyword  
- Filter by appointment date
- Edit or delete entries  

---

### 🍽️ Meal Logging with Calorie Tracking  
**User Story:**  
_As a health-conscious senior, I want to log and track my meals with calorie info, so that I can monitor my daily nutrition intake._

- Log meals by time frame and food name  
- Calories auto-fetched from OpenFoodFacts API  
- Manual calorie entry supported  
- View total daily calories grouped by meal date 
- Edit/delete meals  

---

### 📖 Social Posts & Community  
**User Story:**  
_As a socially active user, I want to post and engage with community content, so that I can stay connected with others through shared interests._

- Create journal-style posts with captions and images  
- View posts by date  
- Like, comment, edit, delete  
- Translation for comments and captions  

---

### 🧑‍💼 User Profile Management  
**User Story:**  
_As a user, I want to update my personal and emergency information, so that caregivers and medical staff can access the data if needed._

- Edit name, birthday, gender, allergies, chronic conditions, emergency contact
- Upload profile photo and bio  
- All data linked to the logged-in user  

---

### ⚖️ Account Creation & Login  
**User Story:**  
_As a new user, I want to securely register and log in, so that I can access and manage my personalised health and wellness data._

- JWT-secured login/register system  
- Passwords encrypted with bcrypt  
- Reset password available  

---

### 🌐 Website Translation  
**User Story:**  
_As a non-English-speaking senior, I want to translate the website to my preferred language, so that I can navigate the site easily._

- Toggle language to Chinese or Malay  
- Saves preference in profile  
- Translates all UI text and content  

---

## 📖 Technology Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js, Express  
- **Database:** Microsoft SQL Server  
- **Authentication:** JWT  
- **Security:** bcrypt  
- **External APIs:** OpenFoodFacts, Google Maps, Weather API, Translation API  

---

## 📲 Accessibility & Usability

- Large fonts and simplified navigation  
- Icons for easy recognition  
- Real-time form validation and helpful messages  

---

## 👥 Project Team - Tikam Team

| Name         | Role      | Key Features Owned                                  |
|--------------|-----------|-----------------------------------------------------|
| Justin Tang  | Developer | Weather, Outfit, Transport, Bookmarking, Facilities |
| Rey Liow     | Developer | Profile, BMI, Health Logs                           |
| Shein Wai Oo | Developer | Appointment Management, Meal Logging                |
| Khaleel Anis | Developer | Medications, Health Reminders                       |
| Wei Dai      | Developer | Posts, Comments, Translations                       |

---

## 🔗 Getting Started

1. Install dependencies:

```bash
npm install
