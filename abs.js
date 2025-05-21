// Import Google Sheets functions
import { loadDataFromSheets, saveDataToSheets } from './sheets.js';

// Authentication check
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display full name
    const fullName = sessionStorage.getItem('fullName');
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && fullName) {
        // Define the user icon SVG
        const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" class="user-avatar">
            <circle cx="16" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M4 28C4 21.373 9.373 16 16 16C22.627 16 28 21.373 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;

        userDisplay.innerHTML = `
            <div class="user-profile">
                ${userIconSvg}
                <span class="user-name">${fullName}</span>
                <i class="fas fa-chevron-down"></i>
                <div class="profile-menu">
                    <div class="menu-item logout">
                        <i class="fas fa-sign-out-alt"></i>
                        تسجيل الخروج
                    </div>
                </div>
            </div>
        `;
        
        // Add click handler for profile menu toggle
        const userProfile = userDisplay.querySelector('.user-profile');
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
        });
        
        // Add click handler for logout
        const logoutButton = userDisplay.querySelector('.logout');
        logoutButton.addEventListener('click', function(e) {
            e.stopPropagation();
            // Clear session storage
            sessionStorage.clear();
            // Redirect to login page
            window.location.href = 'login.html';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function() {
            userProfile.classList.remove('active');
        });
    }
}

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', checkAuth);

// Store groups and students data
let groups = [];
let currentGroup = null;

// DOM Elements
const groupsList = document.getElementById('groupsList');
const addGroupBtn = document.getElementById('addGroupBtn');
const addStudentBtn = document.getElementById('addStudentBtn');
const attendanceDate = document.getElementById('attendanceDate');
const selectedGroupTitle = document.getElementById('selectedGroupTitle');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const absenceRecordMenu = document.getElementById('absenceRecordMenu');
const studentNameTitle = document.getElementById('studentNameTitle');
const absenceList = document.getElementById('absenceList');
const totalAbsenceCount = document.getElementById('totalAbsenceCount');
const copyMessageBtn = document.getElementById('copyMessageBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const summaryDate = document.getElementById('summaryDate');
const absenceSummaryModal = document.getElementById('absenceSummaryModal');
const summaryText = document.getElementById('summaryText');
const closeModalBtn = document.querySelector('.close-modal-btn');
const totalTardyCount = document.getElementById('totalTardyCount');

// Set today's date as default for both date inputs
const today = new Date();
today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
attendanceDate.valueAsDate = today;
summaryDate.valueAsDate = today;

// Add event listener for date change
attendanceDate.addEventListener('change', updateAttendanceTable);

// Close absence record menu when clicking the close button
document.querySelector('.close-btn').addEventListener('click', () => {
    absenceRecordMenu.classList.remove('active');
});

// Add Group
addGroupBtn.addEventListener('click', () => {
    const groupName = prompt('أدخل اسم المجموعة:');
    if (groupName) {
        const group = {
            id: Date.now(),
            name: groupName,
            students: []
        };
        groups.push(group);
        updateGroupsList();
        selectGroup(group);
    }
});

// Add Student
addStudentBtn.addEventListener('click', () => {
    if (!currentGroup) {
        alert('الرجاء اختيار مجموعة أولاً');
        return;
    }

    const studentName = prompt('أدخل اسم الطالب:');
    if (studentName) {
        const student = {
            id: Date.now(),
            name: studentName,
            attendanceRecords: {}
        };
        currentGroup.students.push(student);
        updateAttendanceTable();
    }
});

// Update Groups List
function updateGroupsList() {
    groupsList.innerHTML = '';
    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = `group-item ${currentGroup && currentGroup.id === group.id ? 'active' : ''}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = group.name;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteGroup(group.id);
        };

        groupElement.appendChild(nameSpan);
        groupElement.appendChild(deleteBtn);
        
        groupElement.addEventListener('click', () => selectGroup(group));
        groupsList.appendChild(groupElement);
    });
}

// Select Group
function selectGroup(group) {
    currentGroup = group;
    selectedGroupTitle.textContent = `${group.name} - متابعة الحضور`;
    updateGroupsList();
    updateAttendanceTable();
}

// Delete Group
function deleteGroup(groupId) {
    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
        groups = groups.filter(group => group.id !== groupId);
        if (currentGroup && currentGroup.id === groupId) {
            currentGroup = null;
            selectedGroupTitle.textContent = 'متابعة الحضور';
        }
        updateGroupsList();
        updateAttendanceTable();
    }
}

// Show Absence Record
function showAbsenceRecord(student) {
    studentNameTitle.textContent = student.name;
    absenceList.innerHTML = '';
    
    const absenceDates = Object.entries(student.attendanceRecords)
        .filter(([_, record]) => {
            return record.firstPeriod === 'absent' || record.secondPeriod === 'absent' ||
                   record.firstPeriod === 'tardy' || record.secondPeriod === 'tardy';
        })
        .map(([date, record]) => ({
            date: date,
            record: record,
            timestamp: new Date(date).getTime()
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

    absenceDates.forEach(({date, record}) => {
        const absenceRecord = document.createElement('div');
        absenceRecord.className = 'absence-record';
        
        const dateElement = document.createElement('div');
        dateElement.className = 'absence-date';
        
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        dateElement.textContent = formattedDate;
        
        const detailsElement = document.createElement('div');
        detailsElement.className = 'absence-details';
        
        let details = [];
        if (record.firstPeriod === 'absent' && record.secondPeriod === 'absent') {
            details.push('غائب: كلتا الحصتين');
        } else {
            if (record.firstPeriod === 'absent') details.push('غائب: الحصة الأولى');
            if (record.secondPeriod === 'absent') details.push('غائب: الحصة الثانية');
            if (record.firstPeriod === 'tardy') details.push('متأخر: الحصة الأولى');
            if (record.secondPeriod === 'tardy') details.push('متأخر: الحصة الثانية');
        }
        
        detailsElement.textContent = details.join(' | ');
        
        absenceRecord.appendChild(dateElement);
        absenceRecord.appendChild(detailsElement);
        absenceList.appendChild(absenceRecord);
    });
    
    totalAbsenceCount.textContent = calculateTotalAbsences(student);
    totalTardyCount.textContent = calculateTotalTardies(student);
    absenceRecordMenu.classList.add('active');
}

// Update Attendance Table
function updateAttendanceTable() {
    attendanceTableBody.innerHTML = '';
    
    if (!currentGroup) return;

    const currentDate = attendanceDate.value;

    currentGroup.students.forEach(student => {
        const row = document.createElement('tr');
        
        // Name
        const nameCell = document.createElement('td');
        nameCell.className = 'student-name';
        nameCell.textContent = student.name;
        nameCell.onclick = () => showAbsenceRecord(student);
        row.appendChild(nameCell);
        
        // First Period
        const firstPeriodCell = document.createElement('td');
        firstPeriodCell.appendChild(createAttendanceButtons(student, currentDate, 'firstPeriod'));
        row.appendChild(firstPeriodCell);
        
        // Second Period
        const secondPeriodCell = document.createElement('td');
        secondPeriodCell.appendChild(createAttendanceButtons(student, currentDate, 'secondPeriod'));
        row.appendChild(secondPeriodCell);
        
        // Total Absences
        const totalCell = document.createElement('td');
        totalCell.textContent = calculateTotalAbsences(student);
        row.appendChild(totalCell);
        
        // Total Tardies
        const tardyCell = document.createElement('td');
        tardyCell.textContent = calculateTotalTardies(student);
        row.appendChild(tardyCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'حذف';
        deleteBtn.onclick = () => deleteStudent(student.id);
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);
        
        attendanceTableBody.appendChild(row);
    });
}

// Create Attendance Buttons
function createAttendanceButtons(student, date, period) {
    const container = document.createElement('div');
    
    // Create dropdown for mobile
    const dropdown = document.createElement('div');
    dropdown.className = 'status-dropdown';
    
    const dropdownBtn = document.createElement('button');
    dropdownBtn.className = 'status-dropdown-btn';
    
    // Get the current attendance status
    const status = student.attendanceRecords[date]?.[period];
    
    // Set button text and class based on current status
    dropdownBtn.textContent = status ? getStatusText(status) : 'الحضور';
    if (status) {
        dropdownBtn.classList.add(status);
    }
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'status-options';
    
    // Create options
    const statuses = [
        { value: 'present', text: 'حاضر' },
        { value: 'absent', text: 'غائب' },
        { value: 'tardy', text: 'متأخر' }
    ];
    
    statuses.forEach(({ value, text }) => {
        const option = document.createElement('div');
        option.className = `status-option ${value}`;
        option.textContent = text;
        option.onclick = (e) => {
            e.stopPropagation();
            toggleAttendance(student, date, period, value);
            closeAllDropdowns();
        };
        optionsDiv.appendChild(option);
    });
    
    // Toggle dropdown on button click
    dropdownBtn.onclick = (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        optionsDiv.classList.toggle('active');
    };
    
    dropdown.appendChild(dropdownBtn);
    dropdown.appendChild(optionsDiv);
    
    // Create regular buttons for desktop
    const presentBtn = document.createElement('button');
    const tardyBtn = document.createElement('button');
    const absentBtn = document.createElement('button');
    
    presentBtn.className = `status-btn ${status === 'present' ? 'present' : ''}`;
    tardyBtn.className = `status-btn ${status === 'tardy' ? 'tardy' : ''}`;
    absentBtn.className = `status-btn ${status === 'absent' ? 'absent' : ''}`;
    
    presentBtn.textContent = 'حاضر';
    tardyBtn.textContent = 'متأخر';
    absentBtn.textContent = 'غائب';
    
    presentBtn.onclick = () => toggleAttendance(student, date, period, 'present');
    tardyBtn.onclick = () => toggleAttendance(student, date, period, 'tardy');
    absentBtn.onclick = () => toggleAttendance(student, date, period, 'absent');
    
    container.appendChild(dropdown);
    container.appendChild(presentBtn);
    container.appendChild(tardyBtn);
    container.appendChild(absentBtn);
    
    return container;
}

// Helper function to get status text in Arabic
function getStatusText(status) {
    const statusTexts = {
        present: 'حاضر',
        absent: 'غائب',
        tardy: 'متأخر'
    };
    return statusTexts[status] || 'الحضور';
}

// Close all dropdowns when clicking outside
document.addEventListener('click', () => {
    closeAllDropdowns();
});

// Helper function to close all dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('.status-options.active').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

// Toggle Attendance
function toggleAttendance(student, date, period, newStatus) {
    // Initialize the date record if it doesn't exist
    if (!student.attendanceRecords[date]) {
        student.attendanceRecords[date] = {};
    }
    
    // Toggle the attendance status
    if (student.attendanceRecords[date][period] === newStatus) {
        // If clicking the same status, remove the record
        delete student.attendanceRecords[date][period];
    } else {
        // Set the new status
        student.attendanceRecords[date][period] = newStatus;
    }
    
    // Clean up empty date records
    if (Object.keys(student.attendanceRecords[date]).length === 0) {
        delete student.attendanceRecords[date];
    }
    
    updateAttendanceTable();
}

// Calculate Total Absences across all dates
function calculateTotalAbsences(student) {
    let totalAbsences = 0;
    
    Object.values(student.attendanceRecords).forEach(dayRecord => {
        if (dayRecord.firstPeriod === 'absent') totalAbsences += 0.5;
        if (dayRecord.secondPeriod === 'absent') totalAbsences += 0.5;
    });
    
    return totalAbsences;
}

// Calculate Total Tardies
function calculateTotalTardies(student) {
    let totalTardies = 0;
    
    Object.values(student.attendanceRecords).forEach(dayRecord => {
        if (dayRecord.firstPeriod === 'tardy') totalTardies += 1;
        if (dayRecord.secondPeriod === 'tardy') totalTardies += 1;
    });
    
    return totalTardies;
}

// Delete Student
function deleteStudent(studentId) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        currentGroup.students = currentGroup.students.filter(student => student.id !== studentId);
        updateAttendanceTable();
    }
}

// Generate and show absence summary
copyMessageBtn.addEventListener('click', () => {
    generateAbsenceSummary();
    absenceSummaryModal.classList.add('active');
});

// Send message via WhatsApp
sendMessageBtn.addEventListener('click', () => {
    const summary = generateAbsenceSummaryText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`;
    window.open(whatsappUrl, '_blank');
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    absenceSummaryModal.classList.remove('active');
});

// Generate absence summary
function generateAbsenceSummary() {
    const summary = generateAbsenceSummaryText();
    summaryText.value = summary;
}

// Generate the summary text
function generateAbsenceSummaryText() {
    const date = summaryDate.value;
    const [year, month, day] = date.split('-');
    const dateObj = new Date(year, month - 1, day);
    
    // Get day name in Arabic
    const dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'long' });
    
    let summaryText = `الغياب يوم ${dayName} ${formatDate(date)}:\n`;
    let hasRecords = false;

    groups.forEach(group => {
        const studentsWithRecords = group.students.filter(student => {
            const record = student.attendanceRecords[date];
            return record && (record.firstPeriod === 'absent' || record.secondPeriod === 'absent' ||
                            record.firstPeriod === 'tardy' || record.secondPeriod === 'tardy');
        });

        if (studentsWithRecords.length > 0) {
            hasRecords = true;
            summaryText += `\n${group.name}:\n`;
            studentsWithRecords.forEach((student, index) => {
                const record = student.attendanceRecords[date];
                let details = [];
                
                if (record.firstPeriod === 'absent' && record.secondPeriod === 'absent') {
                    details.push('غائب: كلتا الحصتين');
                } else {
                    if (record.firstPeriod === 'absent') details.push('غائب: الحصة الأولى');
                    if (record.secondPeriod === 'absent') details.push('غائب: الحصة الثانية');
                    if (record.firstPeriod === 'tardy') details.push('متأخر: الحصة الأولى');
                    if (record.secondPeriod === 'tardy') details.push('متأخر: الحصة الثانية');
                }
                
                summaryText += `${index + 1}- ${student.name} (${details.join(' | ')})\n`;
            });
        }
    });

    if (!hasRecords) {
        summaryText += '\nلا يوجد غياب أو تأخير لهذا اليوم';
    }

    return summaryText;
}

// Format date for display
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Add click event for copying text
summaryText.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(summaryText.value);
        alert('تم نسخ النص بنجاح');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
});

// Add save to sheets functionality
function saveToSheets() {
    saveDataToSheets(groups);
}

// Add load from sheets functionality
async function loadFromSheets() {
    await loadDataFromSheets();
    updateGroupsList();
    updateAttendanceTable();
}

// Add save button to the header
const header = document.querySelector('.header');
const saveButton = document.createElement('button');
saveButton.className = 'add-btn';
saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ في جوجل شيت';
saveButton.onclick = saveToSheets;
header.appendChild(saveButton);

// Load data when page loads
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadFromSheets();
});

// Initialize the page
updateGroupsList();