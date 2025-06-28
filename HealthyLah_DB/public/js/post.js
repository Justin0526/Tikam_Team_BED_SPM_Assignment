const imageInput = document.getElementById('postImage');
const preview = document.getElementById('imagePreview');
const removeBtn = document.getElementById('removeImageBtn');

imageInput.addEventListener('change', function(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      removeBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'none';
    removeBtn.style.display = 'none';
  }
});

removeBtn.addEventListener('click', function() {
  imageInput.value = '';
  preview.style.display = 'none';
  removeBtn.style.display = 'none';
});

document.querySelector('.share-btn').addEventListener('click', () => {
  alert('Post sharing functionality coming soon!');
});
