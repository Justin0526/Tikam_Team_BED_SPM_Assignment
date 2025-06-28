const translations = {
  en: {
    welcome: "Welcome, Mr Tan",
    settings: "Settings",
    language: "Language",
    accountSettings: "Account Settings",
    appointment: "Appointment",
    preferences: "Preferences",
    privacy: "Privacy/Security",
    notifications: "Notifications",
    appTheme: "App Theme",
    applyChanges: "Apply Changes",
    footerText: "© 2025 HealthyLah – Designed with care for our seniors",
    facebook: "Facebook",
    twitter: "Twitter",
    instagram: "Instagram",
    email: "Email",
    privacyPolicy: "Privacy Policy",
    termsOfUse: "Terms of Use",
    credits: "Credits",
    navHome: "Home",
    navAbout: "About us",
    navWeather: "Weather",
    navTransport: "Transport & Facilities",
    navHealth: "Health",
    navPost: "Post",
  },
  zh: {
    welcome: "你好, Mr Tan",
    settings: "设定",
    language: "语言",
    accountSettings: "账户设置",
    appointment: "预约管理",
    preferences: "偏好设置",
    privacy: "隐私/安全",
    notifications: "通知设置",
    appTheme: "应用主题",
    applyChanges: "保存更改",
    footerText: "© 2025 HealthyLah – 贴心为长者而设计",
    facebook: "脸书",
    twitter: "推特",
    instagram: "照片墙",
    email: "电子邮件",
    privacyPolicy: "隐私政策",
    termsOfUse: "使用条款",
    credits: "鸣谢",
    navHome: "首页",
    navAbout: "关于我们",
    navWeather: "天气",
    navTransport: "交通与设施",
    navHealth: "健康",
    navPost: "发布",
  },
  ta: {
    welcome: "வணக்கம், Mr Tan",
    settings: "அமைப்புகள்",
    language: "மொழி",
    accountSettings: "கணக்கு அமைப்புகள்",
    appointment: "அப்பாயிண்ட்மெண்ட்",
    preferences: "விருப்பங்கள்",
    privacy: "தனியுரிமை/பாதுகாப்பு",
    notifications: "அறிவிப்புகள்",
    appTheme: "ஆப் தீம்",
    applyChanges: "மாற்றங்களை சேமிக்கவும்",
    footerText: "© 2025 HealthyLah – முதியவர்களுக்காக அக்கறையுடன் வடிவமைக்கப்பட்டது",
    facebook: "பேஸ்புக்",
    twitter: "ட்விட்டர்",
    instagram: "இன்ஸ்டாகிராம்",
    email: "மின்னஞ்சல்",
    privacyPolicy: "தனியுரிமைக் கொள்கை",
    termsOfUse: "பயன்பாட்டு விதிமுறைகள்",
    credits: "க்ரெடிட்ஸ்",
    navHome: "முகப்பு",
    navAbout: "எங்களை பற்றி",
    navWeather: "வானிலை",
    navTransport: "போக்குவரத்து மற்றும் வசதி",
    navHealth: "ஆரோக்கியம்",
    navPost: "பதிவு",
  },
  ms: {
    welcome: "Selamat datang, Mr Tan",
    settings: "Tetapan",
    language: "Bahasa",
    accountSettings: "Tetapan Akaun",
    appointment: "Temujanji",
    preferences: "Keutamaan",
    privacy: "Privasi/Keselamatan",
    notifications: "Pemberitahuan",
    appTheme: "Tema Aplikasi",
    applyChanges: "Simpan Perubahan",
    footerText: "© 2025 HealthyLah – Direka dengan prihatin untuk warga emas",
    facebook: "Facebook",
    twitter: "Twitter",
    instagram: "Instagram",
    email: "E-mel",
    privacyPolicy: "Dasar Privasi",
    termsOfUse: "Terma Penggunaan",
    credits: "Kredit",
    navHome: "Laman Utama",
    navAbout: "Tentang Kami",
    navWeather: "Cuaca",
    navTransport: "Pengangkutan & Kemudahan",
    navHealth: "Kesihatan",
    navPost: "Hantar",
  }
};

function onLanguageSelectChange() {
  const selectedLang = document.getElementById('languageSelect').value;
  const savedLang = localStorage.getItem('language') || 'en';
  const applyButton = document.getElementById('applyButton');
  if (selectedLang !== savedLang) {
    applyButton.style.display = 'inline-block';
  } else {
    applyButton.style.display = 'none';
  }
}

function applyChanges() {
  const lang = document.getElementById('languageSelect').value;
  localStorage.setItem('language', lang);
  translatePage(lang);
  document.getElementById('applyButton').style.display = 'none';
}

function translatePage(lang) {
  const dict = translations[lang];
  document.getElementById('welcomeMsg').textContent = dict.welcome;
  document.getElementById('settingsTitle').textContent = dict.settings;
  document.getElementById('languageLabel').textContent = dict.language;
  document.getElementById('accountSettings').textContent = dict.accountSettings;
  document.getElementById('appointment').textContent = dict.appointment;
  document.getElementById('preferences').textContent = dict.preferences;
  document.getElementById('languageMenu').textContent = dict.language;
  document.getElementById('privacy').textContent = dict.privacy;
  document.getElementById('notifications').textContent = dict.notifications;
  document.getElementById('appTheme').textContent = dict.appTheme;
  document.getElementById('applyButton').textContent = dict.applyChanges;
  document.getElementById('footerText').textContent = dict.footerText;
  document.getElementById('facebookLink').textContent = dict.facebook;
  document.getElementById('twitterLink').textContent = dict.twitter;
  document.getElementById('instagramLink').textContent = dict.instagram;
  document.getElementById('emailLink').textContent = dict.email;
  document.getElementById('privacyLink').textContent = dict.privacyPolicy;
  document.getElementById('termsLink').textContent = dict.termsOfUse;
  document.getElementById('creditsLink').textContent = dict.credits;
  document.getElementById('navHome').textContent = dict.navHome;
  document.getElementById('navAbout').textContent = dict.navAbout;
  document.getElementById('navWeather').textContent = dict.navWeather;
  document.getElementById('navTransport').textContent = dict.navTransport;
  document.getElementById('navHealth').textContent = dict.navHealth;
  document.getElementById('navPost').textContent = dict.navPost;
}

window.onload = function() {
  const savedLang = localStorage.getItem('language') || 'en';
  document.getElementById('languageSelect').value = savedLang;
  translatePage(savedLang);
  document.getElementById('applyButton').style.display = 'none';
};
