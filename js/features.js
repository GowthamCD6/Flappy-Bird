document.addEventListener('DOMContentLoaded' , () => {
    const backBtn = document.getElementById('backBtn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        backBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        }, { passive: false });
    }
});