// Google Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwNORQM36TLII97dEFsfGQLIplpaQ20jl044KE7m4vGqf7Ln8irxiSKJT2Yyb1VcAKWEg/exec';

// Function to load data from Google Sheets
async function loadDataFromSheets() {
    try {
        const url = new URL(WEB_APP_URL);
        url.searchParams.append('action', 'getData');

        const response = await fetch(url.toString(), {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.values) {
            processSheetData(data.values);
        } else {
            throw new Error(data.error || 'Failed to load data');
        }
    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        if (error.message.includes('Failed to fetch')) {
            alert('حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
        } else {
            alert('حدث خطأ أثناء تحميل البيانات من جوجل شيت: ' + error.message);
        }
    }
}

// Function to save data to Google Sheets
async function saveDataToSheets(data) {
    try {
        const values = convertDataToSheetFormat(data);
        const formData = new FormData();
        formData.append('action', 'saveData');
        formData.append('values', JSON.stringify(values));

        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            alert('تم حفظ البيانات بنجاح');
        } else {
            throw new Error(result.error || 'Failed to save data');
        }
    } catch (error) {
        console.error('Error saving data to Google Sheets:', error);
        if (error.message.includes('Failed to fetch')) {
            alert('حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
        } else {
            alert('حدث خطأ أثناء حفظ البيانات في جوجل شيت: ' + error.message);
        }
    }
}

// Helper function to convert local data to sheet format
function convertDataToSheetFormat(data) {
    const sheetData = [];
    
    // Add headers
    sheetData.push(['اسم الطالب', 'الحصة الأولى', 'الحصة الثانية', 'مجموع الغياب', 'مجموع التأخير']);
    
    // Add data rows
    data.forEach(group => {
        group.students.forEach(student => {
            const firstPeriod = student.attendanceRecords[new Date().toISOString().split('T')[0]]?.firstPeriod || '';
            const secondPeriod = student.attendanceRecords[new Date().toISOString().split('T')[0]]?.secondPeriod || '';
            
            sheetData.push([
                student.name,
                firstPeriod,
                secondPeriod,
                calculateTotalAbsences(student),
                calculateTotalTardies(student)
            ]);
        });
    });
    
    return sheetData;
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

// Helper function to process sheet data into local format
function processSheetData(sheetData) {
    if (!sheetData || sheetData.length < 2) return; // Need at least header and one row
    
    // Find the header row (it contains "اسم الطالب")
    const headerRowIndex = sheetData.findIndex(row => row.includes('اسم الطالب'));
    if (headerRowIndex === -1) return;
    
    // Get data rows after the header
    const dataRows = sheetData.slice(headerRowIndex + 1);
    
    // Create a new group for the data
    const group = {
        id: Date.now(),
        name: 'المجموعة الرئيسية',
        students: []
    };
    
    // Process each row
    dataRows.forEach(row => {
        if (row[4]) { // If there's a student name (now at index 4)
            const student = {
                id: Date.now() + Math.random(),
                name: row[4],
                attendanceRecords: {}
            };
            
            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];
            
            // Create attendance record for today
            student.attendanceRecords[today] = {
                firstPeriod: row[3] || '',  // First period status at index 3
                secondPeriod: row[2] || ''  // Second period status at index 2
            };
            
            group.students.push(student);
        }
    });
    
    // Update the global groups array
    groups = [group];
    currentGroup = group;
}

// Export functions
export {
    loadDataFromSheets,
    saveDataToSheets
}; 
