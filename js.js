// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Мобильное меню
    initMobileMenu();
    // Полноэкранный режим для PDF
    initFullscreenPDF();
    // Скрытие навигации при прокрутке
    initNavbarHide();
    // Инициализация прелоадера: убираем при завершении загрузки или по таймауту
    initPreloader();
    // Инициализация вкладок
    initTabs();
});

// Прелоадер: скрытие после полной загрузки или через таймаут
function initPreloader() {
    const pre = document.getElementById('preloader');
    if (!pre) return;

    const hide = () => {
        if (!pre) return;
        pre.classList.add('preloader-fadeout');
        // Через анимацию удаляем элемент
        setTimeout(() => {
            pre.classList.add('preloader-hidden');
            try { pre.remove(); } catch (e) { /* ignore */ }
        }, 450);
    };

    // Если окно полностью загружено — скрыть
    if (document.readyState === 'complete') {
        // чуть задержим, чтобы увидеть эффект
        setTimeout(hide, 300);
    } else {
        window.addEventListener('load', function() {
            setTimeout(hide, 300);
        }, { once: true });
    }

    // Страховочный таймаут на случай медленной загрузки
    setTimeout(() => {
        if (document.body.contains(pre)) hide();
    }, 4000);
}

// Система вкладок: переключение видимых секций без перезагрузки
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    if (!tabs.length || !panels.length) return;

    function activate(targetId, pushState = false) {
        panels.forEach(p => {
            const isTarget = p.id === targetId;
            p.classList.toggle('active', isTarget);
            p.setAttribute('aria-hidden', String(!isTarget));
        });
        tabs.forEach(b => {
            const isTarget = b.dataset.target === targetId;
            b.setAttribute('aria-selected', String(isTarget));
            b.classList.toggle('active', isTarget);
        });
        if (pushState) {
            try { history.replaceState(null, '', '#' + targetId); } catch (e) { /* ignore */ }
        }
    }

    tabs.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const target = btn.dataset.target;
            if (!target) return;
            activate(target, true);
        });
        // keyboard navigation: Left/Right arrows
        btn.addEventListener('keydown', function(e) {
            const idx = Array.from(tabs).indexOf(btn);
            if (e.key === 'ArrowRight') {
                const next = tabs[(idx + 1) % tabs.length]; next.focus();
            } else if (e.key === 'ArrowLeft') {
                const prev = tabs[(idx - 1 + tabs.length) % tabs.length]; prev.focus();
            }
        });
    });

    // If there's a hash, activate that panel on load
    const hash = (location.hash || '').replace('#', '');
    if (hash) {
        const el = document.getElementById(hash);
        if (el && el.classList.contains('tab-panel')) activate(hash, false);
    }
}

// Инициализация мобильного меню
function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    function setExpanded(val) {
        toggle.setAttribute('aria-expanded', String(val));
    }

    toggle.addEventListener('click', function() {
        const active = menu.classList.toggle('active');
        setExpanded(active);
    });

    menu.addEventListener('click', function(e) {
        if (e.target.tagName.toLowerCase() === 'a') {
            menu.classList.remove('active');
            setExpanded(false);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            menu.classList.remove('active');
            setExpanded(false);
            toggle.focus();
        }
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && menu.classList.contains('active')) {
            menu.classList.remove('active');
            setExpanded(false);
        }
    });
}

// Инициализация полноэкранного режима PDF
function initFullscreenPDF() {
    const pdfContainers = document.querySelectorAll('.pdf-container');
    const overlay = document.querySelector('.overlay');
    
    pdfContainers.forEach(container => {
        const fullscreenBtn = container.querySelector('.fullscreen-btn');
        const iframe = container.querySelector('iframe');
        let originalParent = null;
        let originalPosition = null;
        
        if (!fullscreenBtn || !iframe) return;

        function openFullscreen(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Сохраняем оригинальное положение
            originalParent = container.parentElement;
            originalPosition = container.nextSibling;
            container.dataset.scrollY = window.scrollY;

            // Активируем полноэкранный режим
            container.classList.add('fullscreen');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            fullscreenBtn.setAttribute('aria-label', 'Кішірейту');
            
            // Перемещаем контейнер в конец body
            document.body.appendChild(container);
        }

        function closeFullscreen() {
            // Деактивируем полноэкранный режим
            container.classList.remove('fullscreen');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            fullscreenBtn.setAttribute('aria-label', 'Толық экранға шығару');

            // Возвращаем контейнер на место
            if (originalParent && originalPosition) {
                originalParent.insertBefore(container, originalPosition);
            } else if (originalParent) {
                originalParent.appendChild(container);
            }

            // Восстанавливаем позицию прокрутки
            const scrollY = parseInt(container.dataset.scrollY || '0');
            window.scrollTo(0, scrollY);
        }

        // Обработчик клика по кнопке
        fullscreenBtn.addEventListener('click', (e) => {
            if (container.classList.contains('fullscreen')) {
                closeFullscreen();
            } else {
                openFullscreen(e);
            }
        });

        // Закрытие по клику на overlay
        overlay.addEventListener('click', () => {
            if (container.classList.contains('fullscreen')) {
                closeFullscreen();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && container.classList.contains('fullscreen')) {
                toggleFullscreen();
            }
        });

        // Закрытие по клику вне PDF в полноэкранном режиме
        container.addEventListener('click', (e) => {
            if (container.classList.contains('fullscreen') && e.target === container) {
                toggleFullscreen();
            }
        });
    });
}

// Скрытие навигации при прокрутке
function initNavbarHide() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateNavbar() {
        const currentScrollY = window.scrollY;

        // Показываем навбар при скролле вверх или в самом верху страницы
        if (currentScrollY < lastScrollY || currentScrollY < 50) {
            navbar.classList.remove('hide');
        } 
        // Скрываем при скролле вниз и не в самом верху
        else if (currentScrollY > lastScrollY && currentScrollY > 50) {
            navbar.classList.add('hide');
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateNavbar();
            });
            ticking = true;
        }
    });
}