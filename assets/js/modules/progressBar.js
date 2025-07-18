export function setupProgressBar() {
    const progressBar = document.getElementById('mybar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100;
            progressBar.style.width = scrollPercent + '%';
        });
    }
}
