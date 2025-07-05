// Set current date
const now = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('current-date').textContent = now.toLocaleDateString('en-SG', options);
        
// Mark as taken functionality
document.querySelectorAll('.mark-btn').forEach(button => {
    button.addEventListener('click', function() {
        const row = this.closest('tr');
        const statusCell = row.querySelector('.status');
                
        if (statusCell.classList.contains('not-yet')) {
            statusCell.textContent = 'Taken';
            statusCell.classList.remove('not-yet');
            statusCell.classList.add('taken');
                    
            // Change button to disabled state
            this.innerHTML = '<i class="fas fa-check"></i> Taken';
            this.disabled = true;
            this.classList.add('disabled');
                    
            // Show confirmation
            showNotification('Medication marked as taken!');
        }
    });
});
        
// Form submission
document.querySelector('.medication-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showNotification('Medication added successfully!');
    this.reset();
            
    // Set default start date to today
    document.getElementById('start-date').valueAsDate = new Date();
});
        
// Show notification function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);
            
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
            
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
        
// Set default start date to today
document.getElementById('start-date').valueAsDate = new Date();