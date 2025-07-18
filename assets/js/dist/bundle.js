(function() {
    'use strict';

    // From utils.js
    function setupPostedDateToggles() {
        const postedOnWrappers = document.querySelectorAll('.posted-on-wrapper');
        postedOnWrappers.forEach(function (wrapper) {
            const datePrimary = wrapper.querySelector('.date-primary');
            const dateSecondary = wrapper.querySelector('.date-secondary');
            const isUpdatable = dateSecondary && datePrimary && datePrimary.innerHTML.trim() !== dateSecondary.innerHTML.trim();
            if (isUpdatable) {
                if (!wrapper.classList.contains('is-updatable')) { wrapper.classList.add('is-updatable'); }
                if (!wrapper.hasAttribute('tabindex')) { wrapper.setAttribute('tabindex', '0'); }
                if (!wrapper.hasAttribute('role')) { wrapper.setAttribute('role', 'button'); }
                wrapper.setAttribute('aria-pressed', wrapper.classList.contains('state-published-visible').toString());
                const togglePublishedDate = function () {
                    this.classList.toggle('state-published-visible');
                    const isPublishedVisible = this.classList.contains('state-published-visible');
                    this.setAttribute('aria-pressed', isPublishedVisible.toString());
                };
                const handleKeyboardToggle = function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        togglePublishedDate.call(this);
                    }
                };
                if (!wrapper.dataset.dateToggleListenerAttached) {
                    wrapper.addEventListener('click', togglePublishedDate);
                    wrapper.addEventListener('keydown', handleKeyboardToggle);
                    wrapper.dataset.dateToggleListenerAttached = 'true';
                }
            } else {
                wrapper.classList.remove('is-updatable');
                wrapper.removeAttribute('tabindex');
                wrapper.removeAttribute('role');
                wrapper.removeAttribute('aria-pressed');
                delete wrapper.dataset.dateToggleListenerAttached;
            }
        });
    }

    function announceToScreenReader(message) {
        let announcer = document.getElementById('gp-screen-reader-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'gp-screen-reader-announcer';
            announcer.style.position = 'absolute';
            announcer.style.left = '-10000px';
            announcer.style.top = 'auto';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.overflow = 'hidden';
            announcer.setAttribute('aria-live', 'assertive');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }
        announcer.textContent = message;
        setTimeout(() => { announcer.textContent = ''; }, 3000);
    }

    function setupLanguageToggle() {
        const switcherContainer = document.getElementById('gp-language-switcher');
        if (!switcherContainer) { return; }
        const toggleButton = document.getElementById('gp-lang-switcher-button');
        const languageList = document.getElementById('gp-lang-switcher-list');
        if (!toggleButton || !languageList) { return; }
        toggleButton.addEventListener('click', function(event) {
            event.stopPropagation();
            const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                languageList.setAttribute('hidden', '');
                toggleButton.setAttribute('aria-expanded', 'false');
                switcherContainer.classList.remove('active');
            } else {
                languageList.removeAttribute('hidden');
                toggleButton.setAttribute('aria-expanded', 'true');
                switcherContainer.classList.add('active');
            }
        });
        document.addEventListener('click', function(event) {
            if (!switcherContainer.contains(event.target)) {
                if (toggleButton.getAttribute('aria-expanded') === 'true') {
                    languageList.setAttribute('hidden', '');
                    toggleButton.setAttribute('aria-expanded', 'false');
                    switcherContainer.classList.remove('active');
                }
            }
        });
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                if (toggleButton.getAttribute('aria-expanded') === 'true') {
                    languageList.setAttribute('hidden', '');
                    toggleButton.setAttribute('aria-expanded', 'false');
                    switcherContainer.classList.remove('active');
                    toggleButton.focus();
                }
            }
        });
    }

    function setupCodeCopyButtons() {
        document.querySelectorAll('pre').forEach(pre => {
            const button = document.createElement('button');
            button.className = 'copy-code-button';
            button.textContent = '코드 복사';
            button.setAttribute('aria-label', '코드 블록 내용 복사');
            pre.appendChild(button);
            button.addEventListener('click', () => {
                const code = pre.querySelector('code');
                if (code) {
                    navigator.clipboard.writeText(code.innerText).then(() => {
                        button.textContent = '복사됨!';
                        announceToScreenReader('코드가 클립보드에 복사되었습니다.');
                        setTimeout(() => { button.textContent = '코드 복사'; }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        announceToScreenReader('코드 복사에 실패했습니다.');
                    });
                }
            });
        });
    }

    function removeProblematicAriaLabel() {
        const footers = document.querySelectorAll('footer.entry-meta');
        footers.forEach(footer => {
            if (footer.getAttribute('aria-label') === '항목 메타') {
                footer.removeAttribute('aria-label');
            }
        });
    }

    // From toc.js
    function generateClientSideTOC() {
        const tocContainer = document.getElementById('gp-toc-container');
        if (!tocContainer) { return; }
        const tocList = tocContainer.querySelector('.gp-toc-list');
        if (!tocList) { tocContainer.style.display = 'none'; return; }
        const contentSelectors = ['article.post .entry-content', '.post-content', '.single-post-content', 'main[role="main"] article', '#main article'];
        let mainContent = null;
        for (const selector of contentSelectors) {
            mainContent = document.querySelector(selector);
            if (mainContent) break;
        }
        if (!mainContent) { tocContainer.style.display = 'none'; return; }
        let enabled_levels = [];
        if (typeof gp_settings !== 'undefined' && typeof gp_settings.toc_settings !== 'undefined') {
            if (gp_settings.toc_settings.h2 === 'on') enabled_levels.push('h2');
            if (gp_settings.toc_settings.h3 === 'on') enabled_levels.push('h3');
            if (gp_settings.toc_settings.h4 === 'on') enabled_levels.push('h4');
            if (gp_settings.toc_settings.h5 === 'on') enabled_levels.push('h5');
            if (gp_settings.toc_settings.h6 === 'on') enabled_levels.push('h6');
        } else {
            enabled_levels.push('h2', 'h3');
        }
        if (enabled_levels.length === 0) { tocContainer.style.display = 'none'; return; }
        const headingSelector = enabled_levels.join(', ');
        const headingsNodeList = mainContent.querySelectorAll(headingSelector);
        const headings = Array.from(headingsNodeList).filter(heading => !heading.closest('.yarpp-related, .yarpp-related-widget'));
        if (headings.length === 0) { tocContainer.style.display = 'none'; return; }
        tocList.innerHTML = '';
        let positionCounter = 1;
        let idCounters = {};
        const parentLists = [tocList];
        headings.forEach(heading => {
            const rawTitle = heading.textContent.trim();
            if (!rawTitle) return;
            let baseId = rawTitle.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-').replace(/-+/g, '-');
            if (!baseId) baseId = 'toc-item';
            let uniqueId = baseId;
            if (idCounters[baseId] !== undefined) {
                idCounters[baseId]++;
                uniqueId = baseId + '-' + idCounters[baseId];
            } else {
                idCounters[baseId] = 1;
            }
            heading.id = uniqueId;
            const listItem = document.createElement('li');
            listItem.setAttribute('itemprop', 'itemListElement');
            listItem.setAttribute('itemtype', 'https://schema.org/ListItem');
            const metaPosition = document.createElement('meta');
            metaPosition.setAttribute('itemprop', 'position');
            metaPosition.setAttribute('content', positionCounter.toString());
            listItem.appendChild(metaPosition);
            const link = document.createElement('a');
            link.href = '#' + uniqueId;
            link.textContent = rawTitle;
            link.setAttribute('itemprop', 'name');
            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById(this.getAttribute('href').substring(1)).scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            listItem.appendChild(link);
            const level = parseInt(heading.tagName.substring(1));
            listItem.classList.add('toc-heading-level-' + level);
            const parentLevel = level - 2;
            while (parentLists.length > parentLevel + 1) {
                parentLists.pop();
            }
            let parentList = parentLists[parentLists.length - 1] || tocList;
            parentList.appendChild(listItem);
            const nextHeading = headings[headings.indexOf(heading) + 1];
            if (nextHeading && parseInt(nextHeading.tagName.substring(1)) > level) {
                const newList = document.createElement('ol');
                listItem.appendChild(newList);
                parentLists.push(newList);
            }
            positionCounter++;
        });
        if (tocList.children.length === 0) { tocContainer.style.display = 'none'; }
    }

    // From starRating.js
    function setupStarRating($) {
        const starRatingContainer = document.querySelector('.gp-star-rating-container');
        if (!starRatingContainer) return;
        const starsWrapper = starRatingContainer.querySelector('.stars-wrapper');
        const starsForeground = starRatingContainer.querySelector('.stars-foreground');
        const ratingText = starRatingContainer.querySelector('.rating-text');
        if (!starsWrapper || !starsForeground || !ratingText) return;
        const postId = starRatingContainer.dataset.postId;
        const storageKey = `gp_star_rating_${postId}`;
        let currentRating = parseFloat(localStorage.getItem(storageKey)) || 0;
        let tempRating = 0;
        const userRatingText = starRatingContainer.querySelector('.user-rating-text');
        const editRatingBtn = starRatingContainer.querySelector('.edit-rating-btn');
        const submitRatingBtn = starRatingContainer.querySelector('.submit-rating-btn');
        let initialAverage = parseFloat(ratingText.getAttribute('data-initial-average')) || 0;
        const updateUserRatingText = (rating) => {
            if (rating > 0) {
                userRatingText.textContent = `You rated: ${rating.toFixed(1)}`;
                userRatingText.style.display = 'block';
            } else {
                userRatingText.style.display = 'none';
            }
        };
        if (currentRating > 0) {
            starRatingContainer.classList.add('voted');
            updateUserRatingText(currentRating);
        }
        const updateStars = (rating) => {
            starsForeground.style.width = `${(rating / 5) * 100}%`;
        };
        const getRatingFromEvent = (e) => {
            const rect = starsWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const preciseRating = (x / rect.width) * 5;
            return Math.max(0.5, Math.min(5, Math.round(preciseRating * 2) / 2));
        };
        starsWrapper.addEventListener('mousemove', function(e) {
            if (starRatingContainer.classList.contains('voted') && !starRatingContainer.classList.contains('editing')) return;
            updateStars(getRatingFromEvent(e));
        });
        starsWrapper.addEventListener('mouseleave', function() {
            if (starRatingContainer.classList.contains('editing')) {
                updateStars(tempRating);
            } else {
                updateStars(initialAverage);
            }
        });
        starsWrapper.addEventListener('click', function(e) {
            if (starRatingContainer.classList.contains('voted') && !starRatingContainer.classList.contains('editing')) return;
            tempRating = getRatingFromEvent(e);
            updateStars(tempRating);
            if (!starRatingContainer.classList.contains('editing')) {
                submitRating(tempRating);
            }
        });
        if (editRatingBtn) {
            editRatingBtn.addEventListener('click', function() {
                starRatingContainer.classList.add('editing');
                starRatingContainer.classList.remove('voted');
                tempRating = currentRating;
                userRatingText.style.display = 'none';
            });
        }
        if (submitRatingBtn) {
            submitRatingBtn.addEventListener('click', function() {
                if (tempRating > 0) { submitRating(tempRating); }
            });
        }
        function submitRating(ratingToSubmit) {
            const oldRating = parseFloat(localStorage.getItem(storageKey)) || 0;
            $.ajax({
                url: gp_settings.ajax_url, type: 'POST',
                data: { action: 'gp_handle_star_rating', post_id: postId, new_rating: ratingToSubmit, old_rating: oldRating, nonce: gp_settings.star_rating_nonce },
                success: function(response) {
                    if (response.success) {
                        currentRating = ratingToSubmit;
                        localStorage.setItem(storageKey, currentRating.toString());
                        initialAverage = response.data.average;
                        ratingText.setAttribute('data-initial-average', initialAverage.toFixed(1));
                        ratingText.querySelector('span:first-child').textContent = initialAverage.toFixed(1);
                        ratingText.title = `${response.data.votes} votes`;
                        updateStars(ratingToSubmit);
                        updateUserRatingText(currentRating);
                        starRatingContainer.classList.remove('editing');
                        starRatingContainer.classList.add('voted');
                        starRatingContainer.classList.add('submitted');
                        setTimeout(() => { starRatingContainer.classList.remove('submitted'); }, 800);
                    }
                }
            });
        }
    }

    // From sidebar.js
    function setupSidebar() {
        const sidebar = document.getElementById('gp-sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarClose = document.querySelector('.sidebar-close');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (!sidebar || !sidebarToggle) return;
        function toggleSidebar(forceClose = false) {
            const isOpen = sidebar.classList.contains('gp-sidebar-visible');
            if (forceClose || isOpen) {
                sidebar.classList.remove('gp-sidebar-visible');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                setTimeout(() => {
                    if (!sidebar.classList.contains('gp-sidebar-visible')) {
                        sidebar.style.display = 'none';
                        if (sidebarOverlay) sidebarOverlay.style.display = 'none';
                    }
                }, 300);
            } else {
                sidebar.style.display = 'block';
                if (sidebarOverlay) sidebarOverlay.style.display = 'block';
                setTimeout(() => {
                    sidebar.classList.add('gp-sidebar-visible');
                    if (sidebarOverlay) sidebarOverlay.classList.add('active');
                    document.body.classList.add('sidebar-open');
                }, 10);
                cloneTocToSidebar();
            }
        }
        function cloneTocToSidebar() {
            const mainToc = document.getElementById('gp-toc-container');
            const sidebarTocContainer = document.querySelector('.sidebar-toc-container');
            if (!mainToc || !sidebarTocContainer) return;
            sidebarTocContainer.innerHTML = '';
            const clonedToc = mainToc.cloneNode(true);
            clonedToc.id = 'sidebar-toc-container';
            clonedToc.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetElement = document.getElementById(this.getAttribute('href').substring(1));
                    if (targetElement) {
                        if (window.innerWidth <= 768) { toggleSidebar(true); }
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
            sidebarTocContainer.appendChild(clonedToc);
        }
        sidebarToggle.addEventListener('click', () => toggleSidebar());
        if (sidebarClose) { sidebarClose.addEventListener('click', () => toggleSidebar(true)); }
        if (sidebarOverlay) { sidebarOverlay.addEventListener('click', () => toggleSidebar(true)); }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('gp-sidebar-visible')) {
                toggleSidebar(true);
            }
        });
    }

    // From reactions.js
    function setupReactionButtons($) {
        document.querySelectorAll('.reaction-btn').forEach(button => {
            const postId = button.dataset.postId;
            const cooldownKey = `gpCooldown_${postId}`;
            const setCooldownState = (isCoolingDown) => {
                document.querySelectorAll(`.reaction-btn[data-post-id="${postId}"]`).forEach(btn => {
                    btn.classList.toggle('cooldown', isCoolingDown);
                    btn.disabled = isCoolingDown;
                });
            };
            const checkCooldown = () => {
                const cooldownEndTime = localStorage.getItem(cooldownKey);
                if (cooldownEndTime && Date.now() < cooldownEndTime) {
                    setCooldownState(true);
                    setTimeout(() => { setCooldownState(false); }, cooldownEndTime - Date.now());
                    return true;
                }
                setCooldownState(false);
                return false;
            };
            checkCooldown();
            button.addEventListener('click', function() {
                if (this.disabled) return;
                const reaction = this.dataset.reaction;
                const countSpan = this.querySelector('.reaction-count');
                countSpan.textContent = parseInt(countSpan.textContent) + 1;
                const cooldownDuration = 10000;
                localStorage.setItem(cooldownKey, Date.now() + cooldownDuration);
                setCooldownState(true);
                setTimeout(() => setCooldownState(false), cooldownDuration);
                $.ajax({
                    url: gp_settings.ajax_url, type: 'POST',
                    data: { action: 'gp_handle_reaction', post_id: postId, reaction: reaction, nonce: gp_settings.reactions_nonce },
                    error: () => {
                        countSpan.textContent = parseInt(countSpan.textContent) - 1;
                        localStorage.removeItem(cooldownKey);
                        setCooldownState(false);
                    }
                });
            });
        });
    }

    // From progressBar.js
    function setupProgressBar() {
        const progressBar = document.getElementById('mybar');
        if (progressBar) {
            window.addEventListener('scroll', () => {
                const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100;
                progressBar.style.width = scrollPercent + '%';
            });
        }
    }

    // From lazyLoad.js
    function setupLazyLoading(container = document) {
        const lazyImages = container.querySelectorAll('img.lazy-load:not(.loaded)');
        if (!lazyImages.length) return;
        let observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        img.removeAttribute('data-src');
                    }
                    img.classList.remove('lazy-load');
                    observerInstance.unobserve(img);
                }
            });
        }, { rootMargin: '0px 0px 100px 0px', threshold: 0.01 });
        lazyImages.forEach(img => { observer.observe(img); });
    }

    // From infiniteScroll.js
    function insertInfeedAds(container) {
        if (typeof window.infeedAdCount === 'undefined') window.infeedAdCount = 0;
        if (typeof window.ajaxPostCount === 'undefined') window.ajaxPostCount = 0;
        window.ajaxPostCount++;
        if (window.ajaxPostCount > 0 && window.ajaxPostCount % 4 === 0 && window.infeedAdCount < 3 && gp_settings.ad_client && gp_settings.infeed_ad_slot) {
            const adArticle = document.createElement('article');
            adArticle.className = 'post type-post status-publish format-standard hentry manual-ad-article';
            adArticle.innerHTML = `<div class="inside-article ad-container"><div class="manual-ad-container in-feed-ad"><ins class="adsbygoogle" style="display:block" data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86" data-ad-client="${gp_settings.ad_client}" data-ad-slot="${gp_settings.infeed_ad_slot}"></ins></div></div>`;
            window.infeedAdCount++;
            const lastPost = container.lastElementChild;
            container.insertBefore(adArticle, lastPost ? lastPost.nextSibling : null);
            try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.error('AdSense push error:', e); }
        }
    }

    function setupInfiniteScroll($) {
        const postsContainer = document.querySelector('.site-main');
        if (!postsContainer || typeof gp_settings === 'undefined' || !gp_settings.ajax_url || !gp_settings.load_more_posts_nonce) return;
        let currentPage = 1;
        let isLoading = false;
        let noMorePosts = false;
        function loadPosts(pageToLoad) {
            if (isLoading || noMorePosts) return;
            isLoading = true;
            const loadMoreBtn = document.getElementById('load-more-btn');
            if (loadMoreBtn) {
                loadMoreBtn.textContent = 'Loading...';
                loadMoreBtn.disabled = true;
            }
            $.ajax({
                url: gp_settings.ajax_url, type: 'POST',
                data: { action: 'load_more_posts', page: pageToLoad, nonce: gp_settings.load_more_posts_nonce },
                success: function(response) {
                    isLoading = false;
                    const currentButtonContainer = document.querySelector('.load-more-container');
                    if (currentButtonContainer) currentButtonContainer.remove();
                    if (response.success && response.data && response.data.html && response.data.html.trim() !== '') {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = response.data.html;
                        Array.from(tempDiv.children).forEach(post => postsContainer.appendChild(post));
                        insertInfeedAds(postsContainer);
                        if (typeof setupLazyLoading === 'function') requestAnimationFrame(() => setupLazyLoading(postsContainer));
                    }
                    if (response.success && response.data && response.data.button_html && response.data.button_html.trim() !== '') {
                        const newButtonTempDiv = document.createElement('div');
                        newButtonTempDiv.innerHTML = response.data.button_html;
                        postsContainer.appendChild(newButtonTempDiv.firstChild);
                    } else {
                        noMorePosts = true;
                        if (!document.getElementById('no-more-posts-message')) {
                            const noMoreMessage = document.createElement('p');
                            noMoreMessage.id = 'no-more-posts-message';
                            noMoreMessage.textContent = 'This is the last page.';
                            noMoreMessage.style.textAlign = 'center';
                            postsContainer.appendChild(noMoreMessage);
                        }
                    }
                    currentPage = pageToLoad;
                },
                error: function() {
                    isLoading = false;
                    const btn = document.getElementById('load-more-btn');
                    if(btn) {
                        btn.textContent = 'Error. Try Again?';
                        btn.disabled = false;
                    }
                }
            });
        }
        postsContainer.addEventListener('click', function(event) {
            if (event.target.matches('#load-more-btn')) loadPosts(currentPage + 1);
        });
    }

    function setupSeriesLoadMoreButton($) {
        const seriesContainer = document.querySelector('.gp-series-posts-container');
        if (!seriesContainer) return;
        const loadMoreBtn = document.getElementById('load-more-series-btn');
        if (!loadMoreBtn) return;
        const seriesGrid = seriesContainer.querySelector('.series-posts-grid');
        if (!seriesGrid) return;
        let currentPostId = seriesContainer.dataset.currentPostId;
        let initialPostsCount = parseInt(seriesContainer.dataset.initialPostsCount, 10);
        let postsPerLoad = parseInt(seriesContainer.dataset.loadMoreCount, 10);
        let maxClicks = parseInt(seriesContainer.dataset.maxClicks, 10);
        let totalRelatedPosts = parseInt(seriesContainer.dataset.totalRelatedPosts, 10);
        let currentOffset = initialPostsCount;
        let clickCount = 0;
        let isLoading = false;
        seriesContainer.addEventListener('click', function(event) {
            if (event.target.matches('#load-more-series-btn')) {
                if (isLoading || clickCount >= maxClicks) return;
                isLoading = true;
                const btn = event.target;
                btn.textContent = 'Loading...';
                btn.disabled = true;
                $.ajax({
                    url: gp_settings.ajax_url, type: 'POST',
                    data: { action: 'load_more_series_posts', nonce: gp_settings.load_more_series_nonce, current_post_id: currentPostId, offset: currentOffset, posts_per_page: postsPerLoad, initial_posts_count: initialPostsCount },
                    success: function(response) {
                        isLoading = false;
                        if (response.success && response.data.html) {
                            const tempContainer = document.createElement('div');
                            tempContainer.innerHTML = response.data.html;
                            Array.from(tempContainer.children).forEach(post => seriesGrid.appendChild(post));
                            if (typeof setupLazyLoading === 'function') requestAnimationFrame(() => setupLazyLoading(seriesGrid));
                            currentOffset = response.data.new_offset;
                            clickCount++;
                            if (!response.data.has_more || clickCount >= maxClicks || currentOffset >= totalRelatedPosts) {
                                btn.textContent = 'No More Series';
                                btn.disabled = true;
                                setTimeout(() => { btn.style.display = 'none'; }, 2000);
                            } else {
                                btn.textContent = 'Series More';
                                btn.disabled = false;
                            }
                        } else {
                            btn.textContent = response.data.message || 'No More Series';
                            btn.disabled = true;
                            setTimeout(() => { btn.style.display = 'none'; }, 2000);
                        }
                    },
                    error: function() {
                        isLoading = false;
                        btn.textContent = 'Error. Try Again?';
                        btn.disabled = false;
                    }
                });
            }
        });
    }

    // From floatingButtons.js
    function setupFloatingButtons() {
      const floatingButtonsContainer = document.querySelector('.floating-buttons-container');
      const scrollToTopBtn = document.getElementById('scrollToTopBtn');
      if (!floatingButtonsContainer || !scrollToTopBtn) return;
      scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      let timeout;
      window.addEventListener('scroll', () => {
        floatingButtonsContainer.classList.add('show-back-to-top');
        clearTimeout(timeout);
        timeout = setTimeout(() => { floatingButtonsContainer.classList.remove('show-back-to-top'); }, 2000);
      });
    }

    // From darkMode.js
    function initDarkMode() {
        if (document.body.dataset.darkModeInitialized) return;
        document.body.dataset.darkModeInitialized = 'true';
        const htmlEl = document.documentElement;
        function setThemeState(isDark) {
            htmlEl.classList.toggle('dark-mode-active', isDark);
            localStorage.setItem('darkMode', isDark);
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) darkModeToggle.setAttribute('aria-pressed', isDark.toString());
        }
        document.addEventListener('click', function(event) {
            const darkModeToggle = event.target.closest('#darkModeToggle');
            if (darkModeToggle) setThemeState(!htmlEl.classList.contains('dark-mode-active'));
        });
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) darkModeToggle.setAttribute('aria-pressed', (localStorage.getItem('darkMode') === 'true').toString());
    }

    // From copyUrl.js
    function setupURLCopy() {
        document.body.addEventListener('click', function(event) {
            const topCopyBtn = event.target.closest('.gp-copy-url-btn');
            const bottomCopyBtn = event.target.closest('.social-share-btn.gp-custom-copy-bottom-btn');
            let buttonToAnimate = null;
            if (topCopyBtn) {
                event.preventDefault();
                buttonToAnimate = topCopyBtn;
            } else if (bottomCopyBtn) {
                event.preventDefault();
                buttonToAnimate = bottomCopyBtn;
            }
            if (buttonToAnimate) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        buttonToAnimate.classList.add('copied');
                        setTimeout(() => { buttonToAnimate.classList.remove('copied'); }, 2000);
                    }).catch(() => { alert('URL 복사에 실패했습니다.'); });
                } else {
                    alert('클립보드 복사 기능을 지원하지 않는 브라우저입니다.');
                }
            }
        });
    }

    // From ads.js
    function initAllAds() {
        const adSlots = document.querySelectorAll('ins.adsbygoogle:not(.ad-initialized)');
        if (adSlots.length === 0) return;
        let adsPushed = false;
        adSlots.forEach(slot => {
            if (slot.offsetParent !== null) {
                try {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    slot.classList.add('ad-initialized');
                    adsPushed = true;
                } catch (e) { /* console.error('AdSense push error:', e); */ }
            }
        });
        if (adsPushed) requestAnimationFrame(initAllAds);
    }

    // Main execution block from main.js
    const $ = window.jQuery;

    initDarkMode();
    document.addEventListener('DOMContentLoaded', setupFloatingButtons);
    setupSidebar();
    setupURLCopy();
    setupProgressBar();
    setupStarRating($);
    setupReactionButtons($);
    setupPostedDateToggles();
    setupLanguageToggle();
    setupCodeCopyButtons();
    setupLazyLoading();
    setupInfiniteScroll($);
    removeProblematicAriaLabel();
    setupSeriesLoadMoreButton($);

    if (document.getElementById('gp-toc-container')) {
        generateClientSideTOC();
    }

    window.onload = function() {
        initAllAds();
    };

    document.addEventListener('DOMContentLoaded', function() {
        const emailPrivacyCheckbox = document.getElementById('wp-comment-email-privacy');
        const emailField = document.getElementById('email');
        if (emailPrivacyCheckbox && emailField) {
            const req = emailField.hasAttribute('aria-required');
            const updateEmailFieldState = () => {
                if (emailPrivacyCheckbox.checked) {
                    emailField.disabled = true;
                    emailField.required = false;
                    emailField.value = '';
                } else {
                    emailField.disabled = false;
                    if (req) emailField.required = true;
                }
            };
            updateEmailFieldState();
            emailPrivacyCheckbox.addEventListener('change', updateEmailFieldState);
        }
        if (window.location.hash && window.location.hash.indexOf('#comment-') === 0) {
            const commentElement = document.querySelector(window.location.hash);
            if (commentElement) {
                setTimeout(() => {
                    commentElement.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        }
    });

})();
