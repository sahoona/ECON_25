export function setupLazyLoading(container = document) {
    const lazyImages = container.querySelectorAll('img.lazy-load:not(.loaded)');

    if (!lazyImages.length) {
        return;
    }

    let observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;

                if (src) {
                    img.src = src;
                    img.classList.add('loaded'); // Mark as loaded
                    img.removeAttribute('data-src');
                }
                img.classList.remove('lazy-load');
                observerInstance.unobserve(img);
            }
        });
    }, {
        rootMargin: '0px 0px 100px 0px', // Start loading when 100px away
        threshold: 0.01
    });

    lazyImages.forEach(img => {
        observer.observe(img);
    });
}
