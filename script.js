const monthLabel = document.getElementById('monthLabel');
const calendarGrid = document.getElementById('calendarGrid');
const selectedDateText = document.getElementById('selectedDate');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedDate = null;

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderCalendar(year, month) {
  monthLabel.textContent = `${year} 年 ${month + 1} 月`;
  calendarGrid.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      otherMonth: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      otherMonth: false,
    });
  }

  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    cells.push({
      date: new Date(year, month + 1, day),
      otherMonth: true,
    });
  }

  cells.forEach(({ date, otherMonth }) => {
    const dayBtn = document.createElement('button');
    dayBtn.className = 'day';
    dayBtn.textContent = String(date.getDate());

    if (otherMonth) dayBtn.classList.add('other-month');
    if (formatDate(date) === formatDate(today)) dayBtn.classList.add('today');
    if (selectedDate && formatDate(date) === formatDate(selectedDate)) {
      dayBtn.classList.add('selected');
    }

    dayBtn.addEventListener('click', () => {
      selectedDate = date;
      selectedDateText.textContent = `已选择：${formatDate(date)}`;
      if (otherMonth) {
        viewYear = date.getFullYear();
        viewMonth = date.getMonth();
      }
      renderCalendar(viewYear, viewMonth);
    });

    calendarGrid.appendChild(dayBtn);
  });
}

prevMonthBtn.addEventListener('click', () => {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderCalendar(viewYear, viewMonth);
});

nextMonthBtn.addEventListener('click', () => {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderCalendar(viewYear, viewMonth);
});

todayBtn.addEventListener('click', () => {
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();
  selectedDate = new Date(today);
  selectedDateText.textContent = `已选择：${formatDate(selectedDate)}`;
  renderCalendar(viewYear, viewMonth);
});

renderCalendar(viewYear, viewMonth);
