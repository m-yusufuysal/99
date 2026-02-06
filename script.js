
// State Management
const STATE = {
    progress: JSON.parse(localStorage.getItem('islamvy_roadmap_progress')) || {},
    // Format: { "0": { completed: true, tasks: [0, 1], notes: "...", actualDownloads: 123 } }
    currentDayId: null
};

// Ramadan 2026 Config
const RAMADAN_START = new Date('2026-02-17');
const RAMADAN_END = new Date('2026-03-18');

const ARPU = 0.20; // Average Revenue Per User in USD

const RANKS = [
    { name: 'Çaylak', min: 0, color: 'text-slate-400' },
    { name: 'Girişimci', min: 1000, color: 'text-indigo-400' },
    { name: 'Usta', min: 10000, color: 'text-purple-400' },
    { name: 'Patron', min: 50000, color: 'text-amber-400' },
    { name: 'Efsane', min: 1000000, color: 'text-emerald-400' },
    { name: 'İmparator', min: 3000000, color: 'text-rose-400' }
];

const ELEMENTS = {
    container: document.getElementById('roadmapContainer'),
    progressBar: document.getElementById('progressBar'),
    totalProgress: document.getElementById('totalProgress'),
    // Stats
    completedCount: document.getElementById('completedCount') ? document.getElementById('completedCount') : null, // Fallback if element removed
    totalRevenue: document.getElementById('totalRevenue'),
    currentRank: document.getElementById('currentRank'),
    nextRankProgress: document.getElementById('nextRankProgress'),

    modal: {
        backdrop: document.getElementById('modalBackdrop'),
        content: document.getElementById('modalContent'),
        closeBtn: document.getElementById('closeModalBtn'),
        title: document.getElementById('modalTitle'),
        subtitle: document.getElementById('modalSubtitle'),
        date: document.getElementById('modalDate'),
        phase: document.getElementById('modalPhase'),
        budget: document.getElementById('modalBudget'),
        metric: document.getElementById('modalMetric'),
        tasksContainer: document.getElementById('modalTasks'),
        completeBtn: document.getElementById('completeDayBtn'),
        // New Inputs
        notes: document.getElementById('modalNotes'),
        actualDownloads: document.getElementById('modalActualDownloads'),
        modalRevenue: document.getElementById('modalRevenue')
    },
    scrollToCurrentBtn: document.getElementById('scrollToCurrentBtn')
};

let currentModalDayIndex = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initRoadmap();
    updateGlobalProgress();

    // Event Listeners
    ELEMENTS.modal.closeBtn.addEventListener('click', closeModal);
    ELEMENTS.modal.backdrop.addEventListener('click', (e) => {
        if (e.target === ELEMENTS.modal.backdrop) closeModal();
    });
    ELEMENTS.modal.completeBtn.addEventListener('click', () => {
        toggleDayCompletion(currentModalDayIndex);
    });
    ELEMENTS.scrollToCurrentBtn.addEventListener('click', scrollToCurrent);

    // Auto-save inputs on change
    ELEMENTS.modal.notes.addEventListener('input', () => saveModalInputs(currentModalDayIndex));
    ELEMENTS.modal.actualDownloads.addEventListener('input', () => {
        saveModalInputs(currentModalDayIndex);
        updateModalRevenue();
    });
});

// Build the roadmap
function initRoadmap() {
    ELEMENTS.container.innerHTML = '';

    // Add center line
    const centerLine = document.createElement('div');
    centerLine.className = 'absolute left-8 md:left-1/2 top-4 bottom-0 w-0.5 bg-slate-800 md:-translate-x-1/2 z-0';
    ELEMENTS.container.appendChild(centerLine);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let firstCurrentFound = false;

    strategyData.forEach((dayData, index) => {
        let status = 'future';
        const dayState = STATE.progress[index] || { completed: false, tasks: [] };

        // Date parsing helper
        const dayDate = parseDate(dayData.date);

        // Determine Status based on completion
        if (dayState.completed) {
            status = 'completed';
        } else {
            // Logic: if date matches today, it's current.
            if (dayDate && dayDate.getTime() === today.getTime()) {
                status = 'current';
            }
        }

        // Logic for "Current Active Day": First non-completed day
        if (!dayState.completed && !firstCurrentFound) {
            status = 'current';
            STATE.currentDayId = index;
            firstCurrentFound = true;
        }

        // Check if Ramadan
        const isRamadan = isDateInRamadan(dayDate);

        const node = createNode(dayData, index, status, isRamadan);
        ELEMENTS.container.appendChild(node);
    });

    if (!firstCurrentFound && strategyData.length > 0) {
        STATE.currentDayId = strategyData.length - 1;
    }

    ELEMENTS.scrollToCurrentBtn.classList.remove('hidden');
}

function parseDate(dateStr) {
    try {
        const year = 2026;
        let dStr = dateStr;
        if (dStr.match(/^\d+-[A-Za-z]+$/)) {
            dStr += `-${year}`;
        }
        const d = new Date(dStr);
        d.setHours(0, 0, 0, 0);
        return d;
    } catch {
        return null;
    }
}

function isDateInRamadan(dateObj) {
    if (!dateObj) return false;
    return dateObj >= RAMADAN_START && dateObj <= RAMADAN_END;
}

function createNode(data, index, status, isRamadan) {
    const isLeft = index % 2 === 0;

    const div = document.createElement('div');
    div.className = `relative z-10 mb-8 flex items-center md:justify-center w-full group transition-all duration-500`;

    // Status Classes
    let statusColorClass = 'bg-slate-700 border-slate-600';
    let iconClass = 'fa-lock text-slate-500';
    let glowClass = '';

    // Ramadan Highlight Override
    let extraBorderClass = '';
    let moonIcon = '';

    if (isRamadan) {
        extraBorderClass = 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
        moonIcon = '<div class="absolute -top-3 -right-3 text-2xl animate-pulse">🌙</div>';
    }

    if (status === 'completed') {
        statusColorClass = 'bg-emerald-900/40 border-emerald-500/50 hover:border-emerald-400';
        iconClass = 'fa-check text-emerald-400';
    } else if (status === 'current') {
        statusColorClass = 'bg-slate-800 border-indigo-500 hover:border-indigo-400';
        iconClass = 'fa-play text-indigo-400';
        glowClass = 'shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-105';
    }

    // Has Revenue?
    const state = getState(index);
    const hasDownloads = state.actualDownloads && state.actualDownloads > 0;
    const revenueBadge = hasDownloads ? `<div class="absolute -bottom-3 right-4 bg-slate-900 border border-slate-600 px-2 py-0.5 rounded-full text-[10px] text-amber-400 font-mono shadow-lg">$${(state.actualDownloads * ARPU).toFixed(0)}</div>` : '';

    const cardHTML = `
        <div class="glass-card w-full md:w-5/12 p-5 rounded-xl border ${statusColorClass} ${extraBorderClass} ${glowClass} cursor-pointer relative overflow-visible group"
             onclick="openModal(${index})">
            
            ${moonIcon}
            ${revenueBadge}

            <!-- Connector Dot -->
            <div class="absolute top-1/2 -translate-y-1/2 ${isLeft ? 'md:-right-12 -left-10' : 'md:-left-12 -left-10'} w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-900 z-20 flex items-center justify-center transition-colors duration-300
                ${status === 'completed' ? '!border-emerald-500 !bg-emerald-500' : ''}
                ${status === 'current' ? '!border-indigo-500 !bg-indigo-500 animate-pulse' : ''}
            ">
                <i class="fas ${status === 'completed' ? 'fa-check text-[10px] text-white' : ''} "></i>
            </div>
            
            <!-- Content -->
            <div class="flex justify-between items-start">
                <div>
                     <div class="text-xs font-mono text-slate-400 mb-1 flex items-center gap-2">
                        <span class="${status === 'current' ? 'text-indigo-400 font-bold' : ''}">${data.date}</span>
                        ${status === 'current' ? '<span class="px-1.5 py-0.5 bg-indigo-500/20 rounded text-[10px] text-indigo-300">BUGÜN</span>' : ''}
                        ${isRamadan ? '<span class="px-1.5 py-0.5 bg-amber-500/20 rounded text-[10px] text-amber-300 border border-amber-500/30">RAMAZAN</span>' : ''}
                     </div>
                     <h3 class="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                        <span class="text-slate-500 mr-2 text-sm">#${data.day_display}</span>
                        ${data.title}
                     </h3>
                     <p class="text-sm text-slate-400 mt-1 line-clamp-2">${data.subtitle}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                     <i class="fas ${iconClass} text-xl"></i>
                     ${state.notes ? '<i class="fas fa-sticky-note text-center text-xs text-yellow-500/70" title="Not var"></i>' : ''}
                </div>
            </div>
            
            <!-- Progress Line (Mini) -->
            ${getState(index).completed ? '<div class="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full rounded-b-xl"></div>' : ''}
        </div>
    `;

    div.innerHTML = cardHTML;

    if (!isLeft) {
        div.classList.add('md:flex-row-reverse');
    }
    div.classList.add('pl-12', 'md:pl-0');

    return div;
}

// Modal Logic
function openModal(index) {
    currentModalDayIndex = index;
    const data = strategyData[index];
    const state = getState(index);
    const dayDate = parseDate(data.date);
    const isRamadan = isDateInRamadan(dayDate);

    // Populate Headers
    ELEMENTS.modal.title.textContent = `${data.title}`;
    ELEMENTS.modal.subtitle.textContent = data.subtitle;
    ELEMENTS.modal.date.textContent = data.date;

    // Phase Label
    if (isRamadan) {
        ELEMENTS.modal.phase.textContent = 'RAMAZAN 🌙';
        ELEMENTS.modal.phase.className = 'px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-xs font-semibold tracking-wide border border-amber-500/30';
    } else {
        ELEMENTS.modal.phase.textContent = data.phase || 'Genel';
        ELEMENTS.modal.phase.className = 'px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs font-semibold tracking-wide';
    }

    ELEMENTS.modal.budget.textContent = data.budget || '-';

    // Metric logic
    const metricText = data.metric || '-';
    ELEMENTS.modal.metric.textContent = metricText;

    // Inputs
    ELEMENTS.modal.notes.value = state.notes || '';
    ELEMENTS.modal.actualDownloads.value = state.actualDownloads || '';

    updateModalRevenue();

    // Tasks
    ELEMENTS.modal.tasksContainer.innerHTML = '';
    data.tasks.forEach((task, i) => {
        const isChecked = state.tasks && state.tasks.includes(i);
        const taskEl = document.createElement('label');
        taskEl.className = 'flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 cursor-pointer hover:bg-slate-700/50 transition-colors custom-checkbox';
        taskEl.innerHTML = `
            <input type="checkbox" class="hidden" ${isChecked ? 'checked' : ''} onchange="toggleTask(${index}, ${i})">
            <div class="w-5 h-5 rounded border border-slate-500 flex items-center justify-center transition-all bg-slate-800 flex-shrink-0 mt-0.5">
                <i class="fas fa-check text-xs text-white opacity-0 transform scale-50 transition-all"></i>
            </div>
            <span class="text-sm text-slate-300 pointer-events-none select-none ${isChecked ? 'line-through text-slate-500' : ''}">${task}</span>
        `;
        ELEMENTS.modal.tasksContainer.appendChild(taskEl);
    });

    updateCompleteButton(state.completed);

    ELEMENTS.modal.backdrop.classList.remove('hidden');
    requestAnimationFrame(() => {
        ELEMENTS.modal.backdrop.classList.remove('opacity-0');
        ELEMENTS.modal.content.classList.remove('opacity-0', 'scale-95');
    });
    document.body.classList.add('modal-open');
}

function updateModalRevenue() {
    const downloads = parseInt(ELEMENTS.modal.actualDownloads.value) || 0;
    const revenue = downloads * ARPU;
    ELEMENTS.modal.modalRevenue.textContent = revenue.toFixed(2);

    if (revenue > 100) {
        ELEMENTS.modal.modalRevenue.classList.add('text-emerald-400');
        ELEMENTS.modal.modalRevenue.classList.remove('text-amber-400');
    } else {
        ELEMENTS.modal.modalRevenue.classList.add('text-amber-400');
        ELEMENTS.modal.modalRevenue.classList.remove('text-emerald-400');
    }
}

function closeModal() {
    ELEMENTS.modal.backdrop.classList.add('opacity-0');
    ELEMENTS.modal.content.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        ELEMENTS.modal.backdrop.classList.add('hidden');
        document.body.classList.remove('modal-open');
        // Refresh roadmap to show notes icon update
        initRoadmap();
    }, 300);
}

// Data Persistence
function getState(index) {
    // Ensure object structure
    if (!STATE.progress[index]) {
        STATE.progress[index] = { completed: false, tasks: [], notes: '', actualDownloads: '' };
    }
    return STATE.progress[index];
}

function saveState() {
    localStorage.setItem('islamvy_roadmap_progress', JSON.stringify(STATE.progress));
    updateGlobalProgress();
}

function saveModalInputs(index) {
    if (!STATE.progress[index]) getState(index);

    STATE.progress[index].notes = ELEMENTS.modal.notes.value;
    STATE.progress[index].actualDownloads = ELEMENTS.modal.actualDownloads.value;

    // Check for High Value input for money rain
    const downloads = parseInt(ELEMENTS.modal.actualDownloads.value) || 0;
    // Simple debounced check could be better but let's just save for now

    saveState();
}

function toggleTask(dayIndex, taskIndex) {
    const state = getState(dayIndex);
    if (!state.tasks) state.tasks = [];

    const existingIdx = state.tasks.indexOf(taskIndex);

    if (existingIdx > -1) {
        state.tasks.splice(existingIdx, 1);
    } else {
        state.tasks.push(taskIndex);
    }

    // UI Update
    const checkboxes = ELEMENTS.modal.tasksContainer.querySelectorAll('input');
    const span = checkboxes[taskIndex].parentElement.querySelector('span');
    if (state.tasks.includes(taskIndex)) {
        span.classList.add('line-through', 'text-slate-500');
    } else {
        span.classList.remove('line-through', 'text-slate-500');
    }

    saveState();
}

function toggleDayCompletion(index) {
    const state = getState(index);
    const isComplete = !state.completed;
    state.completed = isComplete;

    if (isComplete) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#ffffff']
        });
    }

    updateCompleteButton(isComplete);
    saveState();

    // Refresh background UI so if they close modal it's updated
    // (Actually initRoadmap is called on close)
}

function updateCompleteButton(isComplete) {
    const btn = ELEMENTS.modal.completeBtn;
    if (isComplete) {
        btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        btn.classList.remove('bg-slate-700', 'hover:bg-slate-600');
        btn.innerHTML = '<i class="fas fa-undo"></i><span>Geri Al</span>';
    } else {
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        btn.classList.add('bg-slate-700', 'hover:bg-slate-600');
        btn.innerHTML = '<i class="fas fa-check"></i><span>Tamamla</span>';
    }
}

function updateGlobalProgress() {
    const total = strategyData.length;
    let completed = 0;
    let totalDownloads = 0;

    Object.values(STATE.progress).forEach(p => {
        if (p.completed) completed++;
        if (p.actualDownloads) totalDownloads += parseInt(p.actualDownloads);
    });

    const percent = Math.round((completed / total) * 100);
    const totalRevenue = totalDownloads * ARPU;

    ELEMENTS.totalProgress.textContent = `${percent}%`;
    ELEMENTS.progressBar.style.width = `${percent}%`;

    // Update Revenue Card
    if (ELEMENTS.totalRevenue) {
        // Animate up
        ELEMENTS.totalRevenue.textContent = totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    // Update Rank
    updateRank(totalDownloads);
}

function updateRank(totalDownloads) {
    let currentRank = RANKS[0];
    let nextRank = RANKS[1];

    for (let i = 0; i < RANKS.length; i++) {
        if (totalDownloads >= RANKS[i].min) {
            currentRank = RANKS[i];
            nextRank = RANKS[i + 1] || null;
        }
    }

    if (ELEMENTS.currentRank) {
        ELEMENTS.currentRank.textContent = currentRank.name;
        ELEMENTS.currentRank.className = `text-3xl font-bold ${currentRank.color}`;

        if (nextRank) {
            const diff = nextRank.min - totalDownloads;
            ELEMENTS.nextRankProgress.textContent = `Sonraki: ${nextRank.name} (${diff.toLocaleString()} kaldı)`;
        } else {
            ELEMENTS.nextRankProgress.textContent = 'Maksimum Seviye!';
        }
    }
}

function scrollToCurrent() {
    if (STATE.currentDayId !== null) {
        const nodes = ELEMENTS.container.children;
        const target = nodes[STATE.currentDayId + 1];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
