// دعم طلبات preflight (OPTIONS) لحل مشكلة CORS
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// معالجة طلبات POST
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    let result;
    switch (data.action) {
      case 'saveData':
        result = saveData(data.values);
        break;
      case 'getData':
        result = getData();
        break;
      default:
        throw new Error('Invalid action: ' + data.action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      values: result
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// معالجة طلبات GET
function doGet(e) {
  try {
    let result;
    switch (e.parameter.action) {
      case 'getData':
        result = getData();
        break;
      default:
        throw new Error('Invalid action: ' + e.parameter.action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      values: result
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// حفظ البيانات في الشيت
function saveData(values) {
  try {
    if (!values || !Array.isArray(values)) {
      throw new Error('Invalid data format: values must be an array');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.clear();
    
    if (values.length > 0) {
      const numRows = values.length;
      const numCols = values[0].length;
      sheet.getRange(1, 1, numRows, numCols).setValues(values);
    }
    
    return values;
  } catch (error) {
    throw new Error('Failed to save data: ' + error.toString());
  }
}

// جلب البيانات من الشيت
function getData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data;
  } catch (error) {
    throw new Error('Failed to get data: ' + error.toString());
  }
} 