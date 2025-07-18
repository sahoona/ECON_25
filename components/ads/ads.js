export function initAllAds() {
    const adSlots = document.querySelectorAll('ins.adsbygoogle:not(.ad-initialized)');
    if (adSlots.length === 0) {
        return;
    }

    let adsPushed = false;
    adSlots.forEach(slot => {
        if (slot.offsetParent !== null) {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
                slot.classList.add('ad-initialized');
                adsPushed = true;
            } catch (e) {
                // console.error('AdSense push error:', e);
            }
        }
    });

    if (adsPushed) {
        requestAnimationFrame(initAllAds);
    }
}
