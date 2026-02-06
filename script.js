
// State Management
const STATE = {
    progress: JSON.parse(localStorage.getItem('islamvy_roadmap_progress')) || {}, // { "0": { completed: true, tasks: [0, 1] } }
    currentDayId: null // "0" corresponds to index in strategyData
};

const ELEMENTS = {
    container: document.getElementById('roadmapContainer'),
    progressBar: document.getElementById('progressBar'),
    totalProgress: document.getElementById('totalProgress'),
    completedCount: document.getElementById('completedCount'),
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
        completeBtn: document.getElementById('completeDayBtn')
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
});

// Build the roadmap
function initRoadmap() {
    ELEMENTS.container.innerHTML = ''; // Clear

    // Add center line back (it was cleared)
    const centerLine = document.createElement('div');
    centerLine.className = 'absolute left-8 md:left-1/2 top-4 bottom-0 w-0.5 bg-slate-800 md:-translate-x-1/2 z-0';
    ELEMENTS.container.appendChild(centerLine);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let firstCurrentFound = false;

    strategyData.forEach((dayData, index) => {
        // Determine Status
        let status = 'future';
        let isPast = false;

        // Attempt to parse date "15-Feb" -> 2026-02-15
        const currentYear = 2026; // Manual year per context
        // This date parsing is a bit tricky with "15-Feb", assuming English months.
        // Let's rely on index logic or exact date match if possible. 
        // Or simply logic: if it's marked completed in state -> completed.
        // If not completed, checks date.

        const dayState = STATE.progress[index] || { completed: false, tasks: [] };

        // If completed by user interaction
        if (dayState.completed) {
            status = 'completed';
        } else {
            // Check date against today
            // strategyData has "date": "15-Feb" or "2026-02-15"
            // Let's try to normalize date
            try {
                // If format is like "15-Feb"
                let dateStr = dayData.date;
                // Add year if missing
                if (dateStr.match(/^\d+-[A-Za-z]+$/)) {
                    dateStr += `-${currentYear}`;
                }
                const dayDate = new Date(dateStr);
                dayDate.setHours(0, 0, 0, 0);

                if (dayDate < today) {
                    status = 'completed'; // Auto-mark past as completed? Or 'missed'? Let's sticking to manual completion for 'game' feel, but mark visual style
                    // Actually, let's keep it 'future' (locked/gray) if not done, but 'current' if it is today.
                    // If it's essentially "next up", it's current.
                }

                if (dayDate.getTime() === today.getTime()) {
                    status = 'current';
                }
            } catch (e) {
                console.warn("Date parsing error", e);
            }
        }

        // Logic for "Current Active Day": The first non-completed day
        if (!dayState.completed && !firstCurrentFound) {
            status = 'current';
            STATE.currentDayId = index;
            firstCurrentFound = true;
        }

        const node = createNode(dayData, index, status);
        ELEMENTS.container.appendChild(node);
    });

    // If all completed
    if (!firstCurrentFound && strategyData.length > 0) {
        STATE.currentDayId = strategyData.length - 1;
    }

    // Show scroll btn if scrolled away (simple logic for now, just show it)
    ELEMENTS.scrollToCurrentBtn.classList.remove('hidden');
}

function createNode(data, index, status) {
    const isLeft = index % 2 === 0;

    const div = document.createElement('div');
    // Mobile: all align left (ml-16). Desktop: alternate (ml-auto / mr-auto) logic handled by grid/flex or absolute
    // Let's use a relative flex row for simplicity

    div.className = `relative z-10 mb-8 flex items-center md:justify-center w-full group transition-all duration-500`;

    // Status Classes
    let statusColorClass = 'bg-slate-700 border-slate-600';
    let iconClass = 'fa-lock text-slate-500';
    let glowClass = '';

    if (status === 'completed') {
        statusColorClass = 'bg-emerald-900/40 border-emerald-500/50 hover:border-emerald-400';
        iconClass = 'fa-check text-emerald-400';
    } else if (status === 'current') {
        statusColorClass = 'bg-slate-800 border-indigo-500 hover:border-indigo-400';
        iconClass = 'fa-play text-indigo-400';
        glowClass = 'shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-105';
    }

    // HTML Structure
    // Desktop: Alternating Left/Right cards. Center is the timeline.
    // We'll use absolute positioning from center for desktop visuals or flex gap.

    const cardHTML = `
        <div class="glass-card w-full md:w-5/12 p-5 rounded-xl border ${statusColorClass} ${glowClass} cursor-pointer relative overflow-hidden group"
             onclick="openModal(${index})">
            
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
                     </div>
                     <h3 class="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                        <span class="text-slate-500 mr-2 text-sm">#${data.day_display}</span>
                        ${data.title}
                     </h3>
                     <p class="text-sm text-slate-400 mt-1 line-clamp-2">${data.subtitle}</p>
                </div>
                <div class="flex flex-col items-end gap-2">
                     <i class="fas ${iconClass} text-xl"></i>
                </div>
            </div>
            
            <!-- Progress Line (Mini) -->
            ${getState(index).completed ? '<div class="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full"></div>' : ''}
        </div>
    `;

    // Alignment wrapper
    // Mobile: Always left aligned (with a margin for line). Desktop: Alternate
    div.innerHTML = cardHTML;

    // Styles for alternation
    if (!isLeft) {
        div.classList.add('md:flex-row-reverse');
    }

    // Add mobile spacing
    div.classList.add('pl-12', 'md:pl-0');

    return div;
}

// Modal Logic
function openModal(index) {
    currentModalDayIndex = index;
    const data = strategyData[index];
    const state = getState(index);

    // Populate
    ELEMENTS.modal.title.textContent = `Gün ${data.day_display}`; // Using day_display from data
    ELEMENTS.modal.subtitle.textContent = data.title; // Using title as subtitle in modal 
    // Wait, let's map correctly:
    // Card Title -> Data Title (Unnamed: 3)
    // Card Subtitle -> Data Subtitle (Unnamed: 4)
    // Adjusting for modal:
    ELEMENTS.modal.title.textContent = `${data.title}`;
    ELEMENTS.modal.subtitle.textContent = data.subtitle;

    ELEMENTS.modal.date.textContent = data.date;
    ELEMENTS.modal.phase.textContent = data.phase || 'Genel';
    ELEMENTS.modal.budget.textContent = data.budget || '-';
    ELEMENTS.modal.metric.textContent = data.metric || '-';

    // Tasks
    ELEMENTS.modal.tasksContainer.innerHTML = '';
    data.tasks.forEach((task, i) => {
        const isChecked = state.tasks.includes(i);
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

    // Update Button State
    updateCompleteButton(state.completed);

    // Show
    ELEMENTS.modal.backdrop.classList.remove('hidden');
    // Small delay for fade in
    requestAnimationFrame(() => {
        ELEMENTS.modal.backdrop.classList.remove('opacity-0');
        ELEMENTS.modal.content.classList.remove('opacity-0', 'scale-95');
    });
    document.body.classList.add('modal-open');
}

function closeModal() {
    ELEMENTS.modal.backdrop.classList.add('opacity-0');
    ELEMENTS.modal.content.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        ELEMENTS.modal.backdrop.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }, 300);
}

// Data Persistence
function getState(index) {
    return STATE.progress[index] || { completed: false, tasks: [] };
}

function saveState() {
    localStorage.setItem('islamvy_roadmap_progress', JSON.stringify(STATE.progress));
    updateGlobalProgress();
}

function toggleTask(dayIndex, taskIndex) {
    if (!STATE.progress[dayIndex]) STATE.progress[dayIndex] = { completed: false, tasks: [] };

    const tasks = STATE.progress[dayIndex].tasks;
    const existingIdx = tasks.indexOf(taskIndex);

    if (existingIdx > -1) {
        tasks.splice(existingIdx, 1);
    } else {
        tasks.push(taskIndex);
    }

    // Visual update of line-through
    // Re-render tasks? Or direct DOM manipulation?
    // Let's just re-render modal tasks for simplicity or toggle class on parent
    const checkboxes = ELEMENTS.modal.tasksContainer.querySelectorAll('input');
    const span = checkboxes[taskIndex].parentElement.querySelector('span');
    if (tasks.includes(taskIndex)) {
        span.classList.add('line-through', 'text-slate-500');
    } else {
        span.classList.remove('line-through', 'text-slate-500');
    }

    saveState();
}

function toggleDayCompletion(index) {
    if (!STATE.progress[index]) STATE.progress[index] = { completed: false, tasks: [] };

    const isComplete = !STATE.progress[index].completed;
    STATE.progress[index].completed = isComplete;

    if (isComplete) {
        // Confetti!
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#ffffff']
        });

        // Also verify if all tasks should be checked? 
        // Let's leave tasks independent but usually users check all.
    }

    updateCompleteButton(isComplete);
    saveState();

    // Refresh Roadmap UI (Status change)
    initRoadmap();

    // Close modal after brief delay if completed? No let user close.
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

    Object.values(STATE.progress).forEach(p => {
        if (p.completed) completed++;
    });

    const percent = Math.round((completed / total) * 100);

    ELEMENTS.totalProgress.textContent = `${percent}%`;
    ELEMENTS.completedCount.textContent = completed;
    ELEMENTS.progressBar.style.width = `${percent}%`;
}

function scrollToCurrent() {
    if (STATE.currentDayId !== null) {
        const nodes = ELEMENTS.container.children;
        // The first child is the centerLine, so index + 1
        const target = nodes[STATE.currentDayId + 1];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
