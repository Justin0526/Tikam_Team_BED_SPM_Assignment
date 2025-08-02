// Group
const credits = [
  "Polite Mall - <a href='https://nplms.polite.edu.sg/d2l/home' target='_blank'>Polite Mall</a>",
  "Weather data retrieved from <a href='https://www.weatherapi.com/' target='_blank'>Weatherapi.com</a>",
  "Open Food Facts: <a href='https://world.openfoodfacts.org/' target='_blank'>Open Food Facts</a>",
  "HealthHub SG: <a href='https://www.healthhub.sg/' target='_blank'>HealthHub Singapore</a>",
  "Google Maps Platform API: <a href='https://developers.google.com/maps/documentation/places/web-service/overview' target='_blank'>Google Places API</a>",
  "LTA DataMall API: <a href='https://datamall.lta.gov.sg' target='_blank'>Land Transport Authority (LTA)</a>",
  "Cloudinary: <a href='https://cloudinary.com/' target='_blank'>Cloudinary</a>",
  "Google Translate: <a href='https://translate.google.com/' target='_blank'>Google Translate</a>",
  "Icons by: <a href='https://icons8.com/icons' target='_blank'>Icons8</a>, <a href='https://www.flaticon.com/free-icons/social-media' target='_blank'>Flaticon</a>"
];

const acknowledgements = [
  "Community center image: <a href='https://www.onepa.gov.sg/' target='_blank'>OnePA</a> (<a href='https://www.onepa.gov.sg/-/media/images/outlets/cairnhill-cc.jpg' target='_blank'>source</a>)",
  "Polyclinic entrance: <a href='https://polyclinic.singhealth.com.sg' target='_blank'>SingHealth</a> (<a href='https://polyclinic.singhealth.com.sg/adobe/dynamicmedia/deliver/dm-aid--42086347-5db7-4460-9514-50d66e544af3/entrance.jpg?preferwebp=true' target='_blank'>source</a>)",
  "Hawker Centre: <a href='https://www.cntraveler.com/' target='_blank'>Condé Nast Traveler</a> (<a href='https://media.cntraveler.com/photos/59c11fb74186a84559099996/master/pass/Hawker_GettyImages-842718970.jpg' target='_blank'>source</a>)",
  "RTS Link: <a href='https://mustsharenews.com' target='_blank'>MustShareNews</a> (<a href='https://mustsharenews.com/wp-content/uploads/2025/06/514302176_18488693353065980_8568653864935399560_n.jpg' target='_blank'>source image</a>)",
  "Toilet product: <a href='https://www.amazon.com' target='_blank'>Amazon</a> (<a href='https://m.media-amazon.com/images/I/61v0++ObfRL.jpg' target='_blank'>source image</a>)",
  "Elderly using tech: <a href='https://techwireasia.com' target='_blank'>Tech Wire Asia</a> (<a href='https://cdn.tatlerasia.com/tatlerasia/i/2025/06/18210629-pexels-change-c-c-974768353-30120279_cover_1600x1067.jpg' target='_blank'>source</a>)",
  "Bus Services: <a href='https://singaporevisaonline.sg' target='_blank'>Singapore Visa Online</a> (<a href='https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQivYYrGeReMkKm1IAHlO5gXBZV6GSwNNUaL6tcuSqcd9k5eHY4' target='_blank'>source image</a>)",
  "MRT Station: <a href='https://sg.news.yahoo.com' target='_blank'>Yahoo News</a> (<a href='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7_IsgUVjkYzr254WfCoKvjYrPm5BigPZ8cmce8oqEBzu6D80b' target='_blank'>source image</a>)",
  "Outfit images: <a href='https://chat.openai.com/' target='_blank'>ChatGPT</a>, hosted via <a href='https://imagekit.io/' target='_blank'>ImageKit</a>",
  "ArtScience Museum: <a href='https://www.peakpx.com' target='_blank'>Peakpx</a> (<a href='https://www.peakpx.com/en/hd-wallpaper-desktop-ibpbl' target='_blank'>source</a>)",
  "About Us image: <a href='https://www.google.com/imghp' target='_blank'>Google Images</a> (<a href='https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRoHP3rxs12s4u3qAYZuOGaCvV_aSSykbdriJkHA4HXNpL3Got5' target='_blank'>source</a>)",
  "Default Profile Image: <a href='https://stickers.wiki' target='_blank'>StickersWiki</a> (<a href='https://assets.stickerswiki.app/s/webarebearss4ttv/a2dc8fad.thumb.webp' target='_blank'>source</a>)",
  "Elderly Support Group: <a href='https://littlecreekrecovery.org' target='_blank'>Little Creek Recovery</a> (<a href='https://littlecreekrecovery.org/wp-content/uploads/2024/05/pexels-artempodrez-4492103-scaled.jpg' target='_blank'>source</a>)",
  "Miscellaneous images: <a href='https://theaseanmagazine.asean.org' target='_blank'>ASEAN Magazine</a> (<a href='https://theaseanmagazine.asean.org/files/media/2025/07/issue44-24-1.jpg' target='_blank'>source</a>), <a href='https://www.tatlerasia.com' target='_blank'>Tatler Asia</a> (<a href='https://cdn.tatlerasia.com/tatlerasia/i/2025/06/18210629-pexels-change-c-c-974768353-30120279_cover_1600x1067.jpg' target='_blank'>source</a>), <a href='https://www.parklaneplowden.co.uk' target='_blank'>Parklane Plowden</a> (<a href='https://www.parklaneplowden.co.uk/app/uploads/2021/09/inquest-finds-failure-to-check-blood-test-results-to-be-a-critical-factor-in-death-of-graham-kitt-15.jpg' target='_blank'>source</a>), <a href='https://www.google.com/imghp' target='_blank'>Google Images</a> (<a href='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7_IsgUVjkYzr254WfCoKvjYrPm5BigPZ8cmce8oqEBzu6D80b' target='_blank'>source</a>)"
];

function renderList(targetId, items) {
  const ul = document.getElementById(targetId);
  ul.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${index + 1}. ${item}`;
    ul.appendChild(li);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderList("credits-list", credits);
  renderList("acknowledgement-list", acknowledgements);
});
